import { SemanticSearchService, SemanticRetrievalResult } from "../retrieval/semantic-search";
import { streamAICompletion, ChatMessage } from "../providers";
import { TokenizerService } from "../tokenizer/tokenizer-service";

export interface RAGExecutionResult {
  retrieval: SemanticRetrievalResult;
  contextPrompt: string;
  stream: AsyncGenerator<string, void, unknown>;
  inputTokens: number;
}

export class RAGPipeline {
  /**
   * Executes complete Retrieval-Augmented Generation pipeline with conversation history
   */
  static async execute(
    query: string,
    options?: {
      botModel?: string;
      systemPrompt?: string;
      userId?: string;
      includeWeb?: boolean;
      history?: ChatMessage[];
    }
  ): Promise<RAGExecutionResult> {
    // 1. Semantic Retrieval
    const retrieval = await SemanticSearchService.search(query, {
      topK: 4,
      includeWeb: options?.includeWeb !== false,
      userId: options?.userId,
    });

    // 2. Assemble Grounded Context
    let contextSnippet = "";
    if (retrieval.chunks.length > 0 && options?.includeWeb !== false) {
      contextSnippet = retrieval.chunks
        .map(
          (c, idx) =>
            `[Source ${idx + 1}: ${c.title} (${c.source}) | Relevance Score: ${c.score}]\n${c.snippet}`
        )
        .join("\n\n");
    }

    const systemInstruction =
      options?.systemPrompt ||
      `You are NanoBot, an advanced AI workspace assistant.
Understand the user's actual request.
Answer the question directly, accurately, and helpfully using clean markdown formatting.
Use conversation history when relevant.
Do not claim to have searched the web unless grounded web sources are provided in context.
${contextSnippet ? `\n[GROUNDED KNOWLEDGE CONTEXT]:\n${contextSnippet}\nGround your response on these sources and cite them using [1], [2], etc.` : ""}`;

    // 3. Construct Complete Multi-turn Messages Array for LLM
    const priorHistory = (options?.history || []).filter(
      (m) => m.content && m.content.trim() && m.role !== "system"
    );

    const fullMessages: ChatMessage[] = [
      ...priorHistory,
      { role: "user", content: query },
    ];

    // 4. Compute tokenization metrics
    const tokenAnalysis = TokenizerService.tokenize(query + "\n" + systemInstruction);

    // 5. Stream completion from LLM
    const stream = streamAICompletion(
      options?.botModel || "llama-3.3-70b-versatile",
      fullMessages,
      systemInstruction
    );

    return {
      retrieval,
      contextPrompt: systemInstruction,
      stream,
      inputTokens: tokenAnalysis.totalTokens,
    };
  }
}
