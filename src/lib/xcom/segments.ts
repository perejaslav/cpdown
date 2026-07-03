/**
 * X.com segment types — pure data, zero dependencies.
 */

export type XcomSegment =
  | { type: "text"; text: string }
  | { type: "code"; code: string; lang: string }
  | { type: "link"; href: string; label: string };
