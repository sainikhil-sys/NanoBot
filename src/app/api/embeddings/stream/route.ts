import { NextRequest } from "next/server";
import { generateTextEmbedding, generateBatchEmbeddings } from "@/lib/ai/openrouter";
import { chunkText } from "@/lib/ai/text-chunker";
import { parseDocumentContent } from "@/lib/ai/document-parser";
import { DbService } from "@/lib/supabase/db-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestStartTime = performance.now();

  const contentType = req.headers.get("content-type") || "";
  let text = "";
  let filename: string | null = null;
  let maxChunkSize = 400;
  let chunkOverlap = 80;

  // Stream state management
  let streamClosed = false;
  const signal = req.signal;

  // Set up SSE Response stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const safeCloseWriter = async () => {
    if (streamClosed) return;
    streamClosed = true;
    try {
      await writer.close();
    } catch (err: any) {
      // Gracefully ignore expected already-closed / aborted stream errors
      if (
        err?.name === "AbortError" ||
        err?.message?.includes("closed") ||
        err?.code === "ERR_STREAM_PREMATURE_CLOSE"
      ) {
        return;
      }
      console.warn("[Stream] Unexpected writer close warning:", err);
    }
  };

  const safeSendEvent = async (data: Record<string, unknown>): Promise<boolean> => {
    if (streamClosed || signal.aborted) {
      return false;
    }
    try {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(payload));
      return true;
    } catch (err: any) {
      streamClosed = true;
      // If write fails due to client abort or closed stream, return false without throwing
      return false;
    }
  };

  // Run backend processing with comprehensive lifecycle and abort handling
  (async () => {
    let currentStep = "input_validation";
    const timing = {
      inputMs: 0,
      extractMs: 0,
      chunkMs: 0,
      embedMs: 0,
      storageMs: 0,
    };

    try {
      // Step 1: Input Received & Validation
      const tInputStart = performance.now();
      await safeSendEvent({
        type: "agent_step",
        step: "input_received",
        status: "running",
        message: "Receiving and validating input...",
        progress: 10,
      });

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const textParam = formData.get("text") as string | null;

        if (file && file.size > 0) {
          filename = file.name;
          const arrayBuffer = await file.arrayBuffer();

          // Step 2: Text Extraction from file
          currentStep = "text_extraction";
          const tExtractStart = performance.now();
          await safeSendEvent({
            type: "agent_step",
            step: "text_extraction",
            status: "running",
            message: `Extracting text content from ${file.name} (${Math.round(file.size / 1024)} KB)...`,
            progress: 22,
          });

          if (signal.aborted) throw new DOMException("Aborted", "AbortError");

          const parsed = await parseDocumentContent(file.name, Buffer.from(arrayBuffer));
          text = parsed.rawText;
          timing.extractMs = Number((performance.now() - tExtractStart).toFixed(1));

          await safeSendEvent({
            type: "agent_step",
            step: "text_extraction",
            status: "complete",
            message: `Extracted ${parsed.wordCount} words (${parsed.charCount} characters) from ${file.name}`,
            progress: 30,
            metadata: {
              filename: file.name,
              charCount: parsed.charCount,
              wordCount: parsed.wordCount,
              fileType: parsed.fileType,
            },
          });
        } else if (textParam) {
          text = textParam;
        }
      } else {
        const body = await req.json();
        text = body.text || "";
        maxChunkSize = body.maxChunkSize || 400;
        chunkOverlap = body.chunkOverlap || 80;
      }

      timing.inputMs = Number((performance.now() - tInputStart).toFixed(1));

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      if (!text || !text.trim()) {
        throw new Error("No readable text found in prompt or document upload.");
      }

      await safeSendEvent({
        type: "agent_step",
        step: "input_received",
        status: "complete",
        message: "Input validated successfully",
        progress: 35,
      });

      // Step 3: Text Cleaning & Normalization
      currentStep = "text_cleaning";
      await safeSendEvent({
        type: "agent_step",
        step: "text_cleaning",
        status: "running",
        message: "Cleaning whitespace and normalizing character encodings...",
        progress: 42,
      });

      const cleanedText = text
        .replace(/\r\n/g, "\n")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      await safeSendEvent({
        type: "agent_step",
        step: "text_cleaning",
        status: "complete",
        message: `Normalized text to ${cleanedText.length} characters`,
        progress: 50,
      });

      // Step 4: Text Chunking
      currentStep = "chunking";
      const tChunkStart = performance.now();
      await safeSendEvent({
        type: "agent_step",
        step: "chunking",
        status: "running",
        message: `Partitioning content into semantic chunks (size: ${maxChunkSize} chars, overlap: ${chunkOverlap} chars)...`,
        progress: 58,
      });

      const chunks = chunkText(cleanedText, { maxChunkSize, chunkOverlap });
      timing.chunkMs = Number((performance.now() - tChunkStart).toFixed(1));

      await safeSendEvent({
        type: "agent_step",
        step: "chunking",
        status: "complete",
        message: `Generated ${chunks.length} semantically bounded chunk${chunks.length > 1 ? "s" : ""}`,
        progress: 68,
        metadata: {
          chunksCount: chunks.length,
        },
      });

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      // Step 5: Embedding Generation (Fast Parallel / Batched)
      currentStep = "embedding";
      const tEmbedStart = performance.now();
      const modelName = process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";

      await safeSendEvent({
        type: "agent_step",
        step: "embedding",
        status: "running",
        message: `Synthesizing high-dimensional embeddings via ${modelName}...`,
        progress: 76,
        metadata: {
          model: modelName,
          chunksCount: chunks.length,
        },
      });

      // Embed main document and chunks concurrently
      const [mainEmbedding, chunkBatchEmbeddings] = await Promise.all([
        generateTextEmbedding(cleanedText.substring(0, 4000), signal),
        generateBatchEmbeddings(
          chunks.slice(0, 8).map((c) => c.text),
          signal
        ),
      ]);

      const chunkEmbeddings = chunks.slice(0, 8).map((c, idx) => ({
        index: c.index,
        text: c.text,
        tokens: c.approxTokens,
        vector: chunkBatchEmbeddings[idx]?.vector || mainEmbedding.vector,
      }));

      timing.embedMs = Number((performance.now() - tEmbedStart).toFixed(1));

      await safeSendEvent({
        type: "agent_step",
        step: "embedding",
        status: "complete",
        message: `Generated ${mainEmbedding.dimensions}-dimensional vector embedding (||v|| = ${mainEmbedding.magnitude})`,
        progress: 88,
        metadata: {
          dimensions: mainEmbedding.dimensions,
          magnitude: mainEmbedding.magnitude,
          model: mainEmbedding.model,
        },
      });

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      // Step 6: Vector Storage Persistence
      currentStep = "vector_storage";
      const tStorageStart = performance.now();
      const vectorStoreName = "Supabase pgvector (HNSW Index)";

      await safeSendEvent({
        type: "agent_step",
        step: "vector_storage",
        status: "running",
        message: `Persisting vector record to ${vectorStoreName}...`,
        progress: 92,
      });

      const savedRecord = await DbService.saveVectorRecord({
        input_text: cleanedText.substring(0, 1000),
        source_filename: filename,
        dimensions: mainEmbedding.dimensions,
        magnitude: mainEmbedding.magnitude,
        model: mainEmbedding.model,
        vector_store: vectorStoreName,
        chunks_count: chunks.length,
        vector: mainEmbedding.vector,
        chunks: chunkEmbeddings,
      });

      timing.storageMs = Number((performance.now() - tStorageStart).toFixed(1));

      await safeSendEvent({
        type: "agent_step",
        step: "vector_storage",
        status: "complete",
        message: `Vector stored with ID ${savedRecord.id}`,
        progress: 98,
      });

      // Step 7: Completed (Only after persistence succeeds)
      const totalProcessingTimeMs = Number((performance.now() - requestStartTime).toFixed(1));

      console.log(
        `[EMBEDDING] input=${timing.inputMs}ms chunks=${chunks.length} chunking=${timing.chunkMs}ms embedding=${timing.embedMs}ms storage=${timing.storageMs}ms total=${totalProcessingTimeMs}ms`
      );

      await safeSendEvent({
        type: "complete",
        message: "Vector generation completed successfully",
        progress: 100,
        vectorId: savedRecord.id,
        dimensions: mainEmbedding.dimensions,
        magnitude: mainEmbedding.magnitude,
        model: mainEmbedding.model,
        vectorStore: vectorStoreName,
        chunksCount: chunks.length,
        processingTimeMs: totalProcessingTimeMs,
        vector: mainEmbedding.vector,
        chunks: chunkEmbeddings,
        sourceFilename: filename,
        inputText: cleanedText,
      });
    } catch (err: any) {
      // Differentiate expected client abort from actual backend failure
      if (err?.name === "AbortError" || signal.aborted) {
        console.log(`[EMBEDDING] Client aborted request at step: ${currentStep}`);
      } else {
        console.error(`[EMBEDDING] Backend failure at step ${currentStep}:`, err);
        await safeSendEvent({
          type: "error",
          step: currentStep,
          message: err.message || "An unexpected error occurred during vector generation.",
        });
      }
    } finally {
      await safeCloseWriter();
    }
  })().catch((unhandledErr) => {
    console.error("[Stream] Uncaught error in embedding stream:", unhandledErr);
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
