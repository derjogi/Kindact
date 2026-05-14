---
status: planned
created: 2026-04-03
priority: high
tags:
- infrastructure
- backend
- off-chain
depends_on:
- 001-diamond-module-registry
- 004-content-anchoring
- 005-issue-lifecycle
- 030-extensibility-foundation
- 031-core-metrics-framework
created_at: 2026-04-05T10:28:37.249053051Z
updated_at: 2026-04-05T10:28:53.944279978Z
---

# 014 – Off-Chain Backend (Kindact AppView)

## Overview

The off-chain backend bridges smart contracts and frontend. It indexes on-chain state, resolves lens overlays into issue protocol bindings, serves combined on/off-chain data via API, manages content storage, and integrates AI services.

## Design

### Chain Indexer

Listens to on-chain events from the Diamond, indexes into a read-optimized PostgreSQL database. Tracks: issues, votes, token balances, disputes, verifications, protocol snapshots, and module-facing metadata. Handles reorgs via confirmation depth and rollback logic. Libraries: viem (or ethers.js), alternatively a subgraph (The Graph) for declarative indexing.

### Database Schema

PostgreSQL schema indexing both on-chain and AT Proto data:

**Core tables**: `issues` (on-chain state + indexed content), `users` (wallet + DID mapping, humanity score), `token_accounts` (demurrage-adjusted balances), `votes` (per-issue tallies), `work_packages`, `claims`, `disputes`, `delegations`.

**AT Proto tables**: `deliberation_comments`, `deliberation_arguments`, `ai_summaries`, `work_reports`, `hypercert_records`.

**Audit**: `ledger_events` — append-only event log with `actor`, `objectType`, `objectId`, `action`, `payloadHash`, `prevHash`, `eventHash` for tamper-evident history.

### AT Proto Relay Subscription

Subscribes to the AT Proto relay firehose, filters for Kindact lexicon records (`org.kindact.*`) and Hypercerts records (`org.hypercerts.*`), and indexes them into PostgreSQL. This is the primary ingestion path for off-chain user content — issues, deliberation arguments, work reports, profiles. The backend may run its own PDS or subscribe to external relays.

### AppView API

REST or GraphQL API serving the frontend. Combines on-chain indexed data with AT Proto record data. This is the Kindact AppView.

**The API is a published, versioned contract**, not "whatever endpoints the v1 backend happens to expose". The OpenAPI / GraphQL schema is checked into the repo under `implementation/api-spec/` and treated as the authoritative interface between any AppView and any frontend. The v1 backend is one implementation of this spec; v2 may host alternative AppViews against the same chain + AT Proto data without reverse-engineering this backend.

Key endpoints:

- Issues: list, detail, search
- Lenses: list, detail, subscribe/mute, overlay configuration
- Deliberation: comments, pro/con arguments, proposals
- Voting: status, tallies, eligibility
- Users: profiles, token balances, contribution history
- Work reports: submission, evidence, verification status
- Metrics: baseline bundles, dimension packs, confidence, provenance
- Exports: canonical raw-data views for audit and interoperability

### Extensibility Runtime

The backend owns the global off-chain module catalog and the issue protocol resolution engine described in 030-extensibility-foundation.

- Resolve matching lens overlays into `IssueProtocolBinding`, with each entry pinned to a versioned module id (`<namespace>/<key>@<semver>`)
- Compute the canonical-JSON hash of the binding and submit it as `protocolBindingHash` on the on-chain issue record at creation
- Persist procedural snapshots when issue phases open (snapshots also pin fully versioned module ids)
- Serve module manifests and fallback renderer metadata to clients
- Keep raw data available even when a UI only presents a summarized view

#### Manifests as Data

Module manifests are JSON/YAML files (`manifest.json`) committed next to each module's code. At build time the backend reads every manifest in the monorepo and registers it into the **module catalog table**. Module code is only invoked through hooks if a manifest is registered for the exact module id; manifestless code is unreachable by the runtime.

The manifest schema is fixed (see 030 — `id`, `slot`, `multiplicity`, `depends_on`, `incompatible_with`, `produces`, `read_fallback`, `maturity`, `permissions`, `migrations`). v1 loads manifests at build time; v2 will load them dynamically from a content-addressed registry. The loader changes; the manifest contract does not.

#### Capability-Based Hook APIs

Every hook invocation receives a typed **`ctx`** object whose surface is determined by the module's manifest `permissions`. Ambient access (raw DB, raw chain client, raw notifier) is forbidden inside module code by convention.

Initial capability set for v1:

| Capability | Provides |
|------------|----------|
| `issues.read` | `ctx.issues.readById(id)`, scoped read access to core issue data |
| `moduleData.readOwn` | `ctx.moduleData.read(entityType, entityId)` scoped to this module's namespace |
| `moduleData.writeOwn` | `ctx.moduleData.write(entityType, entityId, payload)` scoped to this module's namespace |
| `notify.emit` | `ctx.notify.emit(channel, body)` for module-specific notification types declared in the manifest |
| `events.subscribe` | `ctx.events.on(eventName, handler)` for the domain events listed above |

A module declaring only `issues.read` cannot see other modules' data, cannot write anywhere, and cannot send notifications. v1 wires `ctx` from real implementations; nothing physically prevents a module from reaching ambient state, but doing so is grounds for code-review rejection. In v2 the same `ctx` is replaced with a sandbox proxy.

#### Module-Scoped Storage

Module-specific off-chain state lives in a single `module_data` table:

```
module_data (
  module_namespace text,
  module_key text,
  entity_type text,    -- e.g. "issue", "claim", "comment"
  entity_id text,
  payload jsonb,
  updated_at timestamptz,
  primary key (module_namespace, module_key, entity_type, entity_id)
)
```

Core entities remain strictly typed in their own tables; modules never extend or alter them. The `moduleData.writeOwn` capability rejects writes whose `(module_namespace, module_key)` does not match the calling module's manifest id.

### Geographic Taxonomy

Backend stores and serves the canonical location taxonomy shared by user profiles, issues, and lenses.

- User-provided location hints are optional discovery signals
- Location refs are canonical IDs, not arbitrary labels
- Geography must not silently grant governance rights by itself

**API contracts** (to be defined in detail during implementation):
- Request/response types for each endpoint group
- Pagination via cursor-based pagination
- Error responses: structured `{ code, message, details }` format
- Rate limiting: per-DID and per-wallet

### Content Storage

AT Proto handles content storage via PDS repos. The backend no longer manages IPFS pinning directly — AT Proto PDS handles blob storage for user-created content. All content hashes are still anchored on-chain via ContentAnchoringFacet (004).

### AI Services

Provider-agnostic AI integration using a registry pattern (informed by prototype's 024-ai-provider-registry):

- Duplicate detection for new issues
- Issue improvement suggestions
- Deliberation summarization
- Eligibility quiz generation

AI services remain assistive only. They may suggest, summarize, or classify, but they must not silently mutate binding issue outcomes.

### Auth Middleware

Wallet-based authentication via EIP-4361 (Sign-In with Ethereum). Maps wallet address → user profile. Checks identity verification status from on-chain IdentityRegistry.

### Job Queue

Redis-backed background jobs for: batch content anchoring, protocol binding resolution, notification generation, AI summarization runs, metric recalculation, and other module async tasks.

### Tech Stack

- Runtime: Node.js / TypeScript (informed by prototype)
- Database: PostgreSQL (indexed on-chain + AT Proto data)
- Queue: Redis (BullMQ or similar)
- Content: AT Proto PDS subscription + relay firehose
- Chain: viem for RPC, WebSocket for event streaming
- AT Proto: `@atproto/api`, `@hypercerts-org/lexicon`

### Extension Points

- Additional indexer modules per new Diamond facet
- Module hook runtime with validators, side effects, read models, async jobs, and notification emitters — invoked via the capability-based `ctx` surface defined above
- Pluggable AI providers
- Alternative AppView operators using the same data sources (chain events + AT Proto firehose) and the published API spec

Validators may reject or normalize module-specific input before commit, but they must not silently change binding outcomes, resolved protocol bindings, or snapshotted rules.

If input is normalized, the backend must emit an audit record and return the transformed payload explicitly to the caller before final commit.

## Plan

1. Scaffold project (Node.js/TypeScript, PostgreSQL, Redis)
2. Check the published API spec (`implementation/api-spec/`) into the repo and wire CI to fail on drift between code and spec
3. Implement chain indexer with reorg handling
4. Implement AT Proto relay subscription (firehose consumer, lexicon filtering)
5. Implement protocol-binding resolver and canonical-JSON hashing (writes `protocolBindingHash` on issue creation)
6. Implement module catalog table + build-time manifest loader
7. Implement `module_data` table and the capability-based `ctx` runtime
8. Implement AppView API (REST/GraphQL) against the published spec
9. Implement auth (EIP-4361 + AT Proto OAuth)
10. Implement job queue (batch anchoring, background tasks)
11. Implement AI service integration (provider registry)
12. Integration tests against local chain + AT Proto test PDS

## Test

- Chain indexer: mock events, verify DB state, simulate reorgs
- Relay subscription: mock firehose events, verify record indexing, handle malformed records
- API: endpoint tests with seeded data, auth flow tests
- API: conformance test — every endpoint in the published API spec is implemented; no endpoint exists outside the spec
- Protocol-binding resolver: deterministic canonical-JSON output for a given (issue scope, lens overlay set, catalog version)
- Catalog: a module whose manifest is missing is rejected at build time
- Capability ctx: a hook receives only the capabilities declared in its manifest; calling an undeclared capability raises a clear runtime error
- `moduleData.writeOwn` rejects writes whose namespace/key does not match the calling module
- Auth: valid/invalid signature handling, AT Proto OAuth flow, identity status checks
- Job queue: job execution, retry, failure handling
- AI services: provider switching, graceful degradation

## Notes

- Prototype (Next.js/Prisma) provides reference patterns; this is a clean rebuild optimized for the Diamond + AT Proto architecture.
- Indexer design should anticipate new facets being added to the Diamond without backend redeployment.
- The non-authoritative design means data integrity is guaranteed by AT Proto's signed repo model, not by this backend.
- AI provider registry should support hot-swapping providers without restart.
- This spec is now the main off-chain owner of lenses, overlays, protocol bindings, canonical exports, and visibility/prominence rules.
