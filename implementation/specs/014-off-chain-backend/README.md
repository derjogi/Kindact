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
- '005'
- '016'
- '017'
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

REST or GraphQL API serving the frontend. Combines on-chain indexed data with AT Proto record data. This is the Kindact AppView. Key endpoints:

- Issues: list, detail, search
- Lenses: list, detail, subscribe/mute, overlay configuration
- Deliberation: comments, pro/con arguments, proposals
- Voting: status, tallies, eligibility
- Users: profiles, token balances, contribution history
- Work reports: submission, evidence, verification status
- Metrics: baseline bundles, dimension packs, confidence, provenance
- Exports: canonical raw-data views for audit and interoperability

### Extensibility Runtime

The backend owns the global off-chain module catalog and the issue protocol resolution engine described in 016-extensibility-foundation.

- Resolve matching lens overlays into `IssueProtocolBinding`
- Persist procedural snapshots when issue phases open
- Serve module manifests and fallback renderer metadata to clients
- Keep raw data available even when a UI only presents a summarized view

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
- Module hook runtime with validators, side effects, read models, async jobs, and notification emitters
- Pluggable AI providers
- Alternative AppView operators using the same data sources

Validators may reject or normalize module-specific input before commit, but they must not silently change binding outcomes, resolved protocol bindings, or snapshotted rules.

If input is normalized, the backend must emit an audit record and return the transformed payload explicitly to the caller before final commit.

## Plan

1. Scaffold project (Node.js/TypeScript, PostgreSQL, Redis)
2. Implement chain indexer with reorg handling
3. Implement AT Proto relay subscription (firehose consumer, lexicon filtering)
4. Implement AppView API (REST/GraphQL)
5. Implement auth (EIP-4361 + AT Proto OAuth)
6. Implement job queue (batch anchoring, background tasks)
7. Implement AI service integration (provider registry)
8. Integration tests against local chain + AT Proto test PDS

## Test

- Chain indexer: mock events, verify DB state, simulate reorgs
- Relay subscription: mock firehose events, verify record indexing, handle malformed records
- API: endpoint tests with seeded data, auth flow tests
- Auth: valid/invalid signature handling, AT Proto OAuth flow, identity status checks
- Job queue: job execution, retry, failure handling
- AI services: provider switching, graceful degradation

## Notes

- Prototype (Next.js/Prisma) provides reference patterns; this is a clean rebuild optimized for the Diamond + AT Proto architecture.
- Indexer design should anticipate new facets being added to the Diamond without backend redeployment.
- The non-authoritative design means data integrity is guaranteed by AT Proto's signed repo model, not by this backend.
- AI provider registry should support hot-swapping providers without restart.
- This spec is now the main off-chain owner of lenses, overlays, protocol bindings, canonical exports, and visibility/prominence rules.
