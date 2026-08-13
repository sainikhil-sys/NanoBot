import { NextRequest, NextResponse } from "next/server";
import { DeepLearningModelService } from "@/lib/ai/models/deep-learning-service";
import { DbService } from "@/lib/supabase/db-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestStartTime = performance.now();
  const signal = req.signal;

  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  // Extract message and configuration safely from all possible request payload structures
  const message =
    (typeof rawBody?.message === "string" ? rawBody.message : "") ||
    (typeof rawBody?.content === "string" ? rawBody.content : "") ||
    (typeof rawBody?.prompt === "string" ? rawBody.prompt : "") ||
    (Array.isArray(rawBody?.messages) && rawBody.messages.length > 0
      ? rawBody.messages[rawBody.messages.length - 1]?.content || ""
      : "");

  const requestedConvId = rawBody?.conversationId || rawBody?.conversation_id || null;
  const botId = rawBody?.botId || rawBody?.modelId || rawBody?.bot_id || "auto";
  const webSearch = Boolean(
    rawBody?.webSearch ??
    rawBody?.web_search ??
    rawBody?.enableWebSearch ??
    rawBody?.useWebSearch ??
    rawBody?.searchEnabled ??
    false
  );

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  // Safe user authentication with fallback
  let userId = "usr-prod-001";
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) userId = user.id;
  } catch {
    // Non-fatal fallback in development
  }

  // Ensure conversation exists & persist user message
  let convId = requestedConvId;
  let conversationHistory: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  try {
    if (!convId) {
      const title = message.trim().slice(0, 45) + (message.length > 45 ? "..." : "");
      const newConv = await DbService.createConversation(botId, title, userId);
      convId = newConv.id;
    } else {
      // Fetch prior messages for multi-turn conversational memory
      const existingConv = await DbService.getConversation(convId);
      if (existingConv?.messages && Array.isArray(existingConv.messages)) {
        conversationHistory = existingConv.messages
          .filter((m) => m.content && m.content.trim())
          .map((m) => ({
            role: m.role as "system" | "user" | "assistant",
            content: m.content,
          }));
      }
    }

    // Persist user message
    await DbService.addMessage(convId, "user", message.trim());
  } catch (dbErr) {
    console.error("[CHAT] Conversation creation / message persistence warning:", dbErr);
  }

  // Task Routing with safe fallback
  let routing;
  try {
    routing = DeepLearningModelService.routeTask(message, botId);
  } catch (routeErr) {
    console.error("[CHAT] Task routing exception, using safe fallback:", routeErr);
    routing = {
      botId: "general-chat",
      botName: "NanoBot",
      category: "General Intelligence",
      confidence: 0.9,
      tools: [],
      reason: "Safe fallback to general conversation",
      taskType: "general_conversation",
      requiresWebSearch: false,
      requiresEmbedding: false,
      requiresDocumentParsing: false,
    };
  }

  // Safe development diagnostics (No API keys or private tokens)
  console.log(`[CHAT REQUEST] message="${message.slice(0, 60)}" botId=${botId} webSearch=${webSearch}`);
  console.log(
    `[CHAT ROUTING] taskType=${routing.taskType} botId=${routing.botId} requiresWebSearch=${routing.requiresWebSearch}`
  );

  // Web search decision: never search web for casual greetings/general conversation
  const isGeneralConversation = routing.taskType === "general_conversation";
  const shouldSearchWeb =
    !isGeneralConversation &&
    (routing.requiresWebSearch || routing.botId === "web-research" || webSearch === true);

  // Stream state management
  let streamClosed = false;
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const safeCloseWriter = async () => {
    if (streamClosed) return;
    streamClosed = true;
    try {
      await writer.close();
    } catch (err: any) {
      if (
        err?.name === "AbortError" ||
        err?.message?.includes("closed") ||
        err?.code === "ERR_STREAM_PREMATURE_CLOSE"
      ) {
        return;
      }
      console.warn("[CHAT] Safe writer close notice:", err);
    }
  };

  const safeSendEvent = async (data: Record<string, unknown>): Promise<boolean> => {
    if (streamClosed || signal.aborted) {
      return false;
    }
    try {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(payload));
      return true;
    } catch {
      streamClosed = true;
      return false;
    }
  };

  // Execute model inference and stream SSE events
  (async () => {
    let accumulatedResponse = "";
    let chunkCount = 0;
    try {
      await safeSendEvent({
        type: "message_start",
        conversationId: convId,
      });

      // 1. Send Routing Decision Event
      await safeSendEvent({
        type: "routing",
        botId: routing.botId,
        botName: routing.botName,
        category: routing.category,
        confidence: routing.confidence,
        tools: routing.tools,
        reason: routing.reason,
      });

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      // 2. Tokenization Analysis
      const tokenAnalysis = DeepLearningModelService.analyzeTokens(message);
      await safeSendEvent({
        type: "tokenization",
        inputTokens: tokenAnalysis.totalTokens,
        tokenizerType: tokenAnalysis.tokenizerType,
        latencyMs: tokenAnalysis.latencyMs,
      });

      let sources: any[] = [];
      let modelStream: AsyncGenerator<string, void, unknown>;

      if (shouldSearchWeb) {
        await safeSendEvent({
          type: "status",
          message: "Searching the web...",
        });

        await safeSendEvent({
          type: "embedding_started",
          model: "openai/text-embedding-3-small",
        });

        const ragResult = await DeepLearningModelService.executeRAG(message, {
          botModel: "llama-3.3-70b-versatile",
          userId,
          includeWeb: true,
          history: conversationHistory,
        });

        sources = ragResult.retrieval.sources;

        await safeSendEvent({
          type: "embedding_completed",
          dimensions: ragResult.retrieval.embeddingDimensions,
          model: "openai/text-embedding-3-small",
        });

        await safeSendEvent({
          type: "retrieval_completed",
          topK: ragResult.retrieval.topK,
          latencyMs: ragResult.retrieval.retrievalLatencyMs,
          chunks: ragResult.retrieval.chunks.map((c) => ({
            id: c.id,
            title: c.title,
            source: c.source,
            score: c.score,
          })),
        });

        if (sources.length > 0) {
          await safeSendEvent({
            type: "sources",
            sources,
          });
        }

        modelStream = ragResult.stream;
      } else {
        // Real LLM inference with full conversational context
        const ragResult = await DeepLearningModelService.executeRAG(message, {
          botModel: "llama-3.3-70b-versatile",
          userId,
          includeWeb: false,
          history: conversationHistory,
        });
        modelStream = ragResult.stream;
      }

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      // 4. Stream response tokens
      await safeSendEvent({
        type: "generation_started",
        botName: routing.botName,
      });

      console.log(`[CHAT MODEL] provider="Groq / OpenRouter Neural Gateway" model="llama-3.3-70b-versatile" started=true`);

      for await (const token of modelStream) {
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        if (chunkCount === 0) {
          console.log(`[CHAT] first model chunk received`);
        }
        chunkCount++;
        accumulatedResponse += token;
        const sent = await safeSendEvent({
          type: "token",
          content: token,
        });
        if (!sent) break;
      }

      console.log(`[CHAT] stream completed, total tokens=${chunkCount}`);

      // 5. Calculate final performance metrics
      const totalLatencyMs = Number((performance.now() - requestStartTime).toFixed(1));
      const outputTokenAnalysis = DeepLearningModelService.analyzeTokens(accumulatedResponse);
      const botMeta = DeepLearningModelService.getModelMetadata(routing.botId);

      const metrics = {
        latencyMs: totalLatencyMs,
        inputTokens: tokenAnalysis.totalTokens,
        outputTokens: outputTokenAnalysis.totalTokens,
        totalTokens: tokenAnalysis.totalTokens + outputTokenAnalysis.totalTokens,
        model: "llama-3.3-70b-versatile",
        architecture: botMeta.architecture,
        provider: "OpenRouter / Groq Neural Gateway",
        dimensions: 1536,
      };

      await safeSendEvent({
        type: "metrics",
        metrics,
      });

      // 6. Complete event
      await safeSendEvent({
        type: "complete",
        conversationId: convId,
      });

      // Persist Assistant Message
      if (convId && accumulatedResponse) {
        try {
          await DbService.addMessage(convId, "assistant", accumulatedResponse, {
            botId: routing.botId,
            metrics,
            sources: sources.length > 0 ? sources : undefined,
          });
          console.log(`[CHAT] response persisted`);
        } catch (dbSaveErr) {
          console.error("[CHAT] Assistant message persistence warning:", dbSaveErr);
        }
      }
    } catch (streamErr: any) {
      if (streamErr?.name === "AbortError" || signal.aborted) {
        console.log("[CHAT] Stream aborted cleanly by client.");
      } else {
        console.error("[CHAT] Stream generation error in /api/chat:", streamErr);
        await safeSendEvent({
          type: "error",
          message: "Sorry, I couldn't generate a response right now. Please try again.",
        });
      }
    } finally {
      await safeCloseWriter();
    }
  })().catch((unhandledErr) => {
    console.error("[CHAT] Detached stream error:", unhandledErr);
    safeCloseWriter();
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
