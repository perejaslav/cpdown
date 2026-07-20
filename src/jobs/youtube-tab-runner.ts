import { createJobId } from './job-id';
import { YouTubeJobManager } from './job-manager';
import type { BackgroundYouTubeJob } from './youtube-job';
import type { RequestedCaptionTrack } from '../extractors/youtube/caption-track-selector';

export interface TabsAdapter {
  create(properties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab>;
  update(tabId: number, properties: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab>;
  remove(tabId: number): Promise<void>;
}

const defaultTabs: TabsAdapter = {
  create: (properties) => chrome.tabs.create(properties),
  update: (tabId, properties) => chrome.tabs.update(tabId, properties),
  remove: (tabId) => chrome.tabs.remove(tabId),
};

export interface StartBackgroundYouTubeJobInput {
  sourceTabId: number;
  sourceUrl: string;
  videoUrl: string;
  requestedTrack?: RequestedCaptionTrack;
}

export class YouTubeWorkerTabRunner {
  constructor(
    private readonly jobs = new YouTubeJobManager(),
    private readonly tabs: TabsAdapter = defaultTabs,
  ) {}

  async start(input: StartBackgroundYouTubeJobInput): Promise<BackgroundYouTubeJob> {
    const now = Date.now();
    const jobId = createJobId('youtube');
    const placeholder: BackgroundYouTubeJob = {
      jobId,
      sourceTabId: input.sourceTabId,
      workerTabId: -1,
      sourceUrl: input.sourceUrl,
      videoUrl: input.videoUrl,
      requestedTrack: input.requestedTrack,
      status: 'opening-tab',
      createdAt: now,
      updatedAt: now,
    };

    await this.jobs.create(placeholder);

    try {
      const tab = await this.tabs.create({
        url: input.videoUrl,
        active: false,
      });
      if (typeof tab.id !== 'number') throw new Error('Не удалось получить ID временной вкладки');

      try {
        await this.tabs.update(tab.id, { muted: true });
      } catch {
        // Приглушение желательно, но его сбой не должен отменять извлечение.
      }

      return await this.jobs.update(jobId, {
        workerTabId: tab.id,
        status: 'waiting-page',
      });
    } catch (error) {
      await this.jobs.setStatus(
        jobId,
        'failed',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async finish(
    jobId: string,
    status: 'completed' | 'failed' | 'cancelled' | 'timeout',
    error?: string,
  ): Promise<void> {
    const job = await this.jobs.get(jobId);
    if (!job) return;

    await this.jobs.setStatus(jobId, status, error);

    if (job.workerTabId >= 0) {
      try {
        await this.tabs.remove(job.workerTabId);
      } catch {
        // Вкладка могла быть уже закрыта пользователем или браузером.
      }
    }

    await this.jobs.remove(jobId);
  }
}
