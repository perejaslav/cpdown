export interface TextMetrics {
  wordCount: number;
  estimatedTokens: number;
}

export function countWords(text: string): number {
  const value = String(text || "").trim();
  return value ? value.split(/\s+/u).filter(Boolean).length : 0;
}

export function estimateTokens(text: string): number {
  const value = String(text || "");
  if (!value) return 0;

  const chars = value.length;
  const words = countWords(value);
  const cyrillicChars = (value.match(/[\u0400-\u04FF]/g) || []).length;
  const codeChars = (value.match(/```[\s\S]*?```/g) || []).join("").length;
  const cyrillicShare = chars ? cyrillicChars / chars : 0;
  const codeShare = chars ? codeChars / chars : 0;

  const charEstimate = chars / (cyrillicShare > 0.25 ? 2.7 : 3.8);
  const wordEstimate = words * (cyrillicShare > 0.25 ? 1.45 : 1.25);
  const codeAdjustment = codeShare * chars * 0.12;

  return Math.max(1, Math.ceil(Math.max(charEstimate, wordEstimate) + codeAdjustment));
}

export function measureText(text: string): TextMetrics {
  return {
    wordCount: countWords(text),
    estimatedTokens: estimateTokens(text),
  };
}
