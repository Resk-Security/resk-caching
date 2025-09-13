import { OpenAICompatibleProvider } from "./openai-compatible";
import type { LLMProvider } from "./types";

/**
 * Provider factory. Selects provider based on env:
 * - PROVIDER: openai | deepseek | any OpenAI-compatible
 * - LLM_BASE_URL to override API host (e.g., DeepSeek)
 * - API key via api_key_llm | OPENAI_API_KEY | DEEPSEEK_API_KEY
 */
export function createProvider(): LLMProvider | null {
  try {
    // Switch based on PROVIDER, default to OpenAI-compatible
    const provider = (Bun.env.PROVIDER || "openai").toLowerCase();
    if (provider === "deepseek") {
      const base = Bun.env.LLM_BASE_URL ?? "https://api.deepseek.com/v1";
      const apiKey = Bun.env.api_key_llm ?? Bun.env.DEEPSEEK_API_KEY ?? Bun.env.OPENAI_API_KEY;
      return new OpenAICompatibleProvider({ apiKey, baseUrl: base });
    }
    // openai or any compatible
    return new OpenAICompatibleProvider();
  } catch {
    return null;
  }
}

export const globalLLMProvider = createProvider();


