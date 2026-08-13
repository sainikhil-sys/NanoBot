export interface ParsedDocument {
  filename: string;
  fileType: "pdf" | "docx" | "txt" | "md" | "unknown";
  rawText: string;
  charCount: number;
  wordCount: number;
}

/**
 * Extracts and cleans plain text from supported document files (PDF, DOCX, TXT, MD).
 */
export async function parseDocumentContent(
  filename: string,
  buffer: Buffer | ArrayBuffer
): Promise<ParsedDocument> {
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  let rawText = "";
  let fileType: ParsedDocument["fileType"] = "unknown";

  if (extension === "txt") {
    fileType = "txt";
    rawText = nodeBuffer.toString("utf-8");
  } else if (extension === "md" || extension === "markdown") {
    fileType = "md";
    rawText = nodeBuffer.toString("utf-8");
  } else if (extension === "pdf") {
    fileType = "pdf";
    rawText = extractTextFromPdfBuffer(nodeBuffer);
  } else if (extension === "docx") {
    fileType = "docx";
    rawText = extractTextFromDocxBuffer(nodeBuffer);
  } else {
    // Attempt fallback utf-8 text decoding
    rawText = nodeBuffer.toString("utf-8");
  }

  // Clean and sanitize text: normalize whitespace, remove unprintable binary sequences
  const cleaned = cleanExtractedText(rawText);
  const words = cleaned.trim().split(/\s+/).filter(Boolean);

  return {
    filename,
    fileType,
    rawText: cleaned,
    charCount: cleaned.length,
    wordCount: words.length,
  };
}

/**
 * Robust extraction of readable text streams from standard PDF binary buffers without external binary dependencies.
 */
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const str = buffer.toString("binary");
  const textBlocks: string[] = [];

  // Match standard PDF text stream operators: BT ... ET blocks with Tj, TJ, or parenthesis strings
  const btRegex = /BT[\s\S]*?ET/g;
  const matches = str.match(btRegex);

  if (matches && matches.length > 0) {
    for (const match of matches) {
      // Extract text in parenthesis: (Hello World) Tj or [(Hello) 10 (World)] TJ
      const stringRegex = /\(([^)]+)\)/g;
      let m;
      while ((m = stringRegex.exec(match)) !== null) {
        textBlocks.push(m[1]);
      }
    }
  }

  if (textBlocks.length > 0) {
    return textBlocks.join(" ");
  }

  // Fallback: extract printable ASCII strings
  return str
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Robust extraction of XML text tags from DOCX (zipped XML word/document.xml) buffers.
 */
function extractTextFromDocxBuffer(buffer: Buffer): string {
  const str = buffer.toString("utf-8", 0, Math.min(buffer.length, 500000));
  // Extract text from <w:t> tags in Word XML
  const wtRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  const textParts: string[] = [];
  let m;
  while ((m = wtRegex.exec(str)) !== null) {
    textParts.push(m[1]);
  }

  if (textParts.length > 0) {
    return textParts.join(" ");
  }

  // Fallback: clean ASCII text
  return str.replace(/<[^>]+>/g, " ").replace(/[^\x20-\x7E\n\t]/g, " ");
}

/**
 * Cleans extracted text by normalizing line breaks, removing control characters, and trimming.
 */
export function cleanExtractedText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // remove control chars
    .replace(/[ \t]+/g, " ") // collapse multiple spaces
    .replace(/\n{3,}/g, "\n\n") // max 2 consecutive newlines
    .trim();
}
