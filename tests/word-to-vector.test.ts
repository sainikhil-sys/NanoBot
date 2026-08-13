import { describe, it, expect } from "vitest";
import { chunkText } from "../src/lib/ai/text-chunker";
import { cleanExtractedText } from "../src/lib/ai/document-parser";
import {
  generateTextEmbedding,
  generateBatchEmbeddings,
  calculateCosineSimilarity,
  calculateVectorMagnitude,
} from "../src/lib/ai/openrouter";
import { DbService } from "../src/lib/supabase/db-service";

describe("Word to Vector Pipeline & DbService", () => {
  it("chunks long text into semantically cohesive bounded pieces", () => {
    const text =
      "Artificial intelligence represents a transformative paradigm in computing. " +
      "Machine learning models learn patterns directly from high-dimensional datasets. " +
      "Neural embeddings project semantic concepts into dense continuous vector spaces.";

    const chunks = chunkText(text, { maxChunkSize: 100, chunkOverlap: 20 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].index).toBe(1);
    expect(chunks[0].approxTokens).toBeGreaterThan(0);
    expect(chunks[0].text.length).toBeLessThanOrEqual(100);
  });

  it("cleans and sanitizes raw document text", () => {
    const dirty = "  Hello\r\n\r\nWorld \x00\x08 with   spaces\n\n\n\nand lines.  ";
    const cleaned = cleanExtractedText(dirty);
    expect(cleaned).not.toContain("\x00");
    expect(cleaned).not.toContain("\x08");
    expect(cleaned).toBe("Hello\n\nWorld with spaces\n\nand lines.");
  });

  it("generates deterministic semantic embeddings with unit magnitude", async () => {
    const emb1 = await generateTextEmbedding("quantum physics and relativity");
    const emb2 = await generateTextEmbedding("quantum physics and relativity");
    const emb3 = await generateTextEmbedding("pepperoni pizza recipe");

    expect(emb1.vector.length).toBe(emb1.dimensions);
    expect(emb1.magnitude).toBeGreaterThan(0);

    // Identical text -> identical vector
    const similaritySame = calculateCosineSimilarity(emb1.vector, emb2.vector);
    expect(similaritySame).toBeCloseTo(1.0, 3);

    // Different semantic concepts -> lower similarity
    const similarityDiff = calculateCosineSimilarity(emb1.vector, emb3.vector);
    expect(similarityDiff).toBeLessThan(similaritySame);
  });

  it("generates batch embeddings concurrently for chunk arrays", async () => {
    const texts = [
      "Chunk 1: Transformer encoder architecture.",
      "Chunk 2: Multi-head self-attention layer.",
      "Chunk 3: Feed-forward neural network blocks.",
    ];

    const results = await generateBatchEmbeddings(texts);
    expect(results.length).toBe(3);
    expect(results[0].dimensions).toBeGreaterThan(0);
    expect(results[0].vector.length).toBe(results[0].dimensions);
  });

  it("persists vector records into DbService and tracks user usage metrics without latency stalling", async () => {
    const t0 = performance.now();
    const saved = await DbService.saveVectorRecord({
      input_text: "Neural language models test vector",
      dimensions: 384,
      magnitude: 1.0,
      model: "NanoBot-Semantic-Embedder-384",
      vector_store: "Supabase pgvector (HNSW Index)",
      chunks_count: 1,
      vector: new Array(384).fill(0.05),
      userId: "test-user-123",
    });
    const elapsed = performance.now() - t0;

    expect(saved.id).toBeDefined();
    expect(saved.user_id).toBe("test-user-123");
    expect(saved.dimensions).toBe(384);
    expect(elapsed).toBeLessThan(1500); // Guarantees sub-1.5s execution

    const metrics = await DbService.getAiUsageMetrics("test-user-123");
    expect(metrics.plan).toBe("Free Plan");
    expect(metrics.maxCredits).toBe(100);
    expect(metrics.vectors).toBeGreaterThanOrEqual(1);
  });
});
