import { NextRequest, NextResponse } from "next/server";
import { EmbeddingService } from "@/lib/ai/embeddings/embedding-service";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text : "";
  const compareTo = typeof body.compareTo === "string" ? body.compareTo : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "Provide 'text' to embed." }, { status: 400 });
  }
  const emb = await EmbeddingService.embed(text);
  const result: Record<string, unknown> = {
    embedding: {
      dimensions: emb.dimensions,
      magnitude: Number(emb.magnitude.toFixed(4)),
      model: emb.model,
      preview: emb.vector.slice(0, 16).map((v) => Number(v.toFixed(4))),
    },
  };
  if (compareTo.trim()) {
    result.similarity = await EmbeddingService.compareSimilarity(text, compareTo);
  }
  return NextResponse.json(result);
}
