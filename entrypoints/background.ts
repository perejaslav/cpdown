import type { ExtractionResult } from '../src/core/result-types';
import {
  YOUTUBE_CONTEXT_MENU_ID,
  YouTubeBackgroundController,
} from '../src/jobs/youtube-background-controller';
import { recoverYouTubeJobs } from '../src/jobs/job-recovery';

function createYouTubeMenu(): void {
  chrome.contextMenus.remove(YOUTUBE_CONTEXT_MENU_ID, () => {
    void chrome.runtime.lastError;
    chrome.contextMenus.create({
      id: YOUTUBE_CONTEXT_MENU_ID,
      title: 'Копировать субтитры YouTube',
      contexts: ['link'],
      targetUrlPatterns: [
        '*://www.youtube.com/watch?*',
        '*://www.youtube.com/shorts/*',
        '*://youtu.be/*',
      ],
    });
  });
}

function recoverJobs(): Promise<unknown> {
  return recoverYouTubeJobs({
    tabs: {
      async exists(tabId) {
        try {
          const tab = await chrome.tabs.get(tabId);
          return typeof tab?.id === 'number';
        } catch {
          return false;
        }
      },
      async close(tabId) {
        await chrome.tabs.remove(tabId);
      },
    },
  });
}

export default defineBackground(() => {
  const controller = new YouTubeBackgroundController();

  chrome.runtime.onInstalled.addListener(createYouTubeMenu);
  chrome.runtime.onStartup.addListener(() => {
    createYouTubeMenu();
    void recoverJobs();
  });
  createYouTubeMenu();
  void recoverJobs();

  chrome.contextMenus.onClicked.addListener((info: any, tab: any) => {
    if (
      info.menuItemId !== YOUTUBE_CONTEXT_MENU_ID ||
      typeof tab?.id !== 'number' ||
      !info.linkUrl
    ) {
      return;
    }

    void controller
      .startFromLink(tab.id, info.pageUrl || tab.url || '', info.linkUrl)
      .catch((error) => {
        void chrome.tabs.sendMessage(tab.id, {
          type: 'CPDOWN_YOUTUBE_CONTEXT_ERROR',
          jobId: `youtube_start_${Date.now()}`,
          timestamp: Date.now(),
          payload: {
            code: 'YOUTUBE_JOB_START_FAILED',
            message: error instanceof Error ? error.message : String(error),
            recoverable: true,
          },
        });
      });
  });

  chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
    if (changeInfo.status === 'complete') void controller.handleWorkerReady(tabId);
  });

  chrome.runtime.onMessage.addListener((message: unknown, sender: any) => {
    if (!message || typeof message !== 'object') return;
    const record = message as Record<string, unknown>;

    if (record.type === 'CPDOWN_YOUTUBE_RESULT' && typeof record.jobId === 'string') {
      return controller.complete(record.jobId, record.payload as ExtractionResult);
    }

    if (record.type === 'CPDOWN_YOUTUBE_ERROR' && typeof record.jobId === 'string') {
      const payload = (record.payload || {}) as Record<string, unknown>;
      return controller.fail(
        record.jobId,
        typeof payload.code === 'string' ? payload.code : 'YOUTUBE_EXTRACTION_FAILED',
        typeof payload.message === 'string' ? payload.message : 'Не удалось извлечь субтитры',
      );
    }

    if (
      record.type === 'CPDOWN_EXTRACT_YOUTUBE_PAGE' &&
      typeof sender.tab?.id === 'number'
    ) {
      return controller.handleWorkerReady(sender.tab.id);
    }
  });
});
