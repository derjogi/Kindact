---
status: planned
created: '2026-04-09'
tags: [governance, taxonomy, smart-contracts]
priority: high
derivation: ported
ports_from: 028-tag-registry
depends_on:
  - 004-content-anchoring
  - 005-issue-lifecycle
  - 013-meta-governance
---

# 028 — Tag Registry & Issue Tag Snapshot

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [028-tag-registry](../../../implementation/specs/028-tag-registry/README.md)

## Hybrid notes

Ported. Under the hybrid, tags are anchors per [042](../042-anchor-and-subscription-model/README.md). The tag registry concept maps to the anchor governance model (creation, deprecation, merge, hierarchy).


## Overview

Canonical on-chain tag registry for governance-relevant tags. Off-chain issue content can contain free-form tags and AI suggestions, but delegation, voting, and other governance logic requires stable on-chain tag identifiers. This spec introduces a `TagRegistryFacet` and a frozen governance tag snapshot per issue.

## Design

### TagRegistryFacet

On-chain registry of canonical governance tags within the Diamond.

**Tag record:**

| Field | Type | Description |
|-------|------|-------------|
| id | bytes32 | Keccak256 of normalized slug |
| slug | string | Lowercase, hyphenated canonical name (e.g., `environment`) |
| createdBy | address | Who registered the tag |
| createdAt | uint48 | Registration timestamp |
| deprecated | bool | Soft-deleted — cannot be assigned to new issues |

- Tags are created by verified humans (humanity score >= threshold via 002)
- Tag creation is permissionless for verified humans in v1; governance can restrict via 013
- Slugs are normalized: lowercase, trimmed, hyphen-separated, max 64 chars
- Duplicate slug registration reverts

### Tag Aliases & Merging

- A tag can have **aliases** — alternative slugs that resolve to the same canonical `id`
- Merging two tags: one becomes an alias of the other. Requires meta-governance vote (013)
- Deprecating a tag: marks it as `deprecated`. Existing issue snapshots are unaffected; new issues cannot use it

### Issue Governance Tags

Each issue gets an on-chain array of governance tag IDs:

- Tags can be added/removed while issue is in `Draft` or `Deliberating` state
- **Frozen at `VoteReady`**: once an issue enters `VoteReady`, its governance tags become immutable
- At least 1 governance tag required to enter `VoteReady`
- Maximum tags per issue: configurable via 013 (default: 8)

**Storage**: separate mapping `issueId → bytes32[]` in a `TagSnapshotFacet` or within `TagRegistryFacet`.

### AI-Suggested Tags (Off-chain)

- AI suggests tags during issue creation/deliberation (off-chain service)
- Suggestions reference existing canonical tags where possible
- If AI suggests a new tag, a human must register it before it can be used as a governance tag
- This keeps the on-chain taxonomy human-curated

### Events

- `TagCreated(bytes32 indexed id, string slug, address creator)`
- `TagDeprecated(bytes32 indexed id)`
- `TagAliasAdded(bytes32 indexed canonicalId, string alias)`
- `TagsMerged(bytes32 indexed fromId, bytes32 indexed intoId)`
- `IssueTagsSet(uint256 indexed issueId, bytes32[] tagIds)`
- `IssueTagsFrozen(uint256 indexed issueId)`

### Extension Points

- Hierarchical tag relationships (parent/child) — deferred to v2
- Community-scoped tag namespaces — deferred
- Tag popularity/usage metrics

## Plan

1. Implement `TagRegistryFacet` with tag creation and slug normalization
2. Implement alias and merge logic (governance-gated)
3. Implement issue governance tag storage and freeze-on-VoteReady
4. Integrate with `IssueRegistryFacet` (005) — gate `VoteReady` transition on tag presence
5. Add configurable limits via 013 (`maxGovernanceTagsPerIssue`, tag creation permissions)
6. Tests

## Test

- Tag creation with valid slug, duplicate slug rejected
- Slug normalization (whitespace, casing, special chars)
- Alias creation and resolution
- Tag merge: old tag resolves to new canonical
- Deprecated tag cannot be assigned to new issues
- Issue tag assignment in Draft/Deliberating states
- Issue tags frozen at VoteReady — modification reverts
- VoteReady blocked without at least 1 governance tag
- Max tags per issue enforced

## Notes

- Tag IDs are deterministic (keccak of slug) so off-chain systems can compute IDs without querying the chain
- No hierarchical/parent-child tags in v1 — keeps on-chain logic simple and auditable
- Amends 005: `IssueRegistryFacet` must check governance tag presence before allowing `VoteReady` transition
