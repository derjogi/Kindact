import { OpenRouter } from "@openrouter/sdk";
import { getSlot, getSlotModelVersion, type AISlot } from "./registry";

let _client: OpenRouter | null = null;

function getClient(): OpenRouter {
  if (_client) return _client;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Get a free key at https://openrouter.ai/keys",
    );
  }

  _client = new OpenRouter({
    apiKey,
    httpReferer: "https://kindact.org",
    xTitle: "Kindact",
  });

  return _client;
}

export type AICompletionResult = {
  content: string;
  modelVersion: string;
  promptVersion: string;
  usage?: { promptTokens?: number; completionTokens?: number };
};

export async function aiComplete(
  slotId: string,
  userContent: string,
): Promise<AICompletionResult> {
  const slot = getSlot(slotId);
  const client = getClient();

  const start = Date.now();

  const completion = await client.chat.send({
    chatGenerationParams: {
      model: slot.model,
      messages: [
        { role: "system", content: slot.prompt },
        { role: "user", content: userContent },
      ],
      maxTokens: slot.maxTokens,
      stream: false,
    },
  });

  const elapsed = Date.now() - start;
  const choice = completion.choices?.[0];
  const content = choice?.message?.content ?? "";

  console.log(
    `[AI] slot=${slotId} model=${slot.model} tokens_in=${completion.usage?.promptTokens ?? "?"} tokens_out=${completion.usage?.completionTokens ?? "?"} time=${elapsed}ms`,
  );

  return {
    content: typeof content === "string" ? content : "",
    modelVersion: getSlotModelVersion(slot),
    promptVersion: hashPrompt(slot.prompt),
    usage: {
      promptTokens: completion.usage?.promptTokens,
      completionTokens: completion.usage?.completionTokens,
    },
  };
}

export function getSlotConfig(slotId: string): AISlot {
  return getSlot(slotId);
}

function hashPrompt(prompt: string): string {
  let h = 0;
  for (let i = 0; i < prompt.length; i++) {
    h = ((h << 5) - h + prompt.charCodeAt(i)) | 0;
  }
  return `v1-${(h >>> 0).toString(16).padStart(8, "0")}`;
}
