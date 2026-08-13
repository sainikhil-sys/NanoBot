import { generateTextEmbedding, calculateCosineSimilarity } from "../openrouter";
import { DbService } from "@/lib/supabase/db-service";
import { performWebSearch, WebSearchResult } from "@/lib/search/search-engine";

export interface RetrievedChunk {
  id: string;
  source: string;
  title: string;
  snippet: string;
  score: number;
  tokens: number;
  url?: string;
}

export interface SemanticRetrievalResult {
  query: string;
  chunks: RetrievedChunk[];
  topK: number;
  embeddingDimensions: number;
  retrievalLatencyMs: number;
  totalCandidatesSearched: number;
  sources: { title: string; url: string; domain: string }[];
}

export class SemanticSearchService {
  /**
   * Executes dense vector retrieval and semantic similarity ranking
   */
  static async search(query: string, options?: { topK?: number; includeWeb?: boolean; userId?: string }): Promise<SemanticRetrievalResult> {
    const startTime = performance.now();
    const topK = options?.topK || 4;

    // 1. Generate query embedding
    const queryEmb = await generateTextEmbedding(query);

    const candidates: Array<{
      id: string;
      source: string;
      title: string;
      snippet: string;
      vector?: number[];
      url?: string;
    }> = [];

    // 2. Fetch persisted vector chunks from database
    try {
      const persistedVectors = await DbService.listVectorRecords(options?.userId);
      for (const rec of persistedVectors) {
        if (rec.chunks && Array.isArray(rec.chunks)) {
          for (const c of rec.chunks) {
            candidates.push({
              id: `chunk-${rec.id}-${c.index}`,
              source: rec.source_filename || "Knowledge Base",
              title: rec.source_filename || `Vector Record ${rec.id.slice(0, 8)}`,
              snippet: c.text,
              vector: c.vector,
            });
          }
        }
      }
    } catch {}

    // 3. If web search is requested or candidates are sparse, fetch live web intelligence
    let webResults: WebSearchResult[] = [];
    if (options?.includeWeb !== false) {
      try {
        const searchRes = await performWebSearch(query);
        webResults = searchRes.results;
        for (let i = 0; i < webResults.length; i++) {
          const wr = webResults[i];
          candidates.push({
            id: `web-${i + 1}`,
            source: wr.domain,
            title: wr.title,
            snippet: wr.snippet,
            url: wr.url,
          });
        }
      } catch {}
    }

    // 4. Rank candidates by semantic cosine similarity to query vector
    const scoredChunks: RetrievedChunk[] = await Promise.all(
      candidates.map(async (c) => {
        let score = 0.5;
        if (c.vector && Array.isArray(c.vector)) {
          score = calculateCosineSimilarity(queryEmb.vector, c.vector);
        } else {
          // Compute real-time embedding for text snippet
          const snippetEmb = await generateTextEmbedding(c.snippet.slice(0, 600));
          score = calculateCosineSimilarity(queryEmb.vector, snippetEmb.vector);
        }

        return {
          id: c.id,
          source: c.source,
          title: c.title,
          snippet: c.snippet,
          score: Number(Math.max(0, score).toFixed(4)),
          tokens: Math.round(c.snippet.split(/\s+/).length * 1.3),
          url: c.url,
        };
      })
    );

    // Sort descending by similarity score
    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, topK);

    const retrievalLatencyMs = Number((performance.now() - startTime).toFixed(2));

    const sources = webResults.map((r) => ({
      title: r.title,
      url: r.url,
      domain: r.domain,
    }));

    return {
      query,
      chunks: topChunks,
      topK,
      embeddingDimensions: queryEmb.dimensions,
      retrievalLatencyMs,
      totalCandidatesSearched: candidates.length,
      sources,
    };
  }
}
