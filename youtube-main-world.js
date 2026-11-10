// Runs in the page's own JS world on youtube.com.
// Answers GET_YT_INITIAL_PLAYER_RESPONSE with the player response and the "pot" token
// that the YouTube player itself puts into its caption (timedtext) requests.
(function () {
  'use strict';
  if (window.__cpdownMainWorldLoaded) return;
  window.__cpdownMainWorldLoaded = true;

  var POT_WAIT_MS = 4000;
  var pots = {}; // videoId -> pot
  var lastPot = '';

  function remember(url) {
    try {
      if (typeof url !== 'string' || url.indexOf('/api/timedtext') === -1) return;
      var params = new URL(url, location.href).searchParams;
      var pot = params.get('pot');
      if (!pot) return;
      lastPot = pot;
      var v = params.get('v');
      if (v) pots[v] = pot;
    } catch (_) {}
  }

  // The player may request captions through XMLHttpRequest or fetch.
  var xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    remember(typeof url === 'string' ? url : String(url || ''));
    return xhrOpen.apply(this, arguments);
  };
  var pageFetch = window.fetch;
  if (typeof pageFetch === 'function') {
    window.fetch = function (input) {
      try { remember(typeof input === 'string' ? input : (input && input.url) || ''); } catch (_) {}
      return pageFetch.apply(this, arguments);
    };
  }

  // Requests made before this script was loaded are still listed here.
  function scanFinishedRequests() {
    try {
      var entries = performance.getEntriesByType('resource');
      for (var i = 0; i < entries.length; i++) remember(entries[i].name);
    } catch (_) {}
  }

  function currentVideoId() {
    try { return new URL(location.href).searchParams.get('v') || ''; } catch (_) { return ''; }
  }

  function potFor(videoId) {
    scanFinishedRequests();
    if (videoId) return pots[videoId] || '';
    return lastPot;
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // Turns captions on so that the player requests them (with a pot), waits for
  // that request, then puts the captions button back the way it was.
  async function waitForPot(videoId) {
    var pot = potFor(videoId);
    if (pot) return { pot: pot, note: 'already captured' };
    var deadline = Date.now() + POT_WAIT_MS;
    var clicks = 0, sawButton = false;
    while (Date.now() < deadline) {
      var button = document.querySelector('button.ytp-subtitles-button');
      if (button && !sawButton) {
        sawButton = true;
        if (button.getAttribute('aria-pressed') === 'true') {
          // Already on but nothing captured: switch off and on again.
          button.click();
          await sleep(300);
          button.click();
          clicks += 2;
        } else {
          button.click();
          clicks += 1;
        }
      }
      await sleep(200);
      pot = potFor(videoId);
      if (pot) break;
    }
    if (clicks % 2 === 1) {
      var again = document.querySelector('button.ytp-subtitles-button');
      if (again) again.click();
    }
    var note = pot ? 'captured after turning captions on'
      : sawButton ? 'player made no caption request in ' + POT_WAIT_MS + 'ms'
        : 'captions button not found';
    return { pot: pot, note: note };
  }

  window.addEventListener('message', async function (event) {
    if (event.source !== window || !event.data || event.data.type !== 'GET_YT_INITIAL_PLAYER_RESPONSE') return;
    var result = { pot: '', note: '' };
    try { result = await waitForPot(currentVideoId()); } catch (e) { result.note = 'error: ' + (e && e.message); }
    window.postMessage({
      type: 'YT_INITIAL_PLAYER_RESPONSE',
      data: {
        ytInitialPlayerResponse: window.ytInitialPlayerResponse || null,
        pot: result.pot,
        potNote: result.note
      },
      requestId: event.data.requestId
    }, '*');
  });
})();
