/**
 * Pure logic for YouTube pot parameter extraction.
 * ZERO runtime dependencies.
 */

export function parsePotFromTimedTextUrl(url: string): string | null {
  try {
    const u = new URL(String(url || ""));
    return u.searchParams.get("pot");
  } catch {
    return null;
  }
}
