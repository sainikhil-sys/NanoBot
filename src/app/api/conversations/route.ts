import { NextRequest, NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";

export async function GET() {
  try {
    const conversations = await DbService.listConversations();
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { botId, title } = body;
    if (!botId) {
      return NextResponse.json({ error: "botId is required" }, { status: 400 });
    }

    const conv = await DbService.createConversation(botId, title || "New Session");
    return NextResponse.json({ conversation: conv }, { status: 201 });
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
