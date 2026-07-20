const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;

export interface ParsedYouTubeUrl {
  videoId: string;
  normalizedUrl: string;
  kind: "watch" | "shorts" | "short";
}

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let videoId = "";
  let kind: ParsedYouTubeUrl["kind"] = "watch";

  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
    kind = "short";
  } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") ?? "";
      kind = "watch";
    } else if (parts[0] === "shorts") {
      videoId = parts[1] ?? "";
      kind = "shorts";
    } else {
      return null;
    }
  } else {
    return null;
  }

  if (!VIDEO_ID_PATTERN.test(videoId)) return null;

  return {
    videoId,
    normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    kind,
  };
}

export function getYouTubeVideoId(input: string): string | null {
  return parseYouTubeUrl(input)?.videoId ?? null;
}
