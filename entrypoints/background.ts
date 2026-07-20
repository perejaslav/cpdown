import type { CpdownRuntimeMessage } from '../src/core/message-types';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    console.info('cpdown 1.8 source scaffold initialized');
  });

  browser.runtime.onMessage.addListener((message: CpdownRuntimeMessage) => {
    if (!message || typeof message !== 'object' || !('type' in message)) return;

    // The production 1.7 background remains the behavioral baseline until
    // each existing flow has been migrated and covered by regression tests.
    if (message.type === 'EXTRACTION_START') {
      return Promise.resolve({
        accepted: false,
        reason: 'Source migration is not complete',
        jobId: message.jobId,
      });
    }
  });
});
