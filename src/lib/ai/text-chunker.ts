export interface TextChunk {
  index: number;
  text: string;
  charStart: number;
  charEnd: number;
  approxTokens: number;
}

export interface ChunkOptions {
  maxChunkSize?: number; // approx chars per chunk
  chunkOverlap?: number; // overlap chars between consecutive chunks
}

/**
 * Splits input text into semantically cohesive chunks based on paragraph and sentence boundaries.
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const { maxChunkSize = 400, chunkOverlap = 80 } = options;

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // If text is smaller than chunk size, return single chunk
  if (normalized.length <= maxChunkSize) {
    return [
      {
        index: 1,
        text: normalized,
        charStart: 0,
        charEnd: normalized.length,
        approxTokens: Math.ceil(normalized.length / 4),
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let currentStart = 0;
  let chunkIndex = 1;

  while (currentStart < normalized.length) {
    let currentEnd = currentStart + maxChunkSize;

    if (currentEnd >= normalized.length) {
      currentEnd = normalized.length;
    } else {
      // Find clean breaking point (newline, period, or space)
      const lookbackZone = normalized.substring(
        Math.max(currentStart, currentEnd - 80),
        currentEnd
      );

      const paragraphBreak = lookbackZone.lastIndexOf("\n\n");
      const sentenceBreak = lookbackZone.lastIndexOf(". ");
      const lineBreak = lookbackZone.lastIndexOf("\n");
      const spaceBreak = lookbackZone.lastIndexOf(" ");

      if (paragraphBreak !== -1) {
        currentEnd = Math.max(currentStart, currentEnd - 80) + paragraphBreak + 2;
      } else if (sentenceBreak !== -1) {
        currentEnd = Math.max(currentStart, currentEnd - 80) + sentenceBreak + 2;
      } else if (lineBreak !== -1) {
        currentEnd = Math.max(currentStart, currentEnd - 80) + lineBreak + 1;
      } else if (spaceBreak !== -1) {
        currentEnd = Math.max(currentStart, currentEnd - 80) + spaceBreak + 1;
      }
    }

    const chunkContent = normalized.substring(currentStart, currentEnd).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        index: chunkIndex++,
        text: chunkContent,
        charStart: currentStart,
        charEnd: currentEnd,
        approxTokens: Math.max(1, Math.ceil(chunkContent.length / 4)),
      });
    }

    if (currentEnd >= normalized.length) break;

    // Advance start position taking into account overlap
    currentStart = Math.max(currentStart + 1, currentEnd - chunkOverlap);
  }

  return chunks;
}
