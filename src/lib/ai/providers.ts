export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: "groq" | "openrouter" | "ml_service" | "auto";
  description: string;
  contextWindow: string;
  supportsVision: boolean;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "nanobot-auto",
    name: "NanoBot Auto-Router",
    provider: "auto",
    description: "Automatically selects optimal neural model & tool pipeline",
    contextWindow: "128k tokens",
    supportsVision: true,
  },
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B Versatile",
    provider: "groq",
    description: "Ultra low-latency reasoning and general technical synthesis",
    contextWindow: "128k tokens",
    supportsVision: false,
  },
  {
    id: "openrouter-free",
    name: "DeepSeek / OpenRouter Free Tier",
    provider: "openrouter",
    description: "Open-weight reasoning models via OpenRouter gateway",
    contextWindow: "64k tokens",
    supportsVision: true,
  },
  {
    id: "ml-service-local",
    name: "NanoBot Local ML Service",
    provider: "ml_service",
    description: "Isolated local Python transformer pipeline & embedding search",
    contextWindow: "32k tokens",
    supportsVision: true,
  },
];

export async function* streamAICompletion(
  modelId: string,
  messages: ChatMessage[],
  systemInstruction?: string
): AsyncGenerator<string, void, unknown> {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  const formattedMessages: ChatMessage[] = systemInstruction
    ? [{ role: "system" as const, content: systemInstruction }, ...messages]
    : messages;

  // 1. Primary High-Performance LLM Provider: Groq (llama-3.3-70b-versatile)
  if (groqKey && !groqKey.startsWith("your-") && !groqKey.startsWith("dummy-")) {
    try {
      const groqModel = "llama-3.3-70b-versatile";

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: formattedMessages,
          temperature: 0.5,
          max_tokens: 3000,
          stream: true,
        }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataStr = trimmed.slice(6);
              if (dataStr === "[DONE]") return;
              try {
                const parsed = JSON.parse(dataStr);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  yield token;
                }
              } catch {
                // Ignore SSE chunk parse errors
              }
            }
          }
        }
        return;
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`[LLM] Groq completion returned status ${res.status}:`, errText);
      }
    } catch (err) {
      console.warn("[LLM] Groq streaming network error, trying secondary provider:", err);
    }
  }

  // 2. Secondary Neural Gateway Provider: OpenRouter
  if (openRouterKey && !openRouterKey.startsWith("your-") && !openRouterKey.startsWith("dummy-")) {
    try {
      const openRouterModel =
        modelId && modelId.includes("/")
          ? modelId
          : "meta-llama/llama-3.3-70b-instruct";

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "NanoBot Assistant",
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: formattedMessages,
          temperature: 0.5,
          max_tokens: 3000,
          stream: true,
        }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataStr = trimmed.slice(6);
              if (dataStr === "[DONE]") return;
              try {
                const parsed = JSON.parse(dataStr);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  yield token;
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
        return;
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`[LLM] OpenRouter completion returned status ${res.status}:`, errText);
      }
    } catch (err) {
      console.warn("[LLM] OpenRouter streaming error:", err);
    }
  }

  // 3. If all configured AI providers failed, throw explicit error rather than pretending with canned fake responses
  throw new Error("Unable to reach AI model providers (Groq / OpenRouter). Please check network connectivity and API keys.");
}
