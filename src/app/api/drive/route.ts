import { NextRequest, NextResponse } from "next/server";
import { DriveService } from "@/lib/tools/personal/drive-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "NanoBot";
    const maxResults = Number(searchParams.get("maxResults") || 10);

    const result = await DriveService.searchFiles({
      query,
      maxResults,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileId, fileName } = body;

    if (!fileId || !fileName) {
      return NextResponse.json({ success: false, error: "fileId and fileName are required" }, { status: 400 });
    }

    const summaryRes = await DriveService.summarizeDocument({
      fileId,
      fileName,
    });

    return NextResponse.json({
      success: true,
      ...summaryRes,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
