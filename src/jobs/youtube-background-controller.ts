import { normalizeYouTubeUrl } from '../extractors/youtube/youtube-url';
import type { ExtractionResult } from '../core/result-types';
import { YouTubeJobManager } from './job-manager';
import { YouTubeWorkerTabRunner } from './youtube-tab-runner';

export const YOUTUBE_CONTEXT_MENU_ID = 'cpdown-transcript';
export const YOUTUBE_JOB_TIMEOUT_MS = 30_000;

export interface BackgroundControllerAdapters {
  sendMessage(tabId: number, message: unknown): Promise<unknown>;
  setTimeout(handler: () => void, timeoutMs: number): ReturnType<typeof setTimeout>;
  clearTimeout(handle: ReturnType<typeof setTimeout>): void;
}

const defaultAdapters: BackgroundControllerAdapters = {
  sendMessage: (tabId, message) => chrome.tabs.sendMessage(tabId, message),
  setTimeout: (handler, timeoutMs) => globalThis.setTimeout(handler, timeoutMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle),
};

export class YouTubeBackgroundController {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly jobs = new YouTubeJobManager(),
    private readonly runner = new YouTubeWorkerTabRunner(jobs),
    private readonly adapters: BackgroundControllerAdapters = defaultAdapters,
  ) {}

  async startFromLink(sourceTabId: number, sourceUrl: string, linkUrl: string): Promise<string> {
    const normalized = normalizeYouTubeUrl(linkUrl);
    if (!normalized) throw new Error('Неподдерживаемая ссылка YouTube');

    const job = await this.runner.start({
      sourceTabId,
      sourceUrl,
      videoUrl: normalized.normalizedUrl,
    });

    const timer = this.adapters.setTimeout(() => {
      void this.fail(job.jobId, 'TIMEOUT', 'Не удалось извлечь субтитры за 30 секунд', 'timeout');
    }, YOUTUBE_JOB_TIMEOUT_MS);
    this.timers.set(job.jobId, timer);
    return job.jobId;
  }

  async handleWorkerReady(workerTabId: number): Promise<void> {
    const job = (await this.jobs.list()).find((candidate) => candidate.workerTabId === workerTabId);
    if (!job || job.status !== 'waiting-page') return;

    await this.jobs.setStatus(job.jobId, 'extracting');
    await this.adapters.sendMessage(workerTabId, {
      type: 'CPDOWN_EXTRACT_YOUTUBE_PAGE',
      jobId: job.jobId,
      timestamp: Date.now(),
    });
  }

  async complete(jobId: string, result: ExtractionResult): Promise<void> {
    const job = await this.jobs.get(jobId);
    if (!job) return;
    this.clearTimer(jobId);

    try {
      await this.adapters.sendMessage(job.sourceTabId, {
        type: 'CPDOWN_YOUTUBE_CONTEXT_RESULT',
        jobId,
        timestamp: Date.now(),
        payload: result,
      });
    } finally {
      await this.runner.finish(jobId, 'completed');
    }
  }

  async fail(
    jobId: string,
    code: string,
    message: string,
    status: 'failed' | 'cancelled' | 'timeout' = 'failed',
  ): Promise<void> {
    const job = await this.jobs.get(jobId);
    if (!job) return;
    this.clearTimer(jobId);

    try {
      await this.adapters.sendMessage(job.sourceTabId, {
        type: 'CPDOWN_YOUTUBE_CONTEXT_ERROR',
        jobId,
        timestamp: Date.now(),
        payload: { jobId, code, message, recoverable: status !== 'cancelled' },
      });
    } catch {
      // Исходная вкладка могла быть закрыта.
    } finally {
      await this.runner.finish(jobId, status, message);
    }
  }

  private clearTimer(jobId: string): void {
    const timer = this.timers.get(jobId);
    if (timer !== undefined) this.adapters.clearTimeout(timer);
    this.timers.delete(jobId);
  }
}
