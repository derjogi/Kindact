# Implementation Plan - UI: Dashboard & Discovery

Create a premium, high-fidelity frontend dashboard for the Kindact Holochain application based on spec [018-015a-ui-dashboard](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/018-015a-ui-dashboard/README.md) and tailored to real multi-agent Holochain execution.

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decision: Real Multi-Peer Holochain Development**
> - The local environment uses `@holochain/hc-spin` to run the hApp. When you execute `npm start`, `hc-spin` automatically spawns **multiple distinct Electron windows** (one window per agent node).
> - Each window runs a real, independent Holochain conductor node with its own private `AgentPubKey` and local source chain, gossiping over a local DHT network.
> - `hc-spin` injects a connection object (`window.__HC_LAUNCHER_ENV__`) into each window containing that agent's unique WebSocket port and authentication token.
> - **The Plan**: The UI will connect to the real active agent node in each window automatically. To distinguish the windows:
>   - The header will dynamically display the active agent’s profile: **Elena (Agent #1)** or **Marcus (Agent #2)** based on their node instance, along with their real cryptographic `AgentPubKey`.
>   - When Elena posts a new issue in Window #1, the Holochain DHT gossips it over the network. Window #2 (Marcus) will dynamically fetch and show Elena's issue from the DHT!
>   - This gives us a **100% authentic, real decentralized test** without needing a fake simulated database in production.

> [!TIP]
> **Developer Standalone Fallback**
> - When running the UI standalone in a regular browser (via `npm run dev` inside `ui/`) without launching the full Holochain dev shell, the UI will fall back to a high-fidelity mock client.
> - This allows you to hot-reload CSS/Lit layout changes in milliseconds and manually switch profiles in a single tab, enabling rapid frontend iteration.

## Proposed Changes

### Frontend Design System & Entry Point

#### [MODIFY] [index.css](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/kindact-hc/ui/src/index.css)
- Implement a premium Dark Mode Glassmorphic styling system using HSL color tokens.
- Add utility variables for gradients, glass backgrounds (`backdrop-filter`), shadows, and responsive layouts.
- Style state badges (Deliberation, Voting, Implementing, Completed, Challenged).
- Style custom card structures, interactive inputs, and layout modules.

#### [MODIFY] [holochain-app.ts](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/kindact-hc/ui/src/holochain-app.ts)
- Replace the boilerplate launcher template with the full Kindact Dashboard.
- Connect to the real local Holochain conductor port injected via `window.__HC_LAUNCHER_ENV__`.
- Query `appInfo()` to retrieve the real `AgentPubKey` and dynamically determine the Agent Persona (Agent #1 as Elena, Agent #2 as Marcus, etc.).
- Query active cell entries from the Zomes:
  - Query `global_registry` cells for anchor subscriptions and claims.
  - Query `manhattan_windturbine` and `housing` cells for issues and comments.
- Render three presentation layers:
  1. **Header & Agent Persona Bar**: Displays the real Agent name, public key, and active network connection indicator.
  2. **Dashboard Grid (Layer D Modules)**:
     - *Left Column*: **$CC Wallet Widget** (exponential demurrage decay curve rendering) and **Lens Manager** (follow/mute controls for topics like `#wind-power`, `#housing`, location hints).
     - *Center Column*: **Global Search with AI Duplicate Scanner** and **Dynamic Issue Discovery Feed** (expanded details, progressive disclosure, Phase badges, comment list, and "Request Guest Access" actions).
     - *Right Column*: **Notification Center** (delegation alerts, vote results, new challenges) and **Community Activity Stream** (live feed of actions).

---

### DNA & Zome TypeScript Type Definitions

#### [MODIFY] [types.ts (global_registry)](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/kindact-hc/ui/src/global_registry/registry/types.ts)
- Add TypeScript definitions matching the Rust types for `CellEntry`, `AnchorEntry`, `AnchorLinkEntry`, `SubscriptionEntry`, and `JurisdictionalClaimEntry`.

#### [MODIFY] [types.ts (housing)](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/kindact-hc/ui/src/housing/housing/types.ts)
- Add TypeScript definitions matching the Rust types for `HousingIssue` and `BindingChallenge`.

#### [MODIFY] [types.ts (manhattan_windturbine)](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/kindact-hc/ui/src/manhattan_windturbine/wind_turbine/types.ts)
- Add TypeScript definitions matching the Rust types for `IssueEntry` and `CommentEntry`.

---

## Verification Plan

### Automated Verification
- Verify the Vite server runs and builds without any TypeScript or styling errors:
  ```bash
  npm run build --workspace ui
  ```

### Manual Verification & Demo Walkthrough
1. Build the WebAssembly Zomes and package the hApp bundle inside the Nix shell:
   ```bash
   nix develop --command npm run build:happ
   ```
2. Launch the multi-agent sandbox:
   ```bash
   nix develop --command npm start
   ```
   *Note: This will open multiple independent Electron windows for Elena (Agent 1) and Marcus (Agent 2).*
3. In Elena's window (Agent 1):
   - Create a new wind-power issue "Manhattan Offshore Substation".
   - Notice the status badge is `Deliberating`.
4. In Marcus's window (Agent 2):
   - Toggle follow on `#wind-power` in the Lens Manager.
   - The Manhattan issue gossiped over the DHT appears in Marcus's discovery feed!
5. Verify the **$CC Balance Widget** demurrage curve displays an interactive countdown decaying according to the demurrage rate.
