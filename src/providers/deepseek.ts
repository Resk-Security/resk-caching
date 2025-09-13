import { logger } from "../shared/simple-logger";
import type { ChatCompletionRequest, ChatCompletionResponse } from "../mock/mock-llm-provider";

/**
 * DeepSeek/OpenAI-compatible LLM provider using env-driven API key.
 * Reads API key from Bun.env.api_key_llm or Bun.env.DEEPSEEK_API_KEY.
 * Optionally reads base URL from Bun.env.LLM_BASE_URL (defaults to DeepSeek).
 */
export class RealLLMProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const key = Bun.env.api_key_llm ?? Bun.env.DEEPSEEK_API_KEY;
    if (!key) {
      throw new Error("Missing LLM API key: set api_key_llm or D E E P S E E K _ A P I _ K E Y env var");
    }
    this.apiKey = key;
    this.baseUrl = Bun.env.LLM_BASE_URL ?? "https://api.deepseek.com/v1";
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.baseUrl}/chat/completions`;

    const payload: Record<string, unknown> = {
      model: request.model,
      messages: request.messages,
    };
    if (request.max_tokens !== undefined) payload.max_tokens = request.max_tokens;
    if (request.temperature !== undefined) payload.temperature = request.temperature;
    if (request.top_p !== undefined) payload.top_p = request.top_p;
    if (request.frequency_penalty !== undefined) payload.frequency_penalty = request.frequency_penalty;
    if (request.presence_penalty !== undefined) payload.presence_penalty = request.presence_penalty;
    if (request.stop !== undefined) payload.stop = request.stop;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error("LLM API error", { status: res.status, body: text });
      throw new Error(`LLM request failed: ${res.status} ${text}`);
    }

    const data = await res.json();

    // Map response to our ChatCompletionResponse shape if needed
    // Assumes OpenAI-compatible response structure
    const mapped: ChatCompletionResponse = {
      id: data.id,
      object: data.object ?? "chat.completion",
      created: data.created ?? Math.floor(Date.now() / 1000),
      model: data.model ?? request.model,
      choices: (data.choices || []).map((c: any, idx: number) => ({
        index: c.index ?? idx,
        message: { role: c.message?.role ?? "assistant", content: c.message?.content ?? "" },
        finish_reason: c.finish_reason ?? "stop",
      })),
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
        total_tokens: data.usage?.total_tokens ?? ((data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0)),
      },
    };

    return mapped;
  }
}

export const globalRealLLMProvider = (() => {
  try {
    return new RealLLMProvider();
  } catch (e) {
    // Provider not available without key; caller should handle
    return null as unknown as RealLLMProvider;
  }
})();


