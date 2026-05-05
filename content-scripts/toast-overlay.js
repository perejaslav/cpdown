(function () {
  if (window.__cpdownToastInjected) return;
  window.__cpdownToastInjected = true;

  const STYLE_ID = 'cpdown-toast-style';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    // Exact Sonner light theme + richColors success colors:
    //   --success-bg: hsl(143, 85%, 96%) = #ECFDF3
    //   --success-border: hsl(145, 92%, 87%) = #BFFCD9
    //   --success-text: hsl(140, 100%, 27%) = #008A2E
    style.textContent = `
      #cpdown-toast-overlay {
        all: initial;
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 2147483647;
        background: #ECFDF3;
        border: 1px solid #BFFCD9;
        color: #008A2E;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-family: ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif;
        font-size: 13px;
        line-height: 1.5;
        width: 360px;
        box-sizing: border-box;
      }
      #cpdown-toast-overlay * {
        all: revert;
        box-sizing: border-box;
      }
      #cpdown-toast-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      #cpdown-toast-title {
        font-weight: 500;
        line-height: 1.5;
        color: #008A2E;
        flex: 1;
        min-width: 0;
        font-size: 13px;
      }
      #cpdown-toast-desc {
        font-weight: 400;
        line-height: 1.4;
        color: #008A2E;
        opacity: 0.8;
        margin: 0px 0 10px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
      }
      #cpdown-toast-close {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        color: #1A1A1A;
        background: #fff;
        border: 1px solid #EDEDED;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
        margin-top: -2px;
        margin-right: -4px;
      }
      #cpdown-toast-close:hover {
        background: #F5F5F5;
        border-color: #D4D4D4;
      }
      #cpdown-toast-close svg {
        display: block;
      }
      #cpdown-toast-buttons {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
      }
      .cpdown-toast-btn {
        border-radius: 4px;
        padding: 0 8px;
        height: 24px;
        font-size: 12px;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        border: none;
        outline: 0;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: opacity 0.2s, box-shadow 0.2s;
      }
      .cpdown-toast-btn:focus-visible {
        box-shadow: 0 0 0 2px rgba(0,0,0,0.4);
      }
      .cpdown-toast-btn-primary {
        color: #ECFDF3;
        background: #008A2E;
      }
      .cpdown-toast-btn-primary:hover {
        opacity: 0.85;
      }
      .cpdown-toast-btn-secondary {
        color: #008A2E;
        background: rgba(0,0,0,0.08);
      }
      .cpdown-toast-btn-secondary:hover {
        background: rgba(0,0,0,0.12);
      }
    `;
    document.head.appendChild(style);
  }

  function showOverlay({ markdown, title }) {
    const existing = document.getElementById('cpdown-toast-overlay');
    if (existing) existing.remove();

    injectStyles();

    const overlay = document.createElement('div');
    overlay.id = 'cpdown-toast-overlay';

    const header = document.createElement('div');
    header.id = 'cpdown-toast-header';

    const titleEl = document.createElement('div');
    titleEl.id = 'cpdown-toast-title';
    titleEl.textContent = 'Transcript ready!';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'cpdown-toast-close';
    closeBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.setAttribute('aria-label', 'Close');

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const desc = document.createElement('div');
    desc.id = 'cpdown-toast-desc';
    desc.textContent = title || 'YouTube Video';

    const buttonRow = document.createElement('div');
    buttonRow.id = 'cpdown-toast-buttons';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'cpdown-toast-btn cpdown-toast-btn-primary';
    copyBtn.textContent = 'Copy';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'cpdown-toast-btn cpdown-toast-btn-secondary';
    saveBtn.textContent = 'Save .md';

    buttonRow.appendChild(copyBtn);
    buttonRow.appendChild(saveBtn);

    overlay.appendChild(header);
    overlay.appendChild(desc);
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
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      } catch {
        copyBtn.textContent = 'Failed';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      }
    };

    saveBtn.onclick = () => {
      const safeName = (title || 'transcript')
        .replace(/[/\\?%*:|"<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120) || 'transcript';
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${safeName}.md`;
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
