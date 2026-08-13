import { NextRequest, NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";

export async function GET() {
  try {
    const items = await DbService.listSavedItems();
    return NextResponse.json({
      success: true,
      items,
    });
  } catch (err: any) {
    console.error("GET /api/saved error:", err);
    return NextResponse.json(
      { error: "Failed to fetch saved items" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, item_type, content, metadata } = body;

    if (!title || !content || !item_type) {
      return NextResponse.json(
        { error: "Title, item_type, and content are required." },
        { status: 400 }
      );
    }

    const saved = await DbService.saveItem({
      title,
      item_type,
      content,
      metadata,
    });

    return NextResponse.json({
      success: true,
      item: saved,
    });
  } catch (err: any) {
    console.error("POST /api/saved error:", err);
    return NextResponse.json(
      { error: "Failed to save item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    await DbService.deleteSavedItem(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/saved error:", err);
    return NextResponse.json(
      { error: "Failed to delete saved item" },
      { status: 500 }
    );
  }
}
