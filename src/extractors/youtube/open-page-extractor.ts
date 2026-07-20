import type { ExtractionResult } from '../../core/result-types';
import type { PlayerCaptionState } from './selected-track';
import { extractYouTube, type YouTubeExtractionInput } from './youtube-extractor';
import { requestPlayerCaptionState } from './player-bridge-client';

export interface OpenPageYouTubeExtractionInput {
  jobId: string;
  pageUrl: string;
  targetWindow?: Window;
  timeoutMs?: number;
  requestState?: (options: {
    targetWindow?: Window;
    timeoutMs?: number;
  }) => Promise<PlayerCaptionState>;
  extract?: (input: YouTubeExtractionInput) => Promise<ExtractionResult>;
}

export async function extractOpenYouTubePage(
  input: OpenPageYouTubeExtractionInput,
): Promise<ExtractionResult> {
  const requestState = input.requestState ?? requestPlayerCaptionState;
  const extract = input.extract ?? extractYouTube;
  const state = await requestState({
    targetWindow: input.targetWindow,
    timeoutMs: input.timeoutMs,
  });

  return extract({
    jobId: input.jobId,
    pageUrl: input.pageUrl,
    playerResponse: state.playerResponse,
    requestedTrack: state.selectedTrack
      ? {
          languageCode: state.selectedTrack.languageCode,
          vssId: state.selectedTrack.vssId,
          kind: state.selectedTrack.kind,
        }
      : undefined,
    pot: state.pot,
  });
}
