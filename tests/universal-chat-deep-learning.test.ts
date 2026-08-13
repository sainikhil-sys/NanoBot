import { describe, it, expect } from "vitest";
import { TaskRouter } from "@/lib/ai/routing/task-router";
import { BOT_REGISTRY, getBotDefinition } from "@/lib/ai/routing/bot-registry";
import { TokenizerService } from "@/lib/ai/tokenizer/tokenizer-service";
import { EmbeddingService } from "@/lib/ai/embeddings/embedding-service";
import { SemanticSearchService } from "@/lib/ai/retrieval/semantic-search";
import { DeepLearningModelService } from "@/lib/ai/models/deep-learning-service";

describe("NanoBot Task Router & Intent Classification", () => {
  it("classifies casual greetings as general conversation without web search", () => {
    const greetings = ["hi", "hii", "hello", "hey", "how are you?", "good morning"];
    for (const g of greetings) {
      const decision = TaskRouter.route(g);
      expect(decision.botId).toBe("general-chat");
      expect(decision.taskType).toBe("general_conversation");
      expect(decision.requiresWebSearch).toBe(false);
    }
  });

  it("routes web research queries automatically to web-research bot", () => {
    const decision = TaskRouter.route("Search latest news about NVIDIA and summarize it.");
    expect(decision.botId).toBe("web-research");
    expect(decision.requiresWebSearch).toBe(true);
    expect(decision.confidence).toBeGreaterThan(0.85);
  });

  it("routes coding and algorithm requests to coding bot", () => {
    const decision = TaskRouter.route("Write a React component for a responsive login page with TypeScript.");
    expect(decision.botId).toBe("coding");
    expect(decision.confidence).toBeGreaterThan(0.85);
    expect(decision.requiresWebSearch).toBe(false);
  });

  it("routes document and pdf requests to document-analysis bot", () => {
    const decision = TaskRouter.route("Extract text from this PDF document and summarize key points.");
    expect(decision.botId).toBe("document-analysis");
    expect(decision.requiresDocumentParsing).toBe(true);
  });

  it("routes embedding and vector requests to embedding bot", () => {
    const decision = TaskRouter.route("Generate high dimensional vector embeddings and calculate cosine similarity.");
    expect(decision.botId).toBe("embedding");
    expect(decision.requiresEmbedding).toBe(true);
  });

  it("routes image background removal requests to image-processing bot", () => {
    const decision = TaskRouter.route("Remove background from this product photo and make it transparent.");
    expect(decision.botId).toBe("image-processing");
  });

  it("honors explicit manual bot selection override", () => {
    const decision = TaskRouter.route("Hello there", "coding");
    expect(decision.botId).toBe("coding");
    expect(decision.confidence).toBe(1.0);
  });
});

describe("NanoBot Tokenizer & Deep Learning Model Service", () => {
  it("tokenizes natural text into subword tokens with token IDs", () => {
    const analysis = TokenizerService.tokenize("Artificial intelligence transforms modern software architecture.");
    expect(analysis.totalTokens).toBeGreaterThan(0);
    expect(analysis.tokens.length).toBe(analysis.totalTokens);
    expect(analysis.tokens[0].tokenId).toBeGreaterThan(0);
    expect(analysis.tokenizerType).toContain("BPE");
    expect(analysis.latencyMs).toBeGreaterThan(0);
  });

  it("computes cosine similarity accurately between semantic embeddings", async () => {
    const result = await EmbeddingService.compareSimilarity(
      "Neural network transformer models for deep learning and artificial intelligence.",
      "Neural network transformer architectures for artificial intelligence and deep learning."
    );

    expect(result.similarity).toBeGreaterThan(0.4);
    expect(result.rating).not.toBe("Dissimilar");
    expect(result.dimensions).toBeGreaterThan(0);
  });

  it("retrieves Top-K semantic chunks for query", async () => {
    const searchRes = await SemanticSearchService.search("transformer attention mechanism", {
      topK: 3,
      includeWeb: true,
    });

    expect(searchRes.chunks.length).toBeLessThanOrEqual(3);
    expect(searchRes.embeddingDimensions).toBeGreaterThan(0);
    expect(searchRes.retrievalLatencyMs).toBeGreaterThan(0);
  });

  it("retrieves bot metadata with model and transformer architecture", () => {
    const bot = getBotDefinition("web-research");
    expect(bot.architecture).toContain("Transformer");
    expect(bot.capabilities).toContain("web_search");
  });
});
