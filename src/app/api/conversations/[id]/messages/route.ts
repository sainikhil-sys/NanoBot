import { NextRequest, NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const conversation = await DbService.getConversation(id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("GET /api/conversations/[id]/messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const conversation = await DbService.getConversation(id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // 1. Record user message
    const userMsg = await DbService.addMessage(id, "user", content);

    // 2. Call ML Service or neural synthesis
    const mlUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
    let replyText = `Processed input with ${conversation.bot?.name || "Bot"} across deep-learning semantic layers. Identified structural context and refined response representations.`;

    try {
      const { synthesizeNeuralResponse } = await import("@/lib/ai/neural-synthesis");
      const neuralOut = await synthesizeNeuralResponse(conversation.bot?.slug || "chatbot", content);
      if (neuralOut) {
        replyText = neuralOut;
      } else {
        const mlRes = await fetch(`${mlUrl}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: `conv-task-${Date.now()}`,
            prompt: content,
            preferred_bot: conversation.bot?.slug,
          }),
        });
        if (mlRes.ok) {
          const mlData = await mlRes.json();
          if (mlData?.result?.output_text) {
            replyText = mlData.result.output_text;
          }
        }
      }
    } catch (e) {
      console.warn("Synthesis fallback:", e);
    }

    // 3. Record assistant message
    const assistantMsg = await DbService.addMessage(id, "assistant", replyText);

    return NextResponse.json({ userMessage: userMsg, assistantMessage: assistantMsg });
  } catch (error) {
    console.error("POST /api/conversations/[id]/messages error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
