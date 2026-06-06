---
status: planned
created: 2026-06-06
priority: high
tags:
- zomes
- ui
depends_on:
- '004'
parent: '001'
created_at: 2026-06-06T21:28:57.275521657Z
updated_at: 2026-06-06T21:32:05.434530750Z
---

# Phase 3 — Tag Sidebar & Filter

> **Status**: planned · **Priority**: high · **Created**: 2026-06-06

## Overview

Phase 3 of [001-proofpoll-fork-mvp](../001-proofpoll-fork-mvp/README.md). Delivers feature **#4**: a sidebar listing all tags across all issues, and clicking a tag filters the issue feed. Built on the same deterministic sentinel-anchor pattern ProofPoll already uses for `AllPolls`.

## Design

Two anchor families (sentinel-`Issue` hashes, mirroring `all_issues_anchor`):
- `tag_anchor("tag:{t}")` — one per distinct tag; base for `TagToIssue` links.
- `all_tags_anchor()` — base for `AllTags` links to each tag anchor, so the sidebar can enumerate tags.

### Coordinator
- In `create_issue` (from Phase 2): for each non-empty, trimmed tag → ensure `tag_anchor`, create `TagToIssue` (tag→issue) and `AllTags` (all_tags→tag, deduped) links.
- `get_all_tags() -> Vec<String>` — walk `AllTags`, deref each tag anchor, strip the `tag:` prefix, dedup, sort.
- `get_issues_by_tag(tag) -> Vec<Record>` — re-hash `tag_anchor("tag:{tag}")`, walk `TagToIssue`.

### Frontend
- `src/routes/index.tsx`: render a sidebar of tags from `get_all_tags` plus an "All issues" entry. Selecting a tag switches the feed source to `get_issues_by_tag`; "All issues" reverts to `get_all_issues`.
- `holochain.ts` + Tauri command wrappers for `get_all_tags` and `get_issues_by_tag`.

## Plan

- [ ] Integrity: add `tag_anchor`/`all_tags_anchor` helpers (link types `AllTags`/`TagToIssue` already declared in Phase 2)
- [ ] Coordinator: tag-linking inside `create_issue`; `get_all_tags`; `get_issues_by_tag`
- [ ] Tauri commands + `holochain.ts` wrappers
- [ ] Sidebar UI with filter + "All issues" reset

## Test

- [ ] Tags on a created issue appear in the sidebar (and propagate to a second agent)
- [ ] Selecting a tag narrows the feed to issues with that tag
- [ ] "All issues" clears the filter
- [ ] An issue with multiple tags appears under each of them; duplicate tags listed once

## Notes

Tags are free-form strings on the `Issue` entry (no tag registry / validation yet). A curated tag registry, tag rename/merge, and tag counts are deferred.
