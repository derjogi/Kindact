//! Subscription persistence test for spec 049.
//!
//! Asserts the load-bearing property from
//! `holochain/specs/049-prototype-anchor-subscription-discovery/README.md`:
//!
//! > Subscriptions persist across restart: stop both agents, restart,
//! > verify each agent's subscription set survives via
//! > `registry::get_subscriptions`.
//!
//! `hc-spin` runs sandboxes in a fresh tmpdir per launch, so the manual
//! "stop & restart hc-spin" path can't prove this. Instead we drive a
//! `SweetConductor` end-to-end: install the real packed `global_registry`
//! DNA, write subscriptions, `shutdown()` + `startup()` the conductor in
//! place (preserves on-disk LMDB + keystore), and re-query.
//!
//! Run with `npm run test` (which packs the DNA first) or directly via
//! `cargo test -p registry --test persistence`.

use std::path::PathBuf;

use holochain::prelude::ActionHash;
use holochain::sweettest::{SweetConductor, SweetDnaFile};

/// Path to the packed `global_registry.dna`, relative to this crate.
/// Produced by `npm run build:happ` (which `npm run test` invokes).
const DNA_BUNDLE: &str = "../../../workdir/global_registry.dna";

fn dna_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(DNA_BUNDLE)
}

#[tokio::test(flavor = "multi_thread")]
async fn subscriptions_survive_conductor_restart() {
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
        .setup_app("kindact-registry-persistence", [&dna_file])
        .await
        .expect("install global_registry app");
    let cell = app.cells().first().expect("one cell installed").clone();
    let zome = cell.zome("registry");

    // ── Pre-restart: write two subscriptions, confirm they round-trip. ──────
    let _: ActionHash = conductor
        .call(&zome, "subscribe", "#wind-power".to_string())
        .await;
    let _: ActionHash = conductor
        .call(&zome, "subscribe", "#housing".to_string())
        .await;

    let mut before: Vec<String> = conductor.call(&zome, "get_subscriptions", ()).await;
    before.sort();
    assert_eq!(
        before,
        vec!["#housing".to_string(), "#wind-power".to_string()],
        "pre-restart subscriptions should reflect both writes",
    );

    // ── Restart in place. ───────────────────────────────────────────────────
    // `shutdown` drops the running handle but keeps `db_dir` + keystore on
    // disk; `startup(false)` re-opens the same data root and re-loads the
    // ribosome from the DNA file cache. The agent pubkey and source chain
    // survive across the boundary.
    conductor.shutdown().await;
    conductor.startup(false).await;

    // ── Post-restart: same subscriptions must still be there. ───────────────
    let mut after: Vec<String> = conductor.call(&zome, "get_subscriptions", ()).await;
    after.sort();
    assert_eq!(
        after, before,
        "subscriptions must survive a conductor restart unchanged",
    );

    // ── Spot-check: unsubscribe + restart still observes the deletion. ──────
    let _: () = conductor
        .call(&zome, "unsubscribe", "#housing".to_string())
        .await;
    conductor.shutdown().await;
    conductor.startup(false).await;
    let after_unsub: Vec<String> = conductor.call(&zome, "get_subscriptions", ()).await;
    assert_eq!(
        after_unsub,
        vec!["#wind-power".to_string()],
        "unsubscribe must also persist across restart",
    );
}
