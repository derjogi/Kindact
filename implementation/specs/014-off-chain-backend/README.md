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

# 014 – Off-Chain Backend

## Overview

The off-chain backend bridges smart contracts and frontend. It indexes on-chain state, resolves lens overlays into issue protocol bindings, serves combined on/off-chain data via API, manages content storage, and integrates AI services.

## Design

### Chain Indexer

Listens to on-chain events from the Diamond, indexes into a read-optimized PostgreSQL database. Tracks: issues, votes, token balances, disputes, verifications, protocol snapshots, and module-facing metadata. Handles reorgs via confirmation depth and rollback logic. Libraries: viem (or ethers.js), alternatively a subgraph (The Graph) for declarative indexing.

### API Layer

REST or GraphQL API serving the frontend. Combines on-chain indexed data with off-chain content. Key endpoints:

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

### Content Storage

IPFS integration (Pinata or web3.storage) for content-addressed blob storage. Manages pinning lifecycle, garbage collection, and retrieval. All content hashes anchored on-chain via ContentAnchoringFacet.

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
- Database: PostgreSQL (indexed on-chain + off-chain data)
- Queue: Redis (BullMQ or similar)
- Content: IPFS via pinning service
- Chain: viem for RPC, WebSocket for event streaming

### Extension Points

- Additional indexer modules per new Diamond facet
- Module hook runtime with validators, side effects, read models, async jobs, and notification emitters
- Pluggable AI providers
- Pluggable storage backends (IPFS, Arweave, S3 fallback)

Validators may reject or normalize module-specific input before commit, but they must not silently change binding outcomes, resolved protocol bindings, or snapshotted rules.

If input is normalized, the backend must emit an audit record and return the transformed payload explicitly to the caller before final commit.

## Plan

1. Scaffold project (Node.js/TypeScript, PostgreSQL, Redis)
2. Implement chain indexer with reorg handling
3. Implement API layer (REST/GraphQL)
4. Implement content storage service (IPFS integration)
5. Implement auth middleware (EIP-4361)
6. Implement job queue (background tasks)
7. Implement AI service integration (provider registry)
8. Integration tests against local chain + services

## Test

- Chain indexer: mock events, verify DB state, simulate reorgs
- API: endpoint tests with seeded data, auth flow tests
- Content storage: upload/retrieve roundtrip, pinning lifecycle
- Auth: valid/invalid signature handling, identity status checks
- Job queue: job execution, retry, failure handling
- AI services: provider switching, graceful degradation

## Notes

- Prototype (Next.js/Prisma) provides reference patterns; this is a clean rebuild optimized for the Diamond architecture.
- Indexer design should anticipate new facets being added to the Diamond without backend redeployment.
- AI provider registry should support hot-swapping providers without restart.
- This spec is now the main off-chain owner of lenses, overlays, protocol bindings, canonical exports, and visibility/prominence rules.
