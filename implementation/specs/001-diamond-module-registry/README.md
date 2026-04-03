---
status: planned
created: '2026-04-03'
tags: [architecture, skeleton, smart-contracts]
priority: critical
---

# 001 — Diamond Module Registry

## Overview

The EIP-2535 Diamond proxy is the system skeleton. All on-chain Kindact functionality is deployed as **facets** behind a single Diamond proxy entry point. This spec defines the proxy, its core facets, the shared storage layout, and the module registry that tracks every facet in the system.

## Design

### Diamond Proxy

- Single `Diamond.sol` proxy contract — the only address users and other contracts interact with.
- Delegates every call to the facet registered for that function selector.
- Immutable bootstrap: `DiamondCut`, `DiamondLoupe`, and `AccessControl` facets are installed in the constructor and cannot be removed.

### Core Facets

| Facet | Purpose |
|-------|---------|
| **DiamondCutFacet** | Add / replace / remove facets. Guarded by `MODULE_MANAGER` or governance. |
| **DiamondLoupeFacet** | Introspection: `facets()`, `facetAddresses()`, `facetFunctionSelectors()`, `facetAddress(selector)`. |
| **AccessControlFacet** | Role-based access adapted from OpenZeppelin's `AccessControl` for diamond storage. Roles: `ADMIN`, `MODULE_MANAGER`, `GOVERNANCE`. |
| **ModuleRegistryFacet** | Maps `moduleId (bytes32)` → `ModuleRecord(facetAddress, version, dependencies[], status)`. Tracks versions and declared dependencies between modules. |

### AppStorage

Single `AppStorage` struct stored at a diamond-storage slot (`keccak256("kindact.app.storage")`). All facets read/write the same struct — no storage collisions, no delegatecall hazards.

### Facet Lifecycle

1. **Propose** — submit facet bytecode + selectors + moduleId.
2. **Approve** — via `GOVERNANCE` role (or `ADMIN` during bootstrap).
3. **Cut** — `DiamondCutFacet.diamondCut()` installs the facet.
4. Replacement and removal follow the same propose → approve → cut flow.

### Events

- `FacetAdded(address indexed facet, bytes4[] selectors)`
- `FacetReplaced(address indexed oldFacet, address indexed newFacet, bytes4[] selectors)`
- `FacetRemoved(address indexed facet, bytes4[] selectors)`
- `ModuleRegistered(bytes32 indexed moduleId, address facet, uint256 version)`

### Extension Points

Any new module deploys a facet contract and registers via `DiamondCutFacet`. The `ModuleRegistry` records metadata and dependency declarations so the system can enforce ordering and compatibility.

## Plan

1. Scaffold Hardhat + Foundry dual-toolchain project (contracts, tests, scripts).
2. Implement `Diamond.sol` proxy with constructor bootstrap.
3. Implement `AppStorage` library and diamond-storage helper.
4. Implement `DiamondCutFacet` and `DiamondLoupeFacet` (reference: `diamond-3`).
5. Implement `AccessControlFacet` (OZ `AccessControl` ported to diamond storage).
6. Implement `ModuleRegistryFacet` with version tracking and dependency declarations.
7. Write deployment scripts (deterministic CREATE2 addresses).
8. Write tests (see below).

## Test

- Unit: each core facet in isolation.
- Integration: full diamond lifecycle — deploy → add facet → replace facet → remove facet.
- Access control: unauthorized callers revert.
- ModuleRegistry: register, upgrade version, query dependencies.
- Gas benchmarks for `diamondCut` with varying selector counts.

## Notes

- During bootstrap (before governance is live), `ADMIN` approves cuts directly.
- Once governance is live, `ADMIN` role is renounced or transferred to the governance module.
- Diamond reference implementation: [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535), `diamond-3-hardhat`.
