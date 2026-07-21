import { browser } from 'wxt/browser';
import type { ExtractionError, ExtractionResult } from '../src/core/result-types';
import { extractOpenYouTubePage } from '../src/extractors/youtube/open-page-extractor';

interface ExtractYouTubePageRequest {
  type: 'CPDOWN_EXTRACT_YOUTUBE_PAGE';
  jobId: string;
}

interface ExtractYouTubePageResponse {
  ok: boolean;
  result?: ExtractionResult;
  error?: ExtractionError;
}

function isExtractRequest(value: unknown): value is ExtractYouTubePageRequest {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.type === 'CPDOWN_EXTRACT_YOUTUBE_PAGE' && typeof record.jobId === 'string';
}

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  runAt: 'document_idle',
  main() {
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (!isExtractRequest(message)) return undefined;

      return extractOpenYouTubePage({
        jobId: message.jobId,
        pageUrl: location.href,
      })
        .then<ExtractYouTubePageResponse>((result) => ({ ok: true, result }))
        .catch<ExtractYouTubePageResponse>((error: unknown) => ({
          ok: false,
          error: {
            jobId: message.jobId,
            code: 'YOUTUBE_EXTRACTION_FAILED',
            message: error instanceof Error ? error.message : 'Не удалось извлечь субтитры YouTube',
            recoverable: true,
          },
        }));
    });
  },
});
