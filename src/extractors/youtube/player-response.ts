export interface YouTubeVideoDetails {
  videoId?: string;
  id?: string;
  title?: string;
  author?: string;
  channelId?: string;
}

export interface YouTubePlayerResponse {
  videoDetails?: YouTubeVideoDetails;
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: unknown[];
    };
  };
}

export function getPlayerResponseVideoId(response: YouTubePlayerResponse | null | undefined): string | null {
  const details = response?.videoDetails;
  return details?.videoId ?? details?.id ?? null;
}

export function assertFreshPlayerResponse(
  expectedVideoId: string,
  response: YouTubePlayerResponse | null | undefined,
): void {
  const actualVideoId = getPlayerResponseVideoId(response);

  if (!actualVideoId) {
    throw new Error("YouTube player response does not contain a video identifier");
  }

  if (actualVideoId !== expectedVideoId) {
    throw new Error(
      `YouTube returned stale player data: expected ${expectedVideoId}, received ${actualVideoId}`,
    );
  }
}
