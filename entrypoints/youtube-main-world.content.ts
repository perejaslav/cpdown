import { defineContentScript } from 'wxt/sandbox';
import { installPlayerBridge } from '../src/extractors/youtube/player-bridge';

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    installPlayerBridge(window);
  },
});
