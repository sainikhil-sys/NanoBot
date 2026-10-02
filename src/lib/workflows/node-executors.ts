/**
 * Per-node execution logic for the workflow engine.
 *
 * Every executor performs a real operation or fails with a clear, observable
 * error. Nothing returns a fabricated `success: true`. Capabilities that are not
 * yet wired to a real backend throw {@link NonRetryableError} so they surface in
 * the run trace and dead-letter queue instead of pretending to work.
 */

import vm from "node:vm";
import { WorkflowNode } from "./types";
import { NonRetryableError, HttpError } from "./retry";
import { assertSafeUrl } from "./ssrf";
import { evaluateCondition } from "./conditions";
import { SYSTEM_TOOLS } from "@/lib/tools/tool-registry";
import { streamAICompletion } from "@/lib/ai/providers";

export interface NodeExecContext {
  node: WorkflowNode;
  /** Node config with all `{{variables}}` already interpolated. */
  config: Record<string, unknown>;
  /** Full accumulated run context (trigger, nodes.*, workflow, user, execution). */
  context: Record<string, unknown>;
  log: (level: "info" | "warn" | "error" | "debug", message: string) => void;
  signal?: AbortSignal;
}

export type NodeExecutor = (ctx: NodeExecContext) => Promise<Record<string, unknown>>;

function str(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return typeof value === "string" ? value : String(value);
}

const executors: Partial<Record<WorkflowNode["type"], NodeExecutor>> = {
  trigger_manual: async ({ context }) => ({ triggered: true, at: new Date().toISOString(), payload: context.trigger }),
  trigger_schedule: async ({ context }) => ({ triggered: true, at: new Date().toISOString(), payload: context.trigger }),
  trigger_file: async ({ context }) => ({ triggered: true, at: new Date().toISOString(), payload: context.trigger }),
  trigger_webhook: async ({ context }) => ({ triggered: true, at: new Date().toISOString(), payload: context.trigger }),

  web_search: async ({ config, context, log }) => {
    const query = str(config.query || (context.trigger as Record<string, unknown>)?.query);
    if (!query) throw new NonRetryableError("web_search requires a 'query'.");
    log("info", `Searching the web for: ${query}`);
    const res = await SYSTEM_TOOLS.web_search.handler({ query });
    return { query, count: res.count, results: res.results };
  },

  embedding_generator: async ({ config, log }) => {
    const text = str(config.text);
    if (!text) throw new NonRetryableError("embedding_generator requires 'text' to embed.");
    log("info", `Embedding ${text.length} characters`);
    const res = await SYSTEM_TOOLS.embedding.handler({ text });
    return { dimensions: res.dimensions, vectorSample: res.vectorSample };
  },

  document_parser: async ({ config, log }) => {
    const text = str(config.text);
    if (!text) {
      throw new NonRetryableError(
        "document_parser requires 'text' input. File-source parsing is provided by the Knowledge pipeline."
      );
    }
    const chunkSize = Number(config.chunkSize) || 800;
    const overlap = Number(config.overlap) || 80;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += Math.max(1, chunkSize - overlap)) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    log("info", `Parsed into ${chunks.length} chunk(s)`);
    return { chunks, chunkCount: chunks.length, totalChars: text.length };
  },

  llm_completion: async (ctx) => runLlm(ctx),
  agent_ai: async (ctx) => runLlm(ctx),

  http_request: async ({ config, log, signal }) => {
    const rawUrl = str(config.url);
    if (!rawUrl) throw new NonRetryableError("http_request requires a 'url'.");
    const method = str(config.method, "GET").toUpperCase();
    const url = await assertSafeUrl(rawUrl); // SSRF guard

    const headers: Record<string, string> = {};
    if (config.headers && typeof config.headers === "object") {
      for (const [k, v] of Object.entries(config.headers as Record<string, unknown>)) headers[k] = str(v);
    }
    const hasBody = method !== "GET" && method !== "HEAD" && config.body != null;
    const body = hasBody
      ? typeof config.body === "string"
        ? config.body
        : JSON.stringify(config.body)
      : undefined;
    if (hasBody && !headers["Content-Type"] && typeof config.body !== "string") {
      headers["Content-Type"] = "application/json";
    }

    const timeoutMs = Number(config.timeoutMs) || 10_000;
    log("info", `${method} ${url.toString()}`);
    const res = await fetch(url.toString(), {
      method,
      headers,
      body,
      signal: signal ?? AbortSignal.timeout(timeoutMs),
    });

    const responseText = await res.text();
    let parsed: unknown = responseText;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        parsed = JSON.parse(responseText);
      } catch {
        /* keep raw text */
      }
    }

    if (!res.ok) {
      throw new HttpError(res.status, `HTTP ${res.status} from ${url.hostname}`, responseText.slice(0, 500));
    }
    return { status: res.status, ok: res.ok, body: parsed };
  },

  code_executor: async ({ config, log }) => {
    const language = str(config.language, "javascript").toLowerCase();
    const code = str(config.code);
    if (!code) throw new NonRetryableError("code_executor requires 'code'.");
    if (language !== "javascript" && language !== "js") {
      throw new NonRetryableError(
        `Runtime "${language}" is not available in this sandbox. Only JavaScript is supported.`
      );
    }
    log("info", "Executing JavaScript in isolated VM sandbox");
    const sandbox: Record<string, unknown> = { input: config.input ?? {}, result: undefined, console: { log: () => {} } };
    const vmContext = vm.createContext(sandbox);
    try {
      const script = new vm.Script(`result = (function(){ ${code} \n})()`);
      script.runInContext(vmContext, { timeout: 2000 });
    } catch (err) {
      throw new NonRetryableError(`Code error: ${(err as Error).message}`, err);
    }
    return { result: sandbox.result };
  },

  condition: async ({ config, context }) => {
    const expression = str(config.expression);
    const passed = evaluateCondition(expression, context);
    return { passed, expression };
  },

  email_notification: async ({ config, log }) => {
    const to = str(config.to);
    const subject = str(config.subject);
    const bodyText = str(config.body);
    if (!to || !subject) throw new NonRetryableError("email requires 'to' and 'subject'.");

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey || resendKey.startsWith("your-") || resendKey.startsWith("dummy-")) {
      // Honest failure — no fabricated delivery. Surfaces in the run trace / DLQ.
      throw new NonRetryableError(
        "No email provider is configured (set RESEND_API_KEY). Email was not sent."
      );
    }
    const from = str(config.from, process.env.EMAIL_FROM || "NanoBot <onboarding@resend.dev>");
    log("info", `Sending email to ${to}`);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({ from, to, subject, text: bodyText }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new HttpError(res.status, `Email provider returned ${res.status}`, errBody.slice(0, 300));
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { delivered: true, recipient: to, providerId: data.id };
  },

  vector_search: async () => {
    throw new NonRetryableError(
      "vector_search is provided by the Knowledge/RAG engine, which is not part of this build yet."
    );
  },
  database_query: async () => {
    throw new NonRetryableError(
      "database_query is not enabled. Use the HTTP Request or integration nodes instead."
    );
  },

  output: async ({ context }) => ({ final: context, at: new Date().toISOString() }),
};

async function runLlm({ config, context, log, signal }: NodeExecContext): Promise<Record<string, unknown>> {
  const prompt = str(config.prompt);
  if (!prompt) throw new NonRetryableError("LLM node requires a 'prompt'.");
  const system = config.system ? str(config.system) : undefined;
  log("info", "Invoking language model");
  let text = "";
  const stream = streamAICompletion(str(config.model, "llama-3.3-70b"), [{ role: "user", content: prompt }], system);
  for await (const chunk of stream) {
    if (signal?.aborted) break;
    text += chunk;
  }
  void context;
  return { response: text, prompt };
}

export function getNodeExecutor(type: WorkflowNode["type"]): NodeExecutor {
  const executor = executors[type];
  if (!executor) {
    return async () => {
      throw new NonRetryableError(`No executor registered for node type "${type}".`);
    };
  }
  return executor;
}
