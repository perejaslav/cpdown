(async () => {
  // Step log, sent back to the background service worker console as "[cpdown] transcript steps".
  var startedAt = Date.now();
  var debug = [];
  function log(msg) {
    debug.push('+' + (Date.now() - startedAt) + 'ms ' + msg);
  }
  function send(payload) {
    payload.debug = debug;
    chrome.runtime.sendMessage({ type: 'TRANSCRIPT_RESULT', payload: payload });
  }

  try {
    log('start, visibility=' + document.visibilityState + ', url=' + location.pathname + location.search);
    var playerData = null;

    // Try 1: youtube-main-world.js is usually already loaded by content.js
    try {
      playerData = await getPlayerData(7000);
      log('player data: from already loaded main-world script');
    } catch (firstErr) {
      log('player data: no answer in 7s, injecting main-world script');
      await new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = chrome.runtime.getURL('youtube-main-world.js');
        s.onload = function () { setTimeout(resolve, 500); };
        s.onerror = function () { setTimeout(resolve, 500); };
        (document.head || document.documentElement).appendChild(s);
      });
      try {
        playerData = await getPlayerData(7000);
        log('player data: ok after injection');
      } catch (secondErr) {
        log('player data: no answer after injection');
      }
    }

    var playerResponse = playerData && playerData.ytInitialPlayerResponse;
    var pot = playerData && playerData.pot;
    if (!playerResponse) {
      playerResponse = readInlineJson('ytInitialPlayerResponse');
      log('player response from page HTML: ' + (playerResponse ? 'found' : 'not found'));
    }
    if (!playerResponse) {
      send({ error: 'Could not get video data from YouTube' });
      return;
    }

    var videoDetails = playerResponse.videoDetails;
    var actualVideoId = videoDetails && (videoDetails.videoId || videoDetails.id);
    var expectedVideoId = '';
    try {
      var currentUrl = new URL(location.href);
      expectedVideoId = currentUrl.searchParams.get('v') || (currentUrl.hostname === 'youtu.be' ? currentUrl.pathname.slice(1).split('/')[0] : '');
    } catch (_) {}
    log('videoId expected=' + expectedVideoId + ' actual=' + actualVideoId);
    if (expectedVideoId && actualVideoId && expectedVideoId !== actualVideoId) {
      send({ error: 'YouTube returned stale video data. Please try again.' });
      return;
    }

    var title = (videoDetails && videoDetails.title) || 'YouTube Video';
    var captionTracks =
      playerResponse.captions &&
      playerResponse.captions.playerCaptionsTracklistRenderer &&
      playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
    log('caption tracks: ' + (captionTracks ? captionTracks.length : 0) + ', pot: ' + (pot ? 'yes' : 'no') +
      (playerData && playerData.potNote ? ' (' + playerData.potNote + ')' : ''));

    var plainText = '';

    // Method 1: timedtext (the original method)
    if (captionTracks && captionTracks.length > 0) {
      try {
        log('timedtext: tracks ' + listTracks(captionTracks));
        var webOrig = originalAudioLang(playerResponse);
        log('timedtext: original audio ' + (webOrig || 'unknown'));
        var webTrack = pickTrack(captionTracks, playerResponse.captions.playerCaptionsTracklistRenderer, webOrig);
        log('timedtext: track ' + describeTrack(webTrack));
        var srtUrl = cleanTrackUrl(webTrack.baseUrl) + '&fmt=srt&c=WEB' + (pot ? '&pot=' + encodeURIComponent(pot) : '');
        var response = await fetch(srtUrl);
        var srtText = await response.text();
        log('timedtext: HTTP ' + response.status + ', ' + srtText.length + ' chars');
        plainText = srtToText(srtText);
      } catch (e) {
        log('timedtext: failed: ' + (e && e.message));
      }
    }

    // Method 2: caption tracks from the Android app API (no pot needed)
    if (!plainText && actualVideoId) {
      try {
        plainText = await fetchViaAndroidPlayer(actualVideoId, playerResponse);
      } catch (e) {
        log('android: failed: ' + (e && e.message));
      }
    }

    // Method 3: the "Show transcript" panel API
    if (!plainText) {
      try {
        plainText = await fetchTranscriptPanel();
      } catch (e) {
        log('transcript panel: failed: ' + (e && e.message));
      }
    }

    // Method 4: open the transcript panel on the page and read its text
    if (!plainText) {
      try {
        plainText = await readTranscriptFromPage(document.visibilityState === 'hidden' ? 3 : 20);
      } catch (e) {
        log('page transcript: failed: ' + (e && e.message));
      }
    }

    // Method 5: a background tab does not play video or draw panels, so YouTube
    // gives nothing there. Show the tab for a moment and try again.
    if (!plainText && document.visibilityState === 'hidden') {
      try {
        plainText = await retryInVisibleTab(captionTracks, playerResponse);
      } catch (e) {
        log('visible tab: failed: ' + (e && e.message));
      }
    }

    if (!plainText) {
      if (!captionTracks || captionTracks.length === 0) {
        send({ error: 'No captions available for this video' });
      } else {
        send({ error: 'YouTube returned empty subtitles' });
      }
      return;
    }

    var markdown = '# ' + title + '\n\n' + plainText;
    // Rough token estimate: ~4 chars per token
    var tokenCount = Math.ceil(markdown.length / 4);
    log('done, ' + markdown.length + ' chars');
    send({ markdown: markdown, title: title, tokenCount: tokenCount, videoId: actualVideoId });
  } catch (e) {
    log('unexpected error: ' + (e && e.message));
    send({ error: (e && e.message) || 'Unknown error extracting transcript' });
  }

  function srtToText(srtText) {
    var lines = srtText.split('\n');
    var textLines = [];
    for (var i = 0; i < lines.length; i++) {
      var trimmed = lines[i].trim();
      if (!trimmed || /^\d+$/.test(trimmed) || trimmed.indexOf('-->') !== -1) {
        continue;
      }
      textLines.push(trimmed);
    }
    return textLines.join('\n');
  }

  async function fetchTranscriptPanel() {
    var initialData = readInlineJson('ytInitialData');
    if (!initialData) {
      log('transcript panel: ytInitialData not found');
      return '';
    }
    var params = findValue(initialData, function (node) {
      return node.getTranscriptEndpoint && node.getTranscriptEndpoint.params;
    });
    if (!params) {
      log('transcript panel: video has no transcript button');
      return '';
    }
    var cfg = readYtcfg();
    var context = cfg.context || { client: { clientName: 'WEB', clientVersion: cfg.clientVersion || '2.20250101.00.00' } };
    var headers = { 'Content-Type': 'application/json', 'X-Youtube-Client-Name': '1' };
    if (context.client && context.client.clientVersion) headers['X-Youtube-Client-Version'] = context.client.clientVersion;
    if (context.client && context.client.visitorData) headers['X-Goog-Visitor-Id'] = context.client.visitorData;
    // A signed-in session must be confirmed with a SAPISIDHASH header, as the site itself does.
    var auth = await sapisidHash();
    if (auth) {
      headers['Authorization'] = auth;
      headers['X-Origin'] = location.origin;
      headers['X-Goog-AuthUser'] = cfg.sessionIndex || '0';
    }
    log('transcript panel: full context ' + (cfg.context ? 'yes' : 'no') + ', signed in: ' + (auth ? 'yes' : 'no'));
    var url = '/youtubei/v1/get_transcript?prettyPrint=false' + (cfg.apiKey ? '&key=' + cfg.apiKey : '');
    var response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ context: context, params: params })
    });
    log('transcript panel: HTTP ' + response.status);
    if (!response.ok) {
      try { log('transcript panel: ' + (await response.text()).replace(/\s+/g, ' ').slice(0, 200)); } catch (_) {}
      return '';
    }
    var data = await response.json();
    var segments = segmentsFromResponse(data);
    log('transcript panel: ' + segments.length + ' segments');
    return segments.join('\n');
  }

  async function sapisidHash() {
    var match = document.cookie.match(/(?:^|;\s*)(?:SAPISID|__Secure-3PAPISID)=([^;]+)/);
    if (!match || !window.crypto || !crypto.subtle) return '';
    var ts = Math.floor(Date.now() / 1000);
    var bytes = new TextEncoder().encode(ts + ' ' + match[1] + ' ' + location.origin);
    var digest = new Uint8Array(await crypto.subtle.digest('SHA-1', bytes));
    var hex = '';
    for (var i = 0; i < digest.length; i++) hex += ('0' + digest[i].toString(16)).slice(-2);
    return 'SAPISIDHASH ' + ts + '_' + hex;
  }

  async function retryInVisibleTab(captionTracks, playerResponse) {
    log('visible tab: asking to show the tab');
    chrome.runtime.sendMessage({ type: 'TRANSCRIPT_NEED_VISIBLE' });
    for (var i = 0; i < 10 && document.visibilityState === 'hidden'; i++) {
      await new Promise(function (resolve) { setTimeout(resolve, 300); });
    }
    log('visible tab: visibility=' + document.visibilityState);
    if (document.visibilityState === 'hidden') return '';
    var text = '';
    if (captionTracks && captionTracks.length > 0) {
      var data = null;
      try { data = await getPlayerData(7000); } catch (_) {}
      var pot = data && data.pot;
      log('visible tab: pot: ' + (pot ? 'yes' : 'no') + (data && data.potNote ? ' (' + data.potNote + ')' : ''));
      if (pot) {
        var track = pickTrack(captionTracks, playerResponse.captions.playerCaptionsTracklistRenderer, originalAudioLang(playerResponse));
        var response = await fetch(cleanTrackUrl(track.baseUrl) + '&fmt=srt&c=WEB&pot=' + encodeURIComponent(pot));
        var srt = await response.text();
        log('visible tab: timedtext HTTP ' + response.status + ', ' + srt.length + ' chars');
        text = srtToText(srt);
      }
    }
    if (!text) text = await readTranscriptFromPage(20);
    return text;
  }

  // The response to the page's own transcript request, caught by youtube-main-world.js.
  function getCapturedTranscript() {
    return new Promise(function (resolve) {
      var requestId = 'tr_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      function handler(event) {
        if (event.source === window && event.data && event.data.type === 'CPDOWN_PAGE_TRANSCRIPT' &&
            event.data.requestId === requestId) {
          window.removeEventListener('message', handler);
          resolve(event.data.data || '');
        }
      }
      window.addEventListener('message', handler);
      window.postMessage({ type: 'CPDOWN_GET_PAGE_TRANSCRIPT', requestId: requestId }, '*');
      setTimeout(function () { window.removeEventListener('message', handler); resolve(''); }, 500);
    });
  }

  function segmentsFromResponse(data) {
    var segments = [];
    collect(data, function (node) {
      var seg = node.transcriptSegmentRenderer;
      if (seg && seg.snippet) {
        var text = seg.snippet.simpleText ||
          (seg.snippet.runs || []).map(function (r) { return r.text; }).join('');
        if (text && text.trim()) segments.push(text.trim());
      }
    });
    return segments;
  }

  function transcriptLinesFromDom() {
    var lines = [];
    var old = document.querySelectorAll('ytd-transcript-segment-renderer .segment-text');
    for (var i = 0; i < old.length; i++) lines.push(old[i].textContent || '');
    var items = document.querySelectorAll('transcript-segment-view-model');
    for (var j = 0; j < items.length; j++) {
      var textNode = items[j].querySelector('.ytAttributedStringHost, .yt-core-attributed-string, span[role="text"]');
      if (textNode) { lines.push(textNode.textContent || ''); continue; }
      // Unknown markup: take everything except the timestamp.
      var copy = items[j].cloneNode(true);
      var stamps = copy.querySelectorAll('[class*="imestamp"]');
      for (var k = 0; k < stamps.length; k++) stamps[k].remove();
      lines.push(copy.textContent || '');
    }
    return lines.map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
  }

  // Clicks the page's own "Show transcript" button, then takes the text either
  // from the page's own network response or from the rendered lines.
  async function readTranscriptFromPage(maxPolls) {
    var button = document.querySelector(
      'ytd-video-description-transcript-section-renderer button, ' +
      'button[aria-label="Show transcript"], button[aria-label="Показать расшифровку видео"]');
    if (!button) {
      log('page transcript: button not found');
      return '';
    }
    button.click();
    var lastCount = -1, lines = [];
    for (var i = 0; i < maxPolls; i++) {
      await new Promise(function (resolve) { setTimeout(resolve, 300); });
      var captured = await getCapturedTranscript();
      if (captured) {
        var segments = [];
        try { segments = segmentsFromResponse(JSON.parse(captured)); } catch (_) {}
        log('page transcript: caught page response, ' + captured.length + ' chars, ' + segments.length + ' segments');
        if (segments.length) return segments.join('\n');
      }
      lines = transcriptLinesFromDom();
      if (lines.length > 0 && lines.length === lastCount) break;
      lastCount = lines.length;
    }
    log('page transcript: ' + lines.length + ' lines on the page, items: ' +
      document.querySelectorAll('ytd-transcript-segment-renderer, transcript-segment-view-model').length);
    return lines.join('\n');
  }

  async function fetchViaAndroidPlayer(videoId, playerResponseForLang) {
    var cfg = readYtcfg();
    var url = '/youtubei/v1/player?prettyPrint=false' + (cfg.apiKey ? '&key=' + cfg.apiKey : '');
    var response = await fetch(url, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
        videoId: videoId
      })
    });
    log('android: player HTTP ' + response.status);
    if (!response.ok) return '';
    var data = await response.json();
    var tracks = data && data.captions && data.captions.playerCaptionsTracklistRenderer &&
      data.captions.playerCaptionsTracklistRenderer.captionTracks;
    log('android: caption tracks: ' + (tracks ? tracks.length : 0) +
      (data && data.playabilityStatus ? ', status ' + data.playabilityStatus.status : ''));
    if (!tracks || tracks.length === 0) return '';
    log('android: tracks ' + listTracks(tracks));
    var orig = originalAudioLang(data) || originalAudioLang(playerResponseForLang);
    log('android: original audio ' + (orig || 'unknown'));
    var track = pickTrack(tracks, data.captions.playerCaptionsTracklistRenderer, orig);
    log('android: track ' + describeTrack(track));
    var trackUrl = cleanTrackUrl(track.baseUrl);
    var res = await fetch(trackUrl, { credentials: 'omit' });
    var xml = await res.text();
    log('android: timedtext HTTP ' + res.status + ', ' + xml.length + ' chars');
    return xmlToText(xml);
  }

  // Picks the track in the language spoken in the video:
  // the auto-generated (asr) track tells the spoken language;
  // a manual track in that language is preferred over the asr one.
  // Language of the original audio. Videos with auto-dubbing have several
  // audio tracks (and an auto-generated caption track for each of them).
  function originalAudioLang(response) {
    var formats = (response && response.streamingData && response.streamingData.adaptiveFormats) || [];
    var byFlag = '', byName = '';
    for (var i = 0; i < formats.length; i++) {
      var audio = formats[i].audioTrack;
      if (!audio || !audio.id) continue;
      var lang = baseLang(String(audio.id).split('.')[0]);
      if (!byFlag && audio.isAutoDubbed === false) byFlag = lang;
      if (!byName && /original|оригинал/i.test(audio.displayName || '')) byName = lang;
    }
    return byName || byFlag;
  }

  function pickTrack(tracks, renderer, originalLang) {
    if (originalLang) {
      var manualOrig = null, asrOrig = null;
      for (var t = 0; t < tracks.length; t++) {
        if (baseLang(tracks[t].languageCode) !== originalLang) continue;
        if (isAsr(tracks[t])) { if (!asrOrig) asrOrig = tracks[t]; }
        else if (!manualOrig) manualOrig = tracks[t];
      }
      if (manualOrig || asrOrig) return manualOrig || asrOrig;
    }
    var asr = null;
    var asrTracks = tracks.filter(isAsr);
    if (asrTracks.length > 1) {
      // Several auto-generated tracks and unknown original: prefer the browser language
      var prefs = (navigator.languages || [navigator.language || '']).map(baseLang);
      for (var p = 0; p < prefs.length && !asr; p++) {
        for (var q = 0; q < asrTracks.length; q++) {
          if (baseLang(asrTracks[q].languageCode) === prefs[p]) { asr = asrTracks[q]; break; }
        }
      }
    }
    if (!asr) asr = asrTracks[0] || null;
    if (asr) {
      var spoken = baseLang(asr.languageCode);
      for (var j = 0; j < tracks.length; j++) {
        if (tracks[j].kind !== 'asr' && baseLang(tracks[j].languageCode) === spoken) return tracks[j];
      }
      return asr;
    }
    // No auto-generated track: use the track YouTube itself shows by default
    var audio = renderer && renderer.audioTracks && renderer.audioTracks[renderer.defaultAudioTrackIndex || 0];
    if (audio && typeof audio.defaultCaptionTrackIndex === 'number' && tracks[audio.defaultCaptionTrackIndex]) {
      return tracks[audio.defaultCaptionTrackIndex];
    }
    return tracks[0];
  }

  function isAsr(track) {
    return track.kind === 'asr' || /^a\./.test(track.vssId || '');
  }

  function listTracks(tracks) {
    return tracks.map(describeTrack).join(', ');
  }

  function baseLang(code) {
    return String(code || '').toLowerCase().split('-')[0];
  }

  function describeTrack(track) {
    return (track.languageCode || '?') + (isAsr(track) ? ' (auto)' : '');
  }

  // Drops format and auto-translation parameters from a caption track URL.
  function cleanTrackUrl(url) {
    return url.replace(/&(fmt|tlang)=[^&]*/g, '');
  }

  // Parses YouTube timedtext XML (<text> in format 1, <p> in format 3).
  function xmlToText(xml) {
    if (!xml) return '';
    var doc = new DOMParser().parseFromString(xml, 'text/xml');
    var nodes = doc.querySelectorAll('text, p');
    var lines = [];
    for (var i = 0; i < nodes.length; i++) {
      // Entities can be double-encoded (&amp;#39;), decode once more via HTML parsing
      var raw = nodes[i].textContent || '';
      var decoded = new DOMParser().parseFromString(raw, 'text/html').documentElement.textContent || '';
      var line = decoded.replace(/\s+/g, ' ').trim();
      if (line) lines.push(line);
    }
    return lines.join('\n');
  }

  function readYtcfg() {
    var html = document.documentElement.innerHTML;
    var keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    var versionMatch = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/);
    var sessionMatch = html.match(/"SESSION_INDEX":"?(\d+)/);
    var context = null;
    var at = html.indexOf('"INNERTUBE_CONTEXT":');
    if (at !== -1) {
      var start = html.indexOf('{', at);
      var end = findJsonEnd(html, start);
      if (end !== -1) {
        try { context = JSON.parse(html.slice(start, end + 1)); } catch (_) {}
      }
    }
    return {
      apiKey: keyMatch ? keyMatch[1] : '',
      clientVersion: versionMatch ? versionMatch[1] : '',
      sessionIndex: sessionMatch ? sessionMatch[1] : '',
      context: context
    };
  }

  // Reads a JSON object assigned in an inline <script> of the initially loaded page.
  function readInlineJson(name) {
    var scripts = document.querySelectorAll('script');
    var marker = name + ' = ';
    for (var i = 0; i < scripts.length; i++) {
      var text = scripts[i].textContent || '';
      var at = text.indexOf(marker);
      if (at === -1) continue;
      var start = text.indexOf('{', at);
      if (start === -1) continue;
      var end = findJsonEnd(text, start);
      if (end === -1) continue;
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (_) {}
    }
    return null;
  }

  function findJsonEnd(text, start) {
    var depth = 0, inString = false, escaped = false;
    for (var i = start; i < text.length; i++) {
      var ch = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
      } else if (ch === '"') inString = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  function findValue(root, pick) {
    var found = null;
    collect(root, function (node) {
      if (found) return;
      var v = pick(node);
      if (v) found = v;
    });
    return found;
  }

  function collect(root, visit) {
    var stack = [root];
    while (stack.length) {
      var node = stack.pop();
      if (!node || typeof node !== 'object') continue;
      visit(node);
      // Push children in reverse so they are visited in document order.
      var keys = Object.keys(node);
      for (var i = keys.length - 1; i >= 0; i--) {
        var child = node[keys[i]];
        if (child && typeof child === 'object') stack.push(child);
      }
    }
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
