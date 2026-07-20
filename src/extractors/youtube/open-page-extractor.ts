import type { ExtractionResult } from '../../core/result-types';
import { extractYouTube } from './youtube-extractor';
import { requestPlayerCaptionState } from './player-bridge-client';

export interface OpenPageYouTubeExtractionInput {
  jobId: string;
  pageUrl: string;
  targetWindow?: Window;
  timeoutMs?: number;
}

export async function extractOpenYouTubePage(
  input: OpenPageYouTubeExtractionInput,
): Promise<ExtractionResult> {
  const state = await requestPlayerCaptionState({
    targetWindow: input.targetWindow,
    timeoutMs: input.timeoutMs,
  });

  return extractYouTube({
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
