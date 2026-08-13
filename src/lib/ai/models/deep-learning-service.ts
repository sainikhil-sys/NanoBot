import { TaskRouter, RoutingDecision } from "../routing/task-router";
import { BOT_REGISTRY, BotDefinition, getBotDefinition } from "../routing/bot-registry";
import { TokenizerService, TokenizationAnalysis } from "../tokenizer/tokenizer-service";
import { EmbeddingService, SemanticComparisonResult } from "../embeddings/embedding-service";
import { SemanticSearchService, SemanticRetrievalResult } from "../retrieval/semantic-search";
import { RAGPipeline, RAGExecutionResult } from "../rag/rag-pipeline";
import { streamAICompletion, ChatMessage } from "../providers";

export interface DeepLearningModelTelemetry {
  modelName: string;
  architecture: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  embeddingDimensions?: number;
  inferenceLatencyMs: number;
  retrievalLatencyMs?: number;
  timestamp: string;
}

export class DeepLearningModelService {
  /**
   * Routes task and classifies intent
   */
  static routeTask(prompt: string, explicitBotId?: string): RoutingDecision {
    return TaskRouter.route(prompt, explicitBotId);
  }

  /**
   * Tokenizes text and returns subword tokens with token IDs
   */
  static analyzeTokens(text: string, model?: string): TokenizationAnalysis {
    return TokenizerService.tokenize(text, model);
  }

  /**
   * Generates high-dimensional vector embeddings
   */
  static async generateEmbedding(text: string) {
    return EmbeddingService.embed(text);
  }

  /**
   * Computes semantic cosine similarity between two texts
   */
  static async compareSemanticSimilarity(textA: string, textB: string): Promise<SemanticComparisonResult> {
    return EmbeddingService.compareSimilarity(textA, textB);
  }

  /**
   * Executes RAG pipeline (Retrieval-Augmented Generation)
   */
  static async executeRAG(
    query: string,
    options?: { botModel?: string; userId?: string; includeWeb?: boolean; history?: ChatMessage[] }
  ): Promise<RAGExecutionResult> {
    return RAGPipeline.execute(query, options);
  }

  /**
   * Fetches metadata for configured neural model
   */
  static getModelMetadata(botId: string): BotDefinition {
    return getBotDefinition(botId);
  }
}
