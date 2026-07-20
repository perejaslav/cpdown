import { describe, expect, it, vi } from 'vitest';
import type { ExtractionResult } from '../../src/core/result-types';
import { extractOpenYouTubePage } from '../../src/extractors/youtube/open-page-extractor';

const result: ExtractionResult = {
  jobId: 'job-1',
  type: 'youtube',
  title: 'Видео',
  sourceUrl: 'https://www.youtube.com/watch?v=video123',
  markdown: '# Видео\n',
  fileName: 'Видео — YouTube.md',
  wordCount: 1,
  estimatedTokens: 2,
  warnings: [],
  metadata: {},
};

describe('extractOpenYouTubePage', () => {
  it('passes the selected track descriptor and pot to the extractor', async () => {
    const extract = vi.fn().mockResolvedValue(result);

    const received = await extractOpenYouTubePage({
      jobId: 'job-1',
      pageUrl: 'https://www.youtube.com/watch?v=video123',
      requestState: async () => ({
        videoId: 'video123',
        selectedTrack: {
          languageCode: 'ru',
          vssId: '.ru',
          kind: '',
          name: 'Русский',
          automatic: false,
        },
        playerResponse: { videoDetails: { videoId: 'video123' } },
        pot: 'token-value',
      }),
      extract,
    });

    expect(received).toBe(result);
    expect(extract).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-1',
        requestedTrack: {
          languageCode: 'ru',
          vssId: '.ru',
          kind: '',
        },
        pot: 'token-value',
      }),
    );
  });
});
