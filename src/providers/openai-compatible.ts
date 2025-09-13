import { logger } from "../shared/simple-logger";
import type { LLMProvider, ChatCompletionRequest, ChatCompletionResponse } from "./types";

/**
 * Generic OpenAI-compatible client. Works with OpenAI, DeepSeek, etc.
 * Configured via env:
 * - api_key_llm or OPENAI_API_KEY or DEEPSEEK_API_KEY
 * - LLM_BASE_URL (default https://api.openai.com/v1)
 */
export class OpenAICompatibleProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(options?: { apiKey?: string; baseUrl?: string }) {
    const key = options?.apiKey ?? Bun.env.api_key_llm ?? Bun.env.OPENAI_API_KEY ?? Bun.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error("Missing LLM API key (api_key_llm | OPENAI_API_KEY | DEEPSEEK_API_KEY)");
    this.apiKey = key;
    this.baseUrl = options?.baseUrl ?? Bun.env.LLM_BASE_URL ?? "https://api.openai.com/v1";
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    const payload: Record<string, unknown> = { ...request };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error("LLM API error", { status: res.status, body: text });
      throw new Error(`LLM request failed: ${res.status} ${text}`);
    }
    const data = await res.json();
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


