import { NextRequest, NextResponse } from "next/server";
import { MemoryService } from "@/lib/tools/personal/memory-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (query) {
      const memories = await MemoryService.searchMemories(query);
      return NextResponse.json({ success: true, memories });
    }

    const memories = await MemoryService.listMemories();
    return NextResponse.json({ success: true, memories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value, category, confidence, isPinned } = body;

    if (!key || !value || !category) {
      return NextResponse.json({ success: false, error: "Key, value, and category are required" }, { status: 400 });
    }

    const memory = await MemoryService.storeMemory({
      key,
      value,
      category,
      confidence,
      isPinned,
    });

    return NextResponse.json({ success: true, memory });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    if (action === "clearAll") {
      const success = await MemoryService.clearAll();
      return NextResponse.json({ success });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Memory ID is required" }, { status: 400 });
    }

    const success = await MemoryService.deleteMemory(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
