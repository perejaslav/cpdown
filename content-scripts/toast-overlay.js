(function () {
  if (window.__cpdownToastInjected) return;
  window.__cpdownToastInjected = true;

  function showOverlay(payload) {
    var markdown = payload.markdown;
    var title = payload.title || 'YouTube Video';
    var tokenCount = payload.tokenCount || Math.ceil((markdown || '').length / 4);

    // Remove previous cpdown toast if any
    var old = document.querySelector('[data-sonner-toast][data-cpdown="transcript"]');
    if (old) old.remove();

    // ---------- build toaster root (separate from React-controlled Sonner) ----------
    var root = document.getElementById('cpdown-toast-root');
    if (!root) {
      root = document.createElement('ol');
      root.id = 'cpdown-toast-root';
      root.setAttribute('data-sonner-toaster', '');
      root.setAttribute('data-sonner-theme', 'light');
      root.setAttribute('data-x-position', 'right');
      root.setAttribute('data-y-position', 'top');
      root.setAttribute('dir', 'ltr');
      root.style.setProperty('--width', '356px');
      root.style.setProperty('--gap', '14px');
      root.style.setProperty('--offset-right', '24px');
      root.style.setProperty('--offset-top', '24px');
      document.body.appendChild(root);
    }

    // ---------- build toast <li> matching Sonner's exact DOM structure ----------
    var toast = document.createElement('li');
    toast.setAttribute('data-sonner-toast', '');
    toast.setAttribute('data-rich-colors', 'true');
    toast.setAttribute('data-type', 'success');
    toast.setAttribute('data-styled', 'true');
    toast.setAttribute('data-mounted', 'true');
    toast.setAttribute('data-promise', 'false');
    toast.setAttribute('data-removed', 'false');
    toast.setAttribute('data-visible', 'true');
    toast.setAttribute('data-y-position', 'top');
    toast.setAttribute('data-x-position', 'right');
    toast.setAttribute('data-index', '0');
    toast.setAttribute('data-front', 'true');
    toast.setAttribute('data-swiping', 'false');
    toast.setAttribute('data-dismissible', 'true');
    toast.setAttribute('data-cpdown', 'transcript');

    // --- icon (success checkmark, Sonner's default SVG) ---
    var icon = document.createElement('div');
    icon.setAttribute('data-icon', '');
    icon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

    // --- content ---
    var content = document.createElement('div');
    content.setAttribute('data-content', '');

    var titleEl = document.createElement('div');
    titleEl.setAttribute('data-title', '');
    titleEl.textContent = 'Transcript ready: ' + title + ' (' + tokenCount.toLocaleString() + ' tokens)';

    content.appendChild(titleEl);

    // --- close button (Sonner data-close-button) ---
    var closeBtn = document.createElement('button');
    closeBtn.setAttribute('data-close-button', '');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.onclick = function () { closeToast(toast); };

    // --- Copy button ---
    var copyBtn = document.createElement('button');
    copyBtn.setAttribute('data-button', '');
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = function () {
      navigator.clipboard.writeText(markdown).then(function () {
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
      }).catch(function () {
        copyBtn.textContent = 'Failed';
        setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
      });
    };

    // --- Save .md button (secondary style via data-cancel) ---
    var saveBtn = document.createElement('button');
    saveBtn.setAttribute('data-button', '');
    saveBtn.setAttribute('data-cancel', '');
    saveBtn.textContent = 'Save .md';
    saveBtn.onclick = function () {
      var safeName = (title || 'transcript')
        .replace(/[/\\?%*:|"<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120) || 'transcript';
      var blob = new Blob([markdown], { type: 'text/markdown' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = safeName + '.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    };

    // --- assemble in Sonner order: icon, content, buttons, close ---
    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(copyBtn);
    toast.appendChild(saveBtn);
    toast.appendChild(closeBtn);
    root.appendChild(toast);

    // Trigger mount animation — set heights Sonner expects
    requestAnimationFrame(function () {
      var h = toast.offsetHeight + 'px';
      toast.style.setProperty('--initial-height', h);
      toast.style.setProperty('--front-toast-height', h);
    });

    // Auto-dismiss after 15 s
    var autoTimer = setTimeout(function () { closeToast(toast); }, 15000);
    toast._autoTimer = autoTimer;
  }

  function closeToast(toast) {
    if (!toast || !toast.parentNode) return;
    clearTimeout(toast._autoTimer);
    toast.setAttribute('data-removed', 'true');
    toast.removeAttribute('data-visible');
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 300);
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === 'SHOW_TRANSCRIPT_TOAST') {
      showOverlay(msg.payload);
    }
  });
})();
