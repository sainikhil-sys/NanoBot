import { NextRequest, NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";
import { AppFile } from "@/types/database.types";

export async function GET() {
  try {
    const files = await DbService.listFiles();
    return NextResponse.json({ files });
  } catch (error) {
    console.error("GET /api/files error:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, path, mimeType, size, taskId, metadata } = body;

    const file: AppFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: "usr-prod-001",
      task_id: taskId || null,
      name: name || "unnamed_artifact",
      path: path || `/uploads/${name}`,
      mime_type: mimeType || "application/octet-stream",
      size: Number(size) || 0,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    await DbService.addFile(file);
    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    console.error("POST /api/files error:", error);
    return NextResponse.json({ error: "Failed to create file record" }, { status: 500 });
  }
}
