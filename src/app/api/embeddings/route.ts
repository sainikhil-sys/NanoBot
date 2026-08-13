import { NextRequest, NextResponse } from "next/server";
import {
  generateTextEmbedding,
  calculateCosineSimilarity,
  projectVectorTo2D,
} from "@/lib/ai/openrouter";

// Reference semantic concepts to plot in 2D space relative to the user's input
const REFERENCE_CONCEPTS = [
  "machine learning",
  "neural networks",
  "artificial intelligence",
  "computer science",
  "robotics",
  "database postgresql",
  "pizza and food",
  "football sports",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, compareText } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Valid text input is required." },
        { status: 400 }
      );
    }

    // 1. Generate primary text embedding
    const mainEmbedding = await generateTextEmbedding(text.trim());

    // 2. Generate compare text embedding if provided
    let compareEmbedding = null;
    let cosineSimilarity = null;

    if (compareText && typeof compareText === "string" && compareText.trim()) {
      compareEmbedding = await generateTextEmbedding(compareText.trim());
      cosineSimilarity = Number(
        calculateCosineSimilarity(mainEmbedding.vector, compareEmbedding.vector).toFixed(4)
      );
    }

    // 3. Generate embeddings for reference concepts to calculate real 2D PCA positions
    const refEmbeddings = await Promise.all(
      REFERENCE_CONCEPTS.map(async (concept) => {
        const emb = await generateTextEmbedding(concept);
        return {
          id: concept.toLowerCase().replace(/\s+/g, "-"),
          text: concept,
          vector: emb.vector,
        };
      })
    );

    // 4. Calculate 2D PCA coordinate projection
    const projected2D = projectVectorTo2D(mainEmbedding.vector, refEmbeddings);

    return NextResponse.json({
      success: true,
      text: mainEmbedding.text,
      vector: mainEmbedding.vector,
      dimensions: mainEmbedding.dimensions,
      magnitude: mainEmbedding.magnitude,
      model: mainEmbedding.model,
      compareEmbedding,
      cosineSimilarity,
      projected2D,
    });
  } catch (err: any) {
    console.error("Embedding API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate embedding vector." },
      { status: 500 }
    );
  }
}
