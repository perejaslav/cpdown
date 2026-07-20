import type { CaptionTrack } from "./caption-track-selector";
import { getPlayerResponseVideoId } from "./player-response";
import {
  findSelectedTrackBySettings,
  toSelectedTrackDescriptor,
  type PlayerCaptionState,
} from "./selected-track";

interface CaptionTrackListRenderer {
  captionTracks?: CaptionTrack[];
}

interface PlayerResponseLike {
  captions?: {
    playerCaptionsTracklistRenderer?: CaptionTrackListRenderer;
  };
}

export interface PlayerStateReaderInput {
  playerResponse: PlayerResponseLike;
  captionSettings?: Record<string, unknown> | null;
  pot?: string;
}

export function readPlayerCaptionState(input: PlayerStateReaderInput): PlayerCaptionState {
  const videoId = getPlayerResponseVideoId(input.playerResponse);
  if (!videoId) throw new Error("YouTube player response does not contain videoId");

  const tracks =
    input.playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  const selectedTrack = findSelectedTrackBySettings(tracks, input.captionSettings);

  return {
    videoId,
    selectedTrack: toSelectedTrackDescriptor(selectedTrack),
    playerResponse: input.playerResponse,
    pot: input.pot,
  };
}
