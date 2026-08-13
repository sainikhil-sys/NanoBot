import { NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";

export async function GET() {
  try {
    const usage = await DbService.getAiUsageMetrics();
    return NextResponse.json({
      success: true,
      usage,
      messages: usage.messages,
      vectors: usage.vectors,
      files: usage.files,
      saved: usage.saved,
      conversations: usage.conversations,
    });
  } catch (err: any) {
    console.error("GET /api/usage error:", err);
    return NextResponse.json(
      { error: "Failed to load usage metrics" },
      { status: 500 }
    );
  }
}
