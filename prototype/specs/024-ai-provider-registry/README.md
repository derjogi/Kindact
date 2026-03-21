---
status: planned
created: '2026-03-22'
tags:
  - ai
  - mvp
  - infrastructure
priority: high
created_at: '2026-03-22T20:39:48.654119948+00:00'
---

# AI Provider Registry

> **Phase**: MVP · **Priority**: High · **Subsystem**: Infrastructure, AI

## Overview

Centralized registry for all AI capabilities used across the platform. Each AI "slot" (e.g. deliberation summary, topic proposer, similarity detector) is independently configurable with its own provider, model, and prompt. At MVP, configuration lives in `.env` vars; later phases add a UI for runtime management.

This spec is a foundation — all AI-powered features (006, 010, 012, etc.) consume AI through this registry rather than hard-coding provider details.

## Design

### AI Slot Registry

Each AI capability is a named **slot** with:

| Field | Description | Example |
|-------|-------------|---------|
| `slotId` | Unique key for the capability | `DELIBERATION_SUMMARY` |
| `provider/model` | Provider and model in `provider/model` format | `anthropic/claude-sonnet-4-20250514` |
| `prompt` | System prompt or prompt template | `"Summarize the deliberation..."` |
| `maxTokens` | Max output tokens (optional, has sensible default) | `2048` |

### Env Var Convention

```env
# Format: AI_<SLOT>_MODEL=provider/model
AI_DELIBERATION_SUMMARY_MODEL=anthropic/claude-sonnet-4-20250514
AI_DELIBERATION_SUMMARY_PROMPT="Summarize the following deliberation thread..."
AI_DELIBERATION_SUMMARY_MAX_TOKENS=2048

AI_TOPIC_PROPOSER_MODEL=anthropic/claude-haiku-4-20250514
AI_TOPIC_PROPOSER_PROMPT="Given the following context, propose relevant topics..."

AI_SIMILARITY_DETECTOR_MODEL=anthropic/claude-haiku-4-20250514
AI_SIMILARITY_DETECTOR_PROMPT="Compare these proposals and identify overlaps..."

AI_ISSUE_IMPROVER_MODEL=anthropic/claude-sonnet-4-20250514
AI_ISSUE_IMPROVER_PROMPT="Suggest improvements to this issue description..."
```

Unset slots fall back to a default model (e.g. `anthropic/claude-haiku-4-20250514`).

### Module: `src/lib/ai/registry.ts`

```typescript
type AISlot = {
  slotId: string;
  provider: 'anthropic' | 'openai';
  model: string;
  prompt: string;
  maxTokens: number;
};

function getSlot(slotId: string): AISlot;
```

- Reads env vars on startup, validates `provider/model` format
- Throws clear error if a required slot has no model configured
- Exports typed slot accessors for each known capability

### Module: `src/lib/ai/client.ts`

```typescript
async function aiComplete(slotId: string, userContent: string): Promise<string>;
```

- Resolves slot config from registry
- Routes to correct provider SDK (Anthropic SDK or OpenAI SDK)
- Handles API key resolution (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
- Returns completion text; caller handles domain logic (parsing, storage)
- Logs slot used, model, token counts for observability

### Initial Slots (MVP)

| Slot ID | Purpose | Default Model |
|---------|---------|---------------|
| `DELIBERATION_SUMMARY` | Living summary of deliberation threads | `anthropic/claude-sonnet-4-20250514` |
| `ISSUE_IMPROVER` | Suggest improvements to issue descriptions | `anthropic/claude-sonnet-4-20250514` |
| `TOPIC_PROPOSER` | Propose related topics/tags for issues | `anthropic/claude-haiku-4-20250514` |
| `SIMILARITY_DETECTOR` | Find duplicate/overlapping proposals | `anthropic/claude-haiku-4-20250514` |

### Integration with 006-ai-assist-summary

Spec 006 currently hard-codes model metadata in the `AISummary` schema. After this spec:
- 006's improvement pipeline calls `aiComplete('ISSUE_IMPROVER', issueText)`
- 006's summary pipeline calls `aiComplete('DELIBERATION_SUMMARY', threadContent)`
- `modelVersion` and `promptVersion` in `AISummary` are populated from the registry slot config automatically

## Plan

- [ ] Install Anthropic and OpenAI SDKs as dependencies
- [ ] Implement `src/lib/ai/registry.ts` — env-based slot resolution with validation
- [ ] Implement `src/lib/ai/client.ts` — multi-provider completion dispatcher
- [ ] Add `.env.example` entries for all MVP slots
- [ ] Wire 006-ai-assist-summary to use registry instead of direct calls
- [ ] Add basic request logging (slot, model, token usage)

## Test

- [ ] Registry parses `provider/model` format correctly
- [ ] Missing required slot throws descriptive error
- [ ] Unset slot falls back to default model
- [ ] Client routes to correct provider based on slot config
- [ ] Changing env var changes which model is used (no code change needed)

## Notes

**Phase 2:** Admin UI to manage slots at runtime (stored in DB instead of env), prompt versioning with A/B testing, cost tracking per slot, rate limiting per slot.

**Open questions:**
- Should prompts support template variables (e.g. `{{issueTitle}}`) or keep it simple with string concatenation at the call site?
- Streaming responses needed at MVP or batch-only?
