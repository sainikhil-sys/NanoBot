import { NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";

export async function GET() {
  try {
    const bots = await DbService.listBots();
    return NextResponse.json({ bots });
  } catch (error) {
    console.error("GET /api/bots error:", error);
    return NextResponse.json({ error: "Failed to fetch bots" }, { status: 500 });
  }
}
