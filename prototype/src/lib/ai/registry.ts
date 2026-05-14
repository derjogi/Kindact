// ─── AI Slot Registry ───────────────────────────────────────────────────────
// Centralized config for all AI capabilities. Each "slot" maps to a specific
// provider/model + prompt, configured via env vars:
//
//   AI_<SLOT>_MODEL=provider/model        (e.g. "openrouter/qwen/qwen3-next-80b-a3b-instruct:free")
//   AI_<SLOT>_PROMPT="system prompt..."
//   AI_<SLOT>_MAX_TOKENS=2048
//
// All slots fall back to OPENROUTER_DEFAULT_MODEL if not explicitly set.

export type AIProvider = "openrouter";

export type AISlot = {
  slotId: string;
  provider: AIProvider;
  model: string;
  prompt: string;
  maxTokens: number;
};

const DEFAULT_MODEL = "qwen/qwen3-next-80b-a3b-instruct:free";
const DEFAULT_MAX_TOKENS = 2048;

const SLOT_DEFAULTS: Record<string, { model?: string; prompt: string; maxTokens?: number }> = {
  DELIBERATION_SUMMARY: {
    model: "nvidia/nemotron-3-super:free",
    prompt: [
      "You are a neutral summarizer for a civic deliberation platform.",
      "Given a set of comments and arguments about an issue, produce a concise,",
      "balanced summary that represents all perspectives. Cite specific arguments",
      "where possible. Use markdown formatting. Keep it under 500 words.",
    ].join(" "),
  },
  ISSUE_IMPROVER: {
    model: "nvidia/nemotron-3-super:free",
    prompt: [
      "You are an editor helping citizens write better issue proposals.",
      "Given an issue title, summary, and description, suggest concrete improvements",
      "for clarity, specificity, and actionability. Return a markdown list of suggestions.",
      "Do NOT rewrite the proposal — only suggest improvements.",
    ].join(" "),
  },
  TOPIC_PROPOSER: {
    prompt: [
      "You are a topic classification assistant for a civic platform.",
      "Given an issue title and description, propose 3-5 relevant topic tags.",
      "Return only a JSON array of short tag strings, e.g. [\"infrastructure\", \"energy\"].",
    ].join(" "),
    maxTokens: 256,
  },
  SIMILARITY_DETECTOR: {
    prompt: [
      "You are a duplicate detection assistant for a civic deliberation platform.",
      "Given a new issue and a list of existing issues (title + summary),",
      "identify any that are substantially similar or overlapping.",
      "Return a JSON array of objects: [{id, reason}] for each similar issue.",
      "Return an empty array if none are similar.",
    ].join(" "),
    maxTokens: 512,
  },
};

function parseModel(raw: string): { provider: AIProvider; model: string } {
  // All models go through OpenRouter — the model string is the OpenRouter slug
  return { provider: "openrouter", model: raw };
}

function envKey(slot: string, suffix: string): string {
  return `AI_${slot}_${suffix}`;
}

export function getSlot(slotId: string): AISlot {
  const defaults = SLOT_DEFAULTS[slotId];

  const rawModel =
    process.env[envKey(slotId, "MODEL")] ??
    defaults?.model ??
    process.env.OPENROUTER_DEFAULT_MODEL ??
    DEFAULT_MODEL;

  const { provider, model } = parseModel(rawModel);

  const prompt =
    process.env[envKey(slotId, "PROMPT")] ??
    defaults?.prompt ??
    "You are a helpful assistant.";

  const maxTokensStr = process.env[envKey(slotId, "MAX_TOKENS")];
  const maxTokens = maxTokensStr
    ? parseInt(maxTokensStr, 10)
    : (defaults?.maxTokens ?? DEFAULT_MAX_TOKENS);

  return { slotId, provider, model, prompt, maxTokens };
}

export function getSlotModelVersion(slot: AISlot): string {
  return `${slot.provider}/${slot.model}`;
}

export const KNOWN_SLOTS = Object.keys(SLOT_DEFAULTS);
