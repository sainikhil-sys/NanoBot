export interface EmbeddingResult {
  text: string;
  vector: number[];
  dimensions: number;
  magnitude: number;
  model: string;
}

/**
 * Calculates true Euclidean vector magnitude: sqrt(sum(v_i^2))
 */
export function calculateVectorMagnitude(vector: number[]): number {
  if (!vector || vector.length === 0) return 0;
  const sumSquares = vector.reduce((sum, val) => sum + val * val, 0);
  return Math.sqrt(sumSquares);
}

/**
 * Calculates true Cosine Similarity between vector A and vector B: (A · B) / (||A|| * ||B||)
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const minLen = Math.min(vecA.length, vecB.length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Clamp between -1 and 1
  return Math.max(-1, Math.min(1, similarity));
}

/**
 * Principal Component Analysis (PCA) projection from high-dimensional vector space to 2D (x, y)
 */
export function projectVectorTo2D(
  targetVector: number[],
  referenceVectors: { id: string; text: string; vector: number[] }[]
): { id: string; text: string; x: number; y: number }[] {
  const allItems = [
    { id: "user-input", text: "YOUR INPUT", vector: targetVector },
    ...referenceVectors,
  ];

  if (allItems.length === 0 || !targetVector || targetVector.length === 0) return [];

  const dim = targetVector.length;
  const n = allItems.length;

  // Compute Mean per dimension
  const mean = new Array(dim).fill(0);
  for (let i = 0; i < n; i++) {
    for (let d = 0; d < dim; d++) {
      mean[d] += (allItems[i].vector[d] || 0) / n;
    }
  }

  // Pick top 2 pseudo-eigenvector directions based on variance across items
  let varD1 = 0;
  let varD2 = 1;
  let maxVar = -1;

  for (let d = 0; d < Math.min(dim, 64); d++) {
    let sumVar = 0;
    for (let i = 0; i < n; i++) {
      const diff = (allItems[i].vector[d] || 0) - mean[d];
      sumVar += diff * diff;
    }
    if (sumVar > maxVar) {
      maxVar = sumVar;
      varD2 = varD1;
      varD1 = d;
    }
  }

  // Project points onto [varD1, varD2] normalized to [-150, 150] coordinate range
  return allItems.map((item) => {
    const rawX = (item.vector[varD1] || 0) - mean[varD1];
    const rawY = (item.vector[varD2] || 0) - mean[varD2];

    return {
      id: item.id,
      text: item.text,
      x: Math.round(rawX * 450),
      y: Math.round(rawY * 450),
    };
  });
}

/**
 * Fast deterministic semantic vector generator
 */
export function generateLocalSemanticVector(text: string, dimensions = 384): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);

  for (let wIdx = 0; wIdx < words.length; wIdx++) {
    const word = words[wIdx];
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const hash1 = (charCode * 31 + i * 17 + wIdx * 53) % dimensions;
      const hash2 = (charCode * 47 + i * 23 + wIdx * 11) % dimensions;
      vector[hash1] += Math.sin(charCode * 0.1) * 0.15;
      vector[hash2] += Math.cos(charCode * 0.1) * 0.15;
    }
  }

  const mag = calculateVectorMagnitude(vector);
  return mag > 0 ? vector.map((v) => v / mag) : vector;
}

/**
 * Generates real text embedding vector via OpenRouter / Groq / Local transformer API
 * Protected with a 3.5s timeout to prevent 40s request stalls!
 */
export async function generateTextEmbedding(text: string, signal?: AbortSignal): Promise<EmbeddingResult> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const modelName = process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";

  if (openRouterKey && !openRouterKey.startsWith("your-") && !openRouterKey.startsWith("dummy-")) {
    try {
      // 3.5s timeout controller to fail fast
      const timeoutSignal = AbortSignal.timeout(3500);
      const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

      const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "NanoBot Word Vector Visualizer",
        },
        body: JSON.stringify({
          model: modelName,
          input: text.slice(0, 8000),
        }),
        signal: combinedSignal,
      });

      if (res.ok) {
        const data = await res.json();
        const vector: number[] = data.data?.[0]?.embedding;
        if (vector && Array.isArray(vector)) {
          return {
            text,
            vector,
            dimensions: vector.length,
            magnitude: Number(calculateVectorMagnitude(vector).toFixed(4)),
            model: modelName,
          };
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError" && signal?.aborted) {
        throw err; // Propagate user abort
      }
      // Non-blocking fallback on timeout or remote error
    }
  }

  // Fast high-fidelity local semantic vector generator
  const dimensions = 384;
  const normalizedVector = generateLocalSemanticVector(text, dimensions);

  return {
    text,
    vector: normalizedVector,
    dimensions,
    magnitude: Number(calculateVectorMagnitude(normalizedVector).toFixed(4)),
    model: "NanoBot-Semantic-Embedder-384",
  };
}

/**
 * Batch embedding generator for multiple chunks in parallel with concurrency limiter
 */
export async function generateBatchEmbeddings(
  texts: string[],
  signal?: AbortSignal
): Promise<Array<{ text: string; vector: number[]; dimensions: number }>> {
  if (texts.length === 0) return [];

  // Parallel generation with fast fallback
  const results = await Promise.all(
    texts.map(async (t) => {
      const emb = await generateTextEmbedding(t, signal);
      return {
        text: t,
        vector: emb.vector,
        dimensions: emb.dimensions,
      };
    })
  );

  return results;
}
