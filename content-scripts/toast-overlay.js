(function () {
  if (window.__cpdownToastInjected) return;
  window.__cpdownToastInjected = true;

  const STYLE_ID = 'cpdown-toast-style';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #cpdown-toast-overlay {
        all: initial;
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        background: #1a1a2e;
        color: #e0e0e0;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        max-width: 420px;
        border: 1px solid rgba(255,255,255,0.1);
        box-sizing: border-box;
      }
      #cpdown-toast-overlay * {
        all: revert;
        box-sizing: border-box;
      }
      .cpdown-toast-close {
        background: none;
        border: none;
        color: #888;
        font-size: 22px;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
      }
      .cpdown-toast-close:hover { color: #fff; }
      .cpdown-btn {
        flex: 1;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        font-family: inherit;
        transition: background 0.15s, opacity 0.15s;
      }
      .cpdown-btn-copy {
        border: 1px solid #4ade80;
        background: transparent;
        color: #4ade80;
      }
      .cpdown-btn-copy:hover { background: rgba(74,222,128,0.1); }
      .cpdown-btn-save {
        border: 1px solid #60a5fa;
        background: transparent;
        color: #60a5fa;
      }
      .cpdown-btn-save:hover { background: rgba(96,165,250,0.1); }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showOverlay({ markdown, title, videoUrl }) {
    const existing = document.getElementById('cpdown-toast-overlay');
    if (existing) existing.remove();

    injectStyles();

    const overlay = document.createElement('div');
    overlay.id = 'cpdown-toast-overlay';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px';

    const titleBlock = document.createElement('div');
    titleBlock.style.cssText = 'flex:1;min-width:0';

    const statusEl = document.createElement('div');
    statusEl.style.cssText = 'font-weight:600;color:#4ade80;margin-bottom:4px';
    statusEl.textContent = 'Transcript ready!';

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:13px;color:#aaa;word-break:break-word;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    titleEl.textContent = title;

    titleBlock.appendChild(statusEl);
    titleBlock.appendChild(titleEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'cpdown-toast-close';
    closeBtn.textContent = '\u00D7';
    closeBtn.setAttribute('aria-label', 'Close');

    header.appendChild(titleBlock);
    header.appendChild(closeBtn);

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:8px';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'cpdown-btn cpdown-btn-copy';
    copyBtn.textContent = 'Copy';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'cpdown-btn cpdown-btn-save';
    saveBtn.textContent = 'Save .md';

    buttonRow.appendChild(copyBtn);
    buttonRow.appendChild(saveBtn);

    overlay.appendChild(header);
    overlay.appendChild(buttonRow);
    document.body.appendChild(overlay);

    closeBtn.onclick = () => overlay.remove();

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(markdown);
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = 'rgba(74,222,128,0.2)';
        copyBtn.style.borderColor = '#4ade80';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.style.background = 'transparent';
        }, 2000);
      } catch {
        copyBtn.textContent = 'Failed';
        copyBtn.style.borderColor = '#ef4444';
        copyBtn.style.color = '#ef4444';
      }
    };

    saveBtn.onclick = () => {
      const safeName = title.replace(/[/\\?%*:|"<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'transcript';
      const fileName = `${safeName}.md`;
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    };

    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 15000);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SHOW_TRANSCRIPT_TOAST') {
      showOverlay(msg.payload);
    }
  });
})();
