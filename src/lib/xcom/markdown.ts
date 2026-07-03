/**
 * Pure X.com Markdown renderer.
 * Takes structured segments and produces clean Markdown.
 * ZERO runtime dependencies — no DOM, no chrome, no fetch.
 */

import type { XcomSegment } from "./segments";
import { isUiLine, normalizeSpaces } from "./ui-patterns";
import { codeFence } from "../markdown/fence";

export interface XcomRenderInput {
  title: string;
  sourceUrl: string;
  posts: readonly (readonly XcomSegment[])[];
}

export function buildXcomMarkdown(input: XcomRenderInput): string {
  const { title, sourceUrl, posts } = input;
  const sections: string[] = [];

  // Header
  sections.push(`# ${normalizeSpaces(title) || "X.com content"}`);
  sections.push("");
  sections.push(`**Source:** ${sourceUrl}`);
  sections.push("");
  sections.push("---");

  // Posts — separate consecutive posts with ---
  const renderedPosts: string[] = [];
  for (const post of posts) {
    const rendered = renderPost(post);
    if (rendered) renderedPosts.push(rendered);
  }

  for (let i = 0; i < renderedPosts.length; i++) {
    sections.push(renderedPosts[i]);
    if (i < renderedPosts.length - 1) {
      sections.push("---");
    }
  }

  return sections.join("\n\n");
}

function renderPost(segments: readonly XcomSegment[]): string {
  const parts: string[] = [];
  let prevText = "";

  for (const seg of segments) {
    switch (seg.type) {
      case "text": {
        const text = normalizeSpaces(seg.text);
        if (!text || isUiLine(text)) continue;
        // Deduplicate adjacent identical text
        if (text === prevText) continue;
        prevText = text;
        parts.push(text);
        break;
      }
      case "code": {
        const lang = seg.lang || "";
        const fence = codeFence(seg.code, lang);
        if (fence) parts.push(fence);
        prevText = "";
        break;
      }
      case "link": {
        const label = normalizeSpaces(seg.label);
        if (!label || isUiLine(label)) continue;
        parts.push(`[${label}](${seg.href})`);
        prevText = "";
        break;
      }
    }
  }

  return parts.join("\n\n");
}
