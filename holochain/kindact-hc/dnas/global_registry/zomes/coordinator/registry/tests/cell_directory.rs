//! Cell-directory persistence test for spec 050.
//!
//! Asserts the load-bearing property from
//! `holochain/specs/050-prototype-dynamic-cell-creation-and-join/README.md`:
//!
//! > `cargo test -p registry` passes a new `cells_round_trip_across_restart`
//! > (writes via `register_cell`, restarts conductor, reads via
//! > `get_all_cells`, asserts the same descriptor survives).
//!
//! Also covers the idempotency contract: `register_cell` with a
//! previously-seen `dna_hash` returns the existing action hash and does not
//! grow the directory.

use std::path::PathBuf;

use holochain::prelude::{ActionHash, DnaHash};
use holochain::sweettest::{SweetConductor, SweetDnaFile};
use registry::RegisterCellInput;
use registry_integrity::CellEntry;

const DNA_BUNDLE: &str = "../../../workdir/global_registry.dna";

fn dna_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(DNA_BUNDLE)
}

/// Synthesise a deterministic DnaHash for test fixtures. The bytes don't
/// have to match a real DNA — they just need to round-trip through serde.
fn fake_dna_hash(seed_byte: u8) -> DnaHash {
    let mut raw = vec![0x84u8, 0x2d, 0x24]; // multihash prefix (uhCkk...)
    raw.extend(std::iter::repeat(seed_byte).take(32));
    raw.extend(&[0u8, 0, 0, 0]); // 4-byte loc suffix
    DnaHash::from_raw_39(raw)
}

#[tokio::test(flavor = "multi_thread")]
async fn cells_round_trip_across_restart() {
    let dna_path = dna_path();
    assert!(
        dna_path.exists(),
        "Packed DNA not found at {dna_path:?}. Run `npm run build:happ` first \
         (or use `npm run test`, which builds before invoking cargo test).",
    );

    let dna_file = SweetDnaFile::from_bundle(&dna_path)
        .await
        .expect("load global_registry.dna");

    let mut conductor = SweetConductor::from_standard_config().await;
    let app = conductor
        .setup_app("kindact-registry-cells", [&dna_file])
        .await
        .expect("install global_registry app");
    let cell = app.cells().first().expect("one cell installed").clone();
    let zome = cell.zome("registry");

    // ── Pre-restart: register two community cells. ──────────────────────────
    let brooklyn_hash = fake_dna_hash(0xb1);
    let kreuzberg_hash = fake_dna_hash(0xc2);
    let _: ActionHash = conductor
        .call(
            &zome,
            "register_cell",
            RegisterCellInput {
                name: "Brooklyn Cyclists".to_string(),
                role_name: "manhattan_windturbine".to_string(),
                network_seed: "kindact-community-brooklyn-cyclists".to_string(),
                dna_hash: brooklyn_hash.clone(),
            },
        )
        .await;
    let _: ActionHash = conductor
        .call(
            &zome,
            "register_cell",
            RegisterCellInput {
                name: "Kreuzberg Repair Cafe".to_string(),
                role_name: "manhattan_windturbine".to_string(),
                network_seed: "kindact-community-kreuzberg".to_string(),
                dna_hash: kreuzberg_hash.clone(),
            },
        )
        .await;

    let before: Vec<(ActionHash, CellEntry)> =
        conductor.call(&zome, "get_all_cells", ()).await;
    assert_eq!(before.len(), 2, "directory should have both cells");
    let mut before_names: Vec<String> = before.iter().map(|(_, c)| c.name.clone()).collect();
    before_names.sort();
    assert_eq!(
        before_names,
        vec![
            "Brooklyn Cyclists".to_string(),
            "Kreuzberg Repair Cafe".to_string(),
        ],
    );
    for (_, cell) in &before {
        assert_eq!(cell.status, "active", "status must be stamped server-side");
        assert_eq!(cell.role_name, "manhattan_windturbine");
    }

    // ── Idempotency: re-registering the same dna_hash is a no-op. ───────────
    let dup_hash: ActionHash = conductor
        .call(
            &zome,
            "register_cell",
            RegisterCellInput {
                name: "Brooklyn Cyclists DUPLICATE".to_string(),
                role_name: "manhattan_windturbine".to_string(),
                network_seed: "different-seed-but-same-hash".to_string(),
                dna_hash: brooklyn_hash.clone(),
            },
        )
        .await;
    let original_brooklyn_hash = before
        .iter()
        .find(|(_, c)| c.name == "Brooklyn Cyclists")
        .map(|(h, _)| h.clone())
        .expect("original brooklyn entry");
    assert_eq!(
        dup_hash, original_brooklyn_hash,
        "idempotent re-register must return the original action hash"
    );
    let after_dup: Vec<(ActionHash, CellEntry)> =
        conductor.call(&zome, "get_all_cells", ()).await;
    assert_eq!(
        after_dup.len(),
        2,
        "idempotent register must not grow the directory"
    );

    // ── Restart in place. ───────────────────────────────────────────────────
    conductor.shutdown().await;
    conductor.startup(false).await;

    // ── Post-restart: same cells must still be there. ───────────────────────
    let after: Vec<(ActionHash, CellEntry)> =
        conductor.call(&zome, "get_all_cells", ()).await;
    let mut after_names: Vec<String> = after.iter().map(|(_, c)| c.name.clone()).collect();
    after_names.sort();
    assert_eq!(
        after_names, before_names,
        "cell directory must survive a conductor restart unchanged"
    );

    // Spot-check that the DNA hash field round-tripped without corruption.
    let brooklyn_after = after
        .iter()
        .find(|(_, c)| c.name == "Brooklyn Cyclists")
        .expect("brooklyn entry survived restart");
    assert_eq!(brooklyn_after.1.dna_hash, brooklyn_hash);
}
