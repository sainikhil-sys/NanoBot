import { NextResponse } from "next/server";
import { TokenizerService } from "@/lib/ai/tokenizer/tokenizer-service";
import { EmbeddingService } from "@/lib/ai/embeddings/embedding-service";

/**
 * NanoBench runs REAL measurements on each invocation. No value is fabricated —
 * every number below is produced by executing the actual services now.
 */
const SAMPLE =
  "NanoBot connects models, knowledge, and real integrations into workflows you can build, execute, inspect, and control.";

export async function POST() {
  // 1. Tokenization throughput (averaged over repeated real runs)
  const iterations = 50;
  const tokStart = performance.now();
  let lastTokens = 0;
  for (let i = 0; i < iterations; i++) {
    lastTokens = TokenizerService.tokenize(SAMPLE).totalTokens;
  }
  const tokTotalMs = performance.now() - tokStart;
  const tokAvgMs = Number((tokTotalMs / iterations).toFixed(4));

  // 2. Embedding latency (real)
  const embStart = performance.now();
  const emb = await EmbeddingService.embed(SAMPLE);
  const embMs = Number((performance.now() - embStart).toFixed(2));

  // 3. Similarity sanity: related pair vs unrelated pair (real cosine)
  const related = await EmbeddingService.compareSimilarity(
    "How do I reset my password?",
    "What is the process to recover my account login?"
  );
  const unrelated = await EmbeddingService.compareSimilarity(
    "How do I reset my password?",
    "The weather in the mountains is cold today."
  );

  return NextResponse.json({
    measuredAt: new Date().toISOString(),
    note: "All values measured by executing the real services on this request.",
    tokenization: {
      iterations,
      tokensPerSample: lastTokens,
      avgLatencyMs: tokAvgMs,
      throughputPerSec: Number((1000 / (tokAvgMs || 0.0001)).toFixed(0)),
    },
    embedding: { dimensions: emb.dimensions, latencyMs: embMs, model: emb.model },
    similarity: {
      relatedPair: related.similarity,
      unrelatedPair: unrelated.similarity,
      discriminates: related.similarity > unrelated.similarity,
    },
  });
}
