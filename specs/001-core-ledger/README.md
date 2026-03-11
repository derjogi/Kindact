---
status: planned
created: '2026-03-17'
tags:
  - infrastructure
  - mvp
  - foundation
priority: critical
created_at: '2026-03-17T11:07:37.770Z'
---

# Core Event Ledger

> **Phase**: MVP · **Priority**: Critical · **Subsystem**: Infrastructure

## Overview

Append-only event system for all platform mutations. Full payloads stay off-chain; every event is content-addressed and hash-linked.

This is the foundation layer — all other specs emit events through this system.

On-chain anchoring (merkle batching to EVM L2) is deferred to Phase 2 — PostgreSQL with strict append-only constraints is the source of truth at MVP.

## Design

### Data Models

- **Event** — immutable mutation record: `actor`, `object_type`, `object_id`, `payload_hash`, `prev_hash`, `timestamp`
- **ContentBlob** — content-addressed payload storage (S3-compatible)

### API Surface

- `GET /events` — query events with filters
- `GET /events/:id` — single event detail
- `GET /objects/:type/:id/history` — full mutation history for any object

### Architecture Decisions

- PostgreSQL as event store with append-only constraint (no UPDATE/DELETE on events table)
- Content-addressed blobs in S3-compatible storage (local MinIO acceptable at MVP)
- Read models are materialized views rebuilt from events
- On-chain anchoring deferred to Phase 2

## Plan

- [ ] Design event schema and content-addressing strategy
- [ ] Implement append-only event store in PostgreSQL
- [ ] Build content-addressed blob storage integration
- [ ] Build event query API with filtering and pagination
- [ ] Build object history reconstruction endpoint
- [ ] Implement read model replay from genesis (deterministic)

## Test

- [ ] Events are truly immutable (no update/delete possible)
- [ ] Read models can be deterministically rebuilt from event replay
- [ ] Content blobs are retrievable by hash

## Notes

**Phase 2:** Add merkle tree batching and on-chain anchoring to EVM L2 once the core system is stable. Consider IPFS pinning for high-value evidence at that point.
