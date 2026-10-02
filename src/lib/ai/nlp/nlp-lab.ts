/**
 * Lightweight, transparent NLP utilities for the NLP Lab. These are real
 * deterministic computations (not trained models) and are labelled as such in
 * the UI, so the underlying concepts are visible and honest.
 */

const POSITIVE = new Set([
  "good", "great", "excellent", "amazing", "love", "wonderful", "fantastic", "happy",
  "best", "awesome", "nice", "helpful", "positive", "success", "successful", "win",
  "improved", "improve", "benefit", "clear", "fast", "reliable", "secure", "easy",
]);
const NEGATIVE = new Set([
  "bad", "terrible", "awful", "hate", "horrible", "poor", "worst", "sad", "angry",
  "fail", "failed", "failure", "bug", "broken", "slow", "error", "crash", "wrong",
  "difficult", "hard", "confusing", "insecure", "vulnerable", "problem", "issue",
]);

export interface SentimentResult {
  method: string;
  score: number; // normalized -1..1
  label: "positive" | "negative" | "neutral";
  positiveHits: string[];
  negativeHits: string[];
}

export function analyzeSentiment(text: string): SentimentResult {
  const words = text.toLowerCase().match(/\p{L}+/gu) || [];
  const positiveHits: string[] = [];
  const negativeHits: string[] = [];
  for (const w of words) {
    if (POSITIVE.has(w)) positiveHits.push(w);
    else if (NEGATIVE.has(w)) negativeHits.push(w);
  }
  const net = positiveHits.length - negativeHits.length;
  const denom = positiveHits.length + negativeHits.length || 1;
  const score = Number((net / denom).toFixed(3));
  const label = score > 0.15 ? "positive" : score < -0.15 ? "negative" : "neutral";
  return { method: "Lexicon-based (AFINN-style word list)", score, label, positiveHits, negativeHits };
}

export type EntityType = "EMAIL" | "URL" | "DATE" | "MONEY" | "NUMBER" | "PROPER_NOUN";
export interface Entity {
  type: EntityType;
  value: string;
}

export function extractEntities(text: string): { method: string; entities: Entity[] } {
  const entities: Entity[] = [];
  const push = (type: EntityType, value: string) => {
    if (value && !entities.some((e) => e.type === type && e.value === value)) entities.push({ type, value });
  };
  for (const m of text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) push("EMAIL", m[0]);
  for (const m of text.matchAll(/https?:\/\/[^\s)]+/g)) push("URL", m[0]);
  for (const m of text.matchAll(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g)) push("DATE", m[0]);
  for (const m of text.matchAll(/[$€£]\s?\d[\d,]*(?:\.\d+)?/g)) push("MONEY", m[0]);
  for (const m of text.matchAll(/\b\d[\d,]*(?:\.\d+)?\b/g)) push("NUMBER", m[0]);
  // Heuristic proper nouns: capitalized words not at sentence start-only
  for (const m of text.matchAll(/\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})*)\b/g)) push("PROPER_NOUN", m[1]);
  return { method: "Regex / capitalization heuristics", entities: entities.slice(0, 40) };
}

export interface ReadabilityResult {
  words: number;
  sentences: number;
  syllables: number;
  avgWordsPerSentence: number;
  fleschReadingEase: number;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const groups = w.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 1;
  if (w.endsWith("e") && n > 1) n -= 1;
  return Math.max(1, n);
}

export function readability(text: string): ReadabilityResult {
  const words = text.match(/\p{L}+/gu) || [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const wordCount = words.length || 1;
  const avgWordsPerSentence = Number((wordCount / sentenceCount).toFixed(2));
  // Flesch Reading Ease (standard formula)
  const flesch =
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);
  return {
    words: words.length,
    sentences: sentenceCount,
    syllables,
    avgWordsPerSentence,
    fleschReadingEase: Number(flesch.toFixed(1)),
  };
}
