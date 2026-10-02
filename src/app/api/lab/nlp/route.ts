import { NextRequest, NextResponse } from "next/server";
import { TokenizerService } from "@/lib/ai/tokenizer/tokenizer-service";
import { analyzeSentiment, extractEntities, readability } from "@/lib/ai/nlp/nlp-lab";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ text: "" }));
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "Provide 'text' to analyze." }, { status: 400 });
  }
  return NextResponse.json({
    tokenization: TokenizerService.tokenize(text),
    sentiment: analyzeSentiment(text),
    entities: extractEntities(text),
    readability: readability(text),
  });
}
