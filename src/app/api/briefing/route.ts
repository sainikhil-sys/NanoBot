import { NextRequest, NextResponse } from "next/server";
import { BriefingService } from "@/lib/tools/personal/briefing-service";

export async function GET() {
  try {
    const briefing = await BriefingService.generateDailyBriefing();
    return NextResponse.json({ success: true, briefing });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const briefing = await BriefingService.generateDailyBriefing();
    return NextResponse.json({ success: true, briefing });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
