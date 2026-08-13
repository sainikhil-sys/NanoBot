import {
  generateTextEmbedding,
  calculateCosineSimilarity,
  calculateVectorMagnitude,
  projectVectorTo2D,
  EmbeddingResult,
} from "../openrouter";
import { DbService } from "@/lib/supabase/db-service";

export interface SemanticComparisonResult {
  textA: string;
  textB: string;
  similarity: number;
  rating: "High similarity" | "Moderate similarity" | "Low similarity" | "Dissimilar";
  latencyMs: number;
  dimensions: number;
  model: string;
}

export class EmbeddingService {
  /**
   * Generates dense vector representation for text or document
   */
  static async embed(text: string): Promise<EmbeddingResult> {
    return generateTextEmbedding(text);
  }

  /**
   * Computes mathematical cosine similarity between two texts via embeddings
   */
  static async compareSimilarity(textA: string, textB: string): Promise<SemanticComparisonResult> {
    const startTime = performance.now();

    const [embA, embB] = await Promise.all([
      generateTextEmbedding(textA),
      generateTextEmbedding(textB),
    ]);

    const similarity = calculateCosineSimilarity(embA.vector, embB.vector);
    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    let rating: SemanticComparisonResult["rating"] = "Dissimilar";
    if (similarity >= 0.8) rating = "High similarity";
    else if (similarity >= 0.55) rating = "Moderate similarity";
    else if (similarity >= 0.3) rating = "Low similarity";

    return {
      textA,
      textB,
      similarity: Number(similarity.toFixed(4)),
      rating,
      latencyMs,
      dimensions: embA.dimensions,
      model: embA.model,
    };
  }

  /**
   * Performs Principal Component Analysis (PCA) projection from dense vector space to 2D
   */
  static projectTo2D(
    targetVector: number[],
    referenceVectors: { id: string; text: string; vector: number[] }[]
  ) {
    return projectVectorTo2D(targetVector, referenceVectors);
  }
}
