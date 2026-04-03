---
status: planned
created: '2026-04-03'
tags: [infrastructure, backend, off-chain]
priority: high
depends_on:
  - 001-diamond-module-registry
  - 004-content-anchoring
  - 006-deliberation-service
---

# 014 – Off-Chain Backend

## Overview

The off-chain backend bridges smart contracts and frontend. It indexes on-chain state, serves combined on/off-chain data via API, manages content storage, and integrates AI services.

## Design

### Chain Indexer

Listens to on-chain events from the Diamond, indexes into a read-optimized PostgreSQL database. Tracks: issues, votes, token balances, disputes, verifications. Handles reorgs via confirmation depth and rollback logic. Libraries: viem (or ethers.js), alternatively a subgraph (The Graph) for declarative indexing.

### API Layer

REST or GraphQL API serving the frontend. Combines on-chain indexed data with off-chain content. Key endpoints:

- Issues: list, detail, search
- Deliberation: comments, pro/con arguments, proposals
- Voting: status, tallies, eligibility
- Users: profiles, token balances, contribution history
- Work reports: submission, evidence, verification status

### Content Storage

IPFS integration (Pinata or web3.storage) for content-addressed blob storage. Manages pinning lifecycle, garbage collection, and retrieval. All content hashes anchored on-chain via ContentAnchoringFacet.

### AI Services

Provider-agnostic AI integration using a registry pattern (informed by prototype's 024-ai-provider-registry):

- Duplicate detection for new issues
- Issue improvement suggestions
- Deliberation summarization
- Eligibility quiz generation

### Auth Middleware

Wallet-based authentication via EIP-4361 (Sign-In with Ethereum). Maps wallet address → user profile. Checks identity verification status from on-chain IdentityRegistry.

### Job Queue

Redis-backed background jobs for: batch content anchoring, demurrage checkpoint triggers, notification generation, AI summarization runs.

### Tech Stack

- Runtime: Node.js / TypeScript (informed by prototype)
- Database: PostgreSQL (indexed on-chain + off-chain data)
- Queue: Redis (BullMQ or similar)
- Content: IPFS via pinning service
- Chain: viem for RPC, WebSocket for event streaming

### Extension Points

- Additional indexer modules per new Diamond facet
- Pluggable AI providers
- Pluggable storage backends (IPFS, Arweave, S3 fallback)

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
