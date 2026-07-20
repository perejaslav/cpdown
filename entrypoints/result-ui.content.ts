import { defineContentScript } from 'wxt/sandbox';
import type { ExtractionError, ExtractionResult } from '../src/core/result-types';
import { showExtractionErrorToast, showExtractionResultToast } from '../src/ui/result-toast';

interface ResultMessage {
  type: 'CPDOWN_YOUTUBE_CONTEXT_RESULT';
  jobId: string;
  payload: ExtractionResult;
}

interface ErrorMessage {
  type: 'CPDOWN_YOUTUBE_CONTEXT_ERROR';
  jobId: string;
  payload: ExtractionError;
}

function isResultMessage(value: unknown): value is ResultMessage {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.type === 'CPDOWN_YOUTUBE_CONTEXT_RESULT' && typeof record.jobId === 'string';
}

function isErrorMessage(value: unknown): value is ErrorMessage {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.type === 'CPDOWN_YOUTUBE_CONTEXT_ERROR' && typeof record.jobId === 'string';
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    chrome.runtime.onMessage.addListener((message: unknown) => {
      if (isResultMessage(message)) {
        showExtractionResultToast(message.payload);
        return;
      }
      if (isErrorMessage(message)) {
        showExtractionErrorToast(message.payload);
      }
    });
  },
});
