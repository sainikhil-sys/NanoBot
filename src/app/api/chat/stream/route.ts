import { NextRequest, NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";
import { streamAICompletion, ChatMessage } from "@/lib/ai/providers";
import { performWebSearch } from "@/lib/search/search-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      conversationId,
      content,
      modelId = "nanobot-auto",
      enableWebSearch = false,
      attachments = [],
    } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // 1. Get or create conversation
    let convId = conversationId;
    let conv = null;
    if (convId) {
      conv = await DbService.getConversation(convId);
    }
    if (!conv) {
      const newConv = await DbService.createConversation("chatbot", content.slice(0, 40));
      convId = newConv.id;
      conv = newConv;
    }

    // 2. Add User Message
    await DbService.addMessage(convId, "user", content);

    // 3. Optional Web Search Execution
    let searchContext = "";
    let citationsData: any[] = [];
    if (enableWebSearch || content.toLowerCase().includes("search") || content.toLowerCase().includes("latest")) {
      const searchRes = await performWebSearch(content);
      citationsData = searchRes.results;
      searchContext = `\n\n[WEB SEARCH EVIDENCE]:\n${searchRes.results
        .map((r, i) => `[Source ${i + 1}]: ${r.title} (${r.domain})\nSnippet: ${r.snippet}`)
        .join("\n\n")}\n\nGround your answer using these citations. Cite sources using [1], [2], etc.`;
    }

    // 4. Attachment Context
    let attachmentContext = "";
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      attachmentContext = `\n\n[ATTACHED FILE CONTEXT]:\n${attachments
        .map((att: any) => `File: ${att.name}\nContent:\n${att.extractedText || att.previewUrl || "File uploaded."}`)
        .join("\n\n")}`;
    }

    // 5. Construct Chat History for Provider
    const historyMessages: ChatMessage[] = (conv.messages || []).map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const finalPrompt = content + searchContext + attachmentContext;
    const finalMessages: ChatMessage[] = [
      ...historyMessages,
      { role: "user", content: finalPrompt },
    ];

    const systemInstruction =
      "You are NanoBot, a unified high-performance AI assistant. Provide clear, direct, expert guidance with Markdown formatting. When web search citations are provided, cite sources accurately using [1], [2], etc.";

    // 6. Return Streaming Server-Sent Events Response
    const encoder = new TextEncoder();
    let accumulatedResponse = "";

    const customStream = new ReadableStream({
      async start(controller) {
        // Send initial metadata event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "meta",
              conversationId: convId,
              citations: citationsData,
            })}\n\n`
          )
        );

        try {
          const completionStream = streamAICompletion(
            modelId,
            finalMessages,
            systemInstruction
          );

          for await (const token of completionStream) {
            accumulatedResponse += token;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "token", token })}\n\n`
              )
            );
          }

          // Persist assistant message in DB
          if (convId && accumulatedResponse.trim()) {
            await DbService.addMessage(convId, "assistant", accumulatedResponse);
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (err) {
          console.error("Stream controller error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "Streaming generation failed",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("POST /api/chat/stream error:", error);
    return NextResponse.json({ error: "Failed to initiate chat stream" }, { status: 500 });
  }
}
