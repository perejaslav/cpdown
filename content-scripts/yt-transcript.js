(async () => {
  try {
    const playerData = await new Promise((resolve, reject) => {
      const requestId = 'ctx_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const handler = (event) => {
        if (
          event.source === window &&
          event.data.type === 'YT_INITIAL_PLAYER_RESPONSE' &&
          event.data.requestId === requestId
        ) {
          window.removeEventListener('message', handler);
          resolve(event.data.data);
        }
      };
      window.addEventListener('message', handler);
      window.postMessage({ type: 'GET_YT_INITIAL_PLAYER_RESPONSE', requestId }, '*');
      setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new Error('Timeout waiting for YouTube player data'));
      }, 10000);
    });

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
    const srtUrl = `${baseUrl}&fmt=srt&c=WEB${pot ? `&pot=${pot}` : ''}`;

    const response = await fetch(srtUrl);
    const srtText = await response.text();

    const lines = srtText.split('\n');
    const textLines = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || /^\d+$/.test(trimmed) || trimmed.includes('-->')) {
        continue;
      }
      textLines.push(trimmed);
    }

    const plainText = textLines.join('\n');
    const title = videoDetails?.title || 'YouTube Video';
    const markdown = `# ${title}\n\n${plainText}`;

    chrome.runtime.sendMessage({
      type: 'TRANSCRIPT_RESULT',
      payload: { markdown, title, videoId: videoDetails?.id }
    });
  } catch (e) {
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPT_RESULT',
      payload: { error: e.message || 'Unknown error extracting transcript' }
    });
  }
})();
