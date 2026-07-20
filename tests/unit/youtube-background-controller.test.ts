import { describe, expect, it, vi } from 'vitest';
import { YouTubeBackgroundController } from '../../src/jobs/youtube-background-controller';
import type { BackgroundYouTubeJob } from '../../src/jobs/youtube-job';

function createJob(): BackgroundYouTubeJob {
  const now = Date.now();
  return {
    jobId: 'youtube_test',
    sourceTabId: 10,
    workerTabId: 20,
    sourceUrl: 'https://example.com',
    videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
    status: 'waiting-page',
    createdAt: now,
    updatedAt: now,
  };
}

describe('YouTubeBackgroundController', () => {
  it('returns a worker result to the matching source tab and closes only its worker', async () => {
    const job = createJob();
    const jobs = {
      list: vi.fn().mockResolvedValue([job]),
      get: vi.fn().mockResolvedValue(job),
      setStatus: vi.fn().mockResolvedValue({ ...job, status: 'extracting' }),
    } as any;
    const runner = {
      finish: vi.fn().mockResolvedValue(undefined),
    } as any;
    const result = {
      jobId: job.jobId,
      type: 'youtube',
      title: 'Видео',
      sourceUrl: job.videoUrl,
      markdown: '# Видео\n',
      fileName: 'Видео — YouTube.md',
      wordCount: 1,
      estimatedTokens: 2,
      warnings: [],
      metadata: {},
    } as const;
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, result })
      .mockResolvedValueOnce(undefined);
    const controller = new YouTubeBackgroundController(jobs, runner, {
      sendMessage,
      setTimeout: vi.fn() as any,
      clearTimeout: vi.fn(),
    });

    await controller.handleWorkerReady(job.workerTabId);

    expect(sendMessage).toHaveBeenNthCalledWith(1, 20, expect.objectContaining({
      type: 'CPDOWN_EXTRACT_YOUTUBE_PAGE',
      jobId: job.jobId,
    }));
    expect(sendMessage).toHaveBeenNthCalledWith(2, 10, expect.objectContaining({
      type: 'CPDOWN_YOUTUBE_CONTEXT_RESULT',
      jobId: job.jobId,
      payload: result,
    }));
    expect(runner.finish).toHaveBeenCalledWith(job.jobId, 'completed');
  });

  it('routes a worker failure to the matching source tab', async () => {
    const job = createJob();
    const jobs = {
      list: vi.fn().mockResolvedValue([job]),
      get: vi.fn().mockResolvedValue(job),
      setStatus: vi.fn().mockResolvedValue({ ...job, status: 'extracting' }),
    } as any;
    const runner = { finish: vi.fn().mockResolvedValue(undefined) } as any;
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        error: {
          jobId: job.jobId,
          code: 'NO_CAPTIONS',
          message: 'Нет субтитров',
          recoverable: true,
        },
      })
      .mockResolvedValueOnce(undefined);
    const controller = new YouTubeBackgroundController(jobs, runner, {
      sendMessage,
      setTimeout: vi.fn() as any,
      clearTimeout: vi.fn(),
    });

    await controller.handleWorkerReady(job.workerTabId);

    expect(sendMessage).toHaveBeenNthCalledWith(2, 10, expect.objectContaining({
      type: 'CPDOWN_YOUTUBE_CONTEXT_ERROR',
      payload: expect.objectContaining({ code: 'NO_CAPTIONS' }),
    }));
    expect(runner.finish).toHaveBeenCalledWith(job.jobId, 'failed', 'Нет субтитров');
  });
});
