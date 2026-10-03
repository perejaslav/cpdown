(async () => {
  try {
    var playerData;

    // Try 1: maybe youtube-main-world.js is already loaded (most common case)
    try {
      playerData = await getPlayerData(3000);
    } catch (firstErr) {
      // Try 2: inject youtube-main-world.js ourselves and retry
      await new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = chrome.runtime.getURL('youtube-main-world.js');
        s.onload = function () { setTimeout(resolve, 500); };
        s.onerror = function () { setTimeout(resolve, 500); };
        (document.head || document.documentElement).appendChild(s);
      });
      playerData = await getPlayerData(10000);
    }

    const playerResponse = playerData.ytInitialPlayerResponse;
    const pot = playerData.pot;

    if (!playerResponse) {
      chrome.runtime.sendMessage({
        type: 'TRANSCRIPT_RESULT',
        payload: { error: 'Could not get video data from YouTube' }
      });
      return;
    }

    const videoDetails = playerResponse.videoDetails;
    const actualVideoId = videoDetails && (videoDetails.videoId || videoDetails.id);
    var expectedVideoId = '';
    try {
      var currentUrl = new URL(location.href);
      expectedVideoId = currentUrl.searchParams.get('v') || (currentUrl.hostname === 'youtu.be' ? currentUrl.pathname.slice(1).split('/')[0] : '');
    } catch (_) {}
    if (expectedVideoId && actualVideoId && expectedVideoId !== actualVideoId) {
      chrome.runtime.sendMessage({
        type: 'TRANSCRIPT_RESULT',
        payload: { error: 'YouTube returned stale video data. Please try again.' }
      });
      return;
    }

    const captionTracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
      chrome.runtime.sendMessage({
        type: 'TRANSCRIPT_RESULT',
        payload: { error: 'No captions available for this video' }
      });
      return;
    }

    const track = captionTracks[0];
    const baseUrl = track.baseUrl;
    const srtUrl = baseUrl + '&fmt=srt&c=WEB' + (pot ? '&pot=' + pot : '');

    const response = await fetch(srtUrl);
    const srtText = await response.text();

    const lines = srtText.split('\n');
    const textLines = [];
    for (var i = 0; i < lines.length; i++) {
      var trimmed = lines[i].trim();
      if (!trimmed || /^\d+$/.test(trimmed) || trimmed.indexOf('-->') !== -1) {
        continue;
      }
      textLines.push(trimmed);
    }

    const plainText = textLines.join('\n');
    const title = videoDetails && videoDetails.title || 'YouTube Video';
    const markdown = '# ' + title + '\n\n' + plainText;

    // Rough token estimate: ~4 chars per token
    var tokenCount = Math.ceil(markdown.length / 4);

    chrome.runtime.sendMessage({
      type: 'TRANSCRIPT_RESULT',
      payload: { markdown: markdown, title: title, tokenCount: tokenCount, videoId: actualVideoId }
    });
  } catch (e) {
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPT_RESULT',
      payload: { error: e.message || 'Unknown error extracting transcript' }
    });
  }

  function getPlayerData(timeoutMs) {
    return new Promise(function (resolve, reject) {
      var requestId = 'ctx_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      function handler(event) {
        if (
          event.source === window &&
          event.data.type === 'YT_INITIAL_PLAYER_RESPONSE' &&
          event.data.requestId === requestId
        ) {
          window.removeEventListener('message', handler);
          resolve(event.data.data);
        }
      }
      window.addEventListener('message', handler);
      window.postMessage({ type: 'GET_YT_INITIAL_PLAYER_RESPONSE', requestId: requestId }, '*');
      setTimeout(function () {
        window.removeEventListener('message', handler);
        reject(new Error('Timeout waiting for YouTube player data'));
      }, timeoutMs);
    });
  }
})();
