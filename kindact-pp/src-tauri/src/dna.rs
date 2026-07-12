//! DNA installation and app client setup for Kindact.
//!
//! Kindact ships a single DNA version (`kindact_v1_0`). The multi-version
//! migration *machinery* (extra client slots, migration reads) is retained
//! but dormant: `install_dnas()` installs only the active version and
//! `setup_app_interface()` returns `None` for every legacy client. It lights
//! up the first time a second DNA version ships (see `migration.rs`).
//!
//! ## For forking developers
//!
//! This file manages the Holochain app lifecycle:
//!   - `install_dnas()` — Installs your hApp bundle
//!   - `setup_app_interface()` — Creates WebSocket connections for zome calls
//!
//! Change the version constants at the top to match your app/hApp names.
//! The `"kindact"` string passed to `AdminWebsocket::connect()` and
//! `AppWebsocket::connect()` is an origin identifier — change it to your app name.
//! The installation and WebSocket logic is otherwise app-agnostic.

use holochain_client::{
    AdminWebsocket, AllowedOrigins, AppStatusFilter, AppWebsocket,
    AuthorizeSigningCredentialsPayload, CellInfo, ClientAgentSigner, InstallAppPayload,
    IssueAppAuthenticationTokenPayload,
};
use holochain_types::app::AppBundleSource;
use holochain_types::prelude::AgentPubKey;
use std::path::Path;

// ── Version constants ─────────────────────────────────────────────────
//
// When adding a new version:
//   1. Add APP_ID_V1_X and HAPP_FILE_V1_X constants
//   2. Update ACTIVE_APP_ID to point to the new version
//   3. Update install_dnas() to install the new version
//   4. Add migration logic in migration.rs

pub const APP_ID_V1_0: &str = "kindact_v1_0";

const HAPP_FILE_V1_0: &str = "kindact_v1_0_happ.happ";

/// The active version for all new reads and writes.
pub const ACTIVE_APP_ID: &str = APP_ID_V1_0;

/// Result of the DNA installation phase.
///
/// Kindact runs a single DNA version, so `needs_migration` is always `false`
/// and every `v1_x_available` flag is always `false`. These fields are kept
/// so the migration plumbing stays wired (and ready to light up) when a
/// second DNA version is introduced.
pub struct InstallResult {
    pub agent_pub_key: AgentPubKey,
    /// Always false — there is no prior version to migrate from yet.
    pub needs_migration: bool,
    /// Always false — no legacy v1.0 cell is installed.
    pub v1_0_available: bool,
    /// Always false — no legacy v1.1 cell is installed.
    pub v1_1_available: bool,
    /// Always false — no legacy v1.2 cell is installed.
    pub v1_2_available: bool,
}

/// Install the Kindact DNA (single version `kindact_v1_0`).
///
/// - Fresh install: installs `kindact_v1_0`.
/// - Already installed: re-enables it (reinstalling if it was left disabled).
///
/// The multi-version migration machinery is dormant: this always reports
/// `needs_migration = false` and no legacy versions available.
pub async fn install_dnas(
    admin_port: u16,
    resource_dir: &Path,
) -> Result<InstallResult, String> {
    let admin_ws = AdminWebsocket::connect(
        format!("localhost:{}", admin_port),
        Some("kindact".to_string()),
    )
    .await
    .map_err(|e| format!("Failed to connect to admin WebSocket: {}", e))?;

    let existing_apps = admin_ws
        .list_apps(None)
        .await
        .map_err(|e| format!("Failed to list apps: {}", e))?;

    let mut installed = false;
    let mut agent_key: Option<AgentPubKey> = None;

    for app in &existing_apps {
        if app.installed_app_id == APP_ID_V1_0 {
            if matches!(app.status, holochain_types::prelude::AppStatus::Disabled(_)) {
                log::warn!("Kindact DNA disabled, reinstalling...");
                admin_ws
                    .uninstall_app(APP_ID_V1_0.to_string(), false)
                    .await
                    .map_err(|e| format!("Failed to uninstall disabled Kindact DNA: {}", e))?;
            } else {
                installed = true;
                agent_key = Some(app.agent_pub_key.clone());
                admin_ws
                    .enable_app(APP_ID_V1_0.to_string())
                    .await
                    .map_err(|e| format!("Failed to re-enable Kindact DNA: {}", e))?;
            }
        }
    }

    // Install the DNA if not already present.
    if !installed {
        let happ_path = resource_dir.join(HAPP_FILE_V1_0);
        if !happ_path.exists() {
            return Err(format!(
                "Kindact hApp bundle not found at {:?}",
                happ_path
            ));
        }

        log::info!("Installing Kindact DNA from {:?}...", happ_path);
        let payload = InstallAppPayload {
            source: AppBundleSource::Path(happ_path),
            agent_key: None,
            installed_app_id: Some(APP_ID_V1_0.to_string()),
            network_seed: None,
            roles_settings: None,
            ignore_genesis_failure: false,
        };

        let app_info = admin_ws
            .install_app(payload)
            .await
            .map_err(|e| format!("Failed to install Kindact DNA: {}", e))?;

        admin_ws
            .enable_app(APP_ID_V1_0.to_string())
            .await
            .map_err(|e| format!("Failed to enable Kindact DNA: {}", e))?;

        agent_key = Some(app_info.agent_pub_key);
        log::info!("Kindact DNA installed and enabled");
    }

    // Force re-enable to recover any disabled cells from previous runs.
    if let Err(e) = admin_ws.enable_app(APP_ID_V1_0.to_string()).await {
        log::warn!("Could not re-enable Kindact DNA: {}", e);
    }

    // Verify the DNA is enabled.
    let enabled_apps = admin_ws
        .list_apps(Some(AppStatusFilter::Enabled))
        .await
        .map_err(|e| format!("Failed to verify installed apps: {}", e))?;

    let enabled = enabled_apps
        .iter()
        .any(|app| app.installed_app_id == APP_ID_V1_0);

    if !enabled {
        return Err("Kindact DNA installation verification failed".to_string());
    }

    let agent_pub_key = agent_key.ok_or("No agent key after installation")?;

    Ok(InstallResult {
        agent_pub_key,
        needs_migration: false,
        v1_0_available: false,
        v1_1_available: false,
        v1_2_available: false,
    })
}

/// Attach an app interface, authorize signing credentials, and connect the
/// active AppWebsocket.
///
/// Kindact runs a single DNA version, so the three legacy client slots in the
/// returned tuple are always `None`. The `v1_x_available` parameters are kept
/// (and ignored) so the migration plumbing stays wired for a future second
/// version.
///
/// Returns (app_port, active_client, None, None, None).
pub async fn setup_app_interface(
    admin_port: u16,
    _v1_0_available: bool,
    _v1_1_available: bool,
    _v1_2_available: bool,
) -> Result<(u16, AppWebsocket, Option<AppWebsocket>, Option<AppWebsocket>, Option<AppWebsocket>), String> {
    let admin_ws = AdminWebsocket::connect(
        format!("localhost:{}", admin_port),
        Some("kindact".to_string()),
    )
    .await
    .map_err(|e| format!("Failed to connect to admin WebSocket: {}", e))?;

    let app_port = admin_ws
        .attach_app_interface(0, None, AllowedOrigins::Any, None)
        .await
        .map_err(|e| format!("Failed to attach app interface: {}", e))?;

    log::info!("App interface attached on port {}", app_port);

    // Ensure all cells are actually ready before we try to authorize them.
    // The conductor can report Enabled status while cells are still
    // initializing after a restart — calling authorize_signing_credentials
    // too early returns CellDisabled. This pre-check waits up to ~18s with
    // periodic re-enable attempts so the per-cell loop below sees ready
    // cells. Without this, dev sessions left idle for a while come back to
    // life with disabled cells and zome calls silently fail.
    ensure_apps_enabled(&admin_ws).await;

    // Authorize signing credentials for every provisioned cell.
    let signer = ClientAgentSigner::default();
    let apps = admin_ws
        .list_apps(Some(AppStatusFilter::Enabled))
        .await
        .map_err(|e| format!("Failed to list apps: {}", e))?;

    for app in &apps {
        for cells in app.cell_info.values() {
            for cell in cells {
                if let CellInfo::Provisioned(provisioned) = cell {
                    let cell_id = provisioned.cell_id.clone();
                    match admin_ws
                        .authorize_signing_credentials(AuthorizeSigningCredentialsPayload {
                            cell_id: cell_id.clone(),
                            functions: None,
                        })
                        .await
                    {
                        Ok(creds) => {
                            signer.add_credentials(cell_id, creds);
                            log::info!(
                                "Signing credentials authorized for cell in {}",
                                app.installed_app_id
                            );
                        }
                        Err(e) => {
                            let e_str = e.to_string();
                            if e_str.contains("CellDisabled") {
                                // Cell is disabled even though the app showed as Enabled —
                                // this can happen after conductor restarts. Re-enable and retry.
                                log::warn!(
                                    "Cell disabled in {}, re-enabling and retrying...",
                                    app.installed_app_id
                                );
                                if let Err(enable_err) = admin_ws
                                    .enable_app(app.installed_app_id.clone())
                                    .await
                                {
                                    log::warn!(
                                        "Could not re-enable {}: {}. Signing skipped.",
                                        app.installed_app_id, enable_err
                                    );
                                } else {
                                    match admin_ws
                                        .authorize_signing_credentials(
                                            AuthorizeSigningCredentialsPayload {
                                                cell_id: cell_id.clone(),
                                                functions: None,
                                            },
                                        )
                                        .await
                                    {
                                        Ok(creds) => {
                                            signer.add_credentials(cell_id, creds);
                                            log::info!(
                                                "Signing credentials authorized for cell in {} (after re-enable)",
                                                app.installed_app_id
                                            );
                                        }
                                        Err(retry_err) => {
                                            log::warn!(
                                                "Still could not authorize signing for cell in {} after re-enable: {}. Skipping.",
                                                app.installed_app_id, retry_err
                                            );
                                        }
                                    }
                                }
                            } else {
                                // Non-CellDisabled error — log and skip.
                                log::warn!(
                                    "Could not authorize signing for cell in {}: {}. Skipping.",
                                    app.installed_app_id, e
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    let signer_arc: std::sync::Arc<dyn holochain_client::AgentSigner + Send + Sync> = signer.into();

    // Connect the active AppWebsocket.
    let token = admin_ws
        .issue_app_auth_token(
            IssueAppAuthenticationTokenPayload::for_installed_app_id(ACTIVE_APP_ID.into())
                .expiry_seconds(0)
                .single_use(false),
        )
        .await
        .map_err(|e| format!("Failed to issue app auth token: {}", e))?;

    let app_ws = AppWebsocket::connect(
        format!("localhost:{}", app_port),
        token.token,
        signer_arc,
        Some("kindact".to_string()),
    )
    .await
    .map_err(|e| format!("Failed to connect app WebSocket: {}", e))?;

    log::info!("App WebSocket connected on port {}", app_port);

    // Single-version app: no legacy clients to connect.
    Ok((app_port, app_ws, None, None, None))
}

/// Re-enable any disabled apps + verify cells are actually ready before
/// callers try to authorize signing credentials.
///
/// The conductor can report Enabled status while cells are still
/// initializing after a restart — calling authorize_signing_credentials too
/// early returns CellDisabled. This helper waits up to ~18 seconds with
/// periodic re-enable attempts, retrying until a probe authorize succeeds
/// or we run out of attempts.
///
/// Idempotent and safe to call multiple times. Failures here are logged but
/// don't propagate — the per-cell auth loop in the caller handles the
/// remaining cell-by-cell skip behaviour.
pub async fn ensure_apps_enabled(admin_ws: &AdminWebsocket) {
    let apps = match admin_ws.list_apps(None).await {
        Ok(a) => a,
        Err(e) => {
            log::warn!("ensure_apps_enabled: list_apps failed: {}", e);
            return;
        }
    };

    for app in &apps {
        if let Err(e) = admin_ws.enable_app(app.installed_app_id.clone()).await {
            log::warn!(
                "ensure_apps_enabled: failed to enable {}: {}",
                app.installed_app_id,
                e,
            );
        }
    }

    // Pick the active version's cell as the probe. authorize_signing_credentials
    // will return CellDisabled until cells are truly ready.
    let probe_cell = apps
        .iter()
        .find(|a| a.installed_app_id == ACTIVE_APP_ID)
        .and_then(|app| {
            app.cell_info.values().flat_map(|cells| cells.iter()).find_map(|c| {
                if let CellInfo::Provisioned(p) = c {
                    Some(p.cell_id.clone())
                } else {
                    None
                }
            })
        });

    let Some(cell_id) = probe_cell else {
        return;
    };

    for attempt in 1..=6 {
        match admin_ws
            .authorize_signing_credentials(AuthorizeSigningCredentialsPayload {
                cell_id: cell_id.clone(),
                functions: None,
            })
            .await
        {
            Ok(_) => {
                if attempt > 1 {
                    log::info!(
                        "ensure_apps_enabled: cells ready after {}s wait",
                        (attempt - 1) * 3,
                    );
                } else {
                    log::info!("ensure_apps_enabled: cells ready");
                }
                return;
            }
            Err(e) => {
                let err_str = format!("{}", e);
                if err_str.contains("CellDisabled") && attempt < 6 {
                    log::info!(
                        "ensure_apps_enabled: cells not ready yet (attempt {}), waiting 3s...",
                        attempt,
                    );
                    tokio::time::sleep(std::time::Duration::from_secs(3)).await;
                    // Re-enable all apps before retrying — sometimes the
                    // conductor needs the enable_app nudge more than once.
                    for app in &apps {
                        let _ = admin_ws.enable_app(app.installed_app_id.clone()).await;
                    }
                } else {
                    log::warn!("ensure_apps_enabled: cell readiness check failed: {}", e);
                    return;
                }
            }
        }
    }
}
