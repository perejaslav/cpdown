(function () {
  if (window.__cpdownToastInjected) return;
  window.__cpdownToastInjected = true;

  function showOverlay(payload) {
    var isError = !!payload.error;
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
      root.setAttribute('data-sonner-theme',
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
    toast.setAttribute('data-type', isError ? 'error' : 'success');
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
    titleEl.textContent = isError
      ? 'cpdown: ' + payload.error
      : 'Transcript ready: ' + title + ' (' + tokenCount.toLocaleString() + ' tokens)';
    if (isError) {
      icon.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    }

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

    // --- "Copy for AI" button: picks a prompt template and copies prompt + markdown ---
    var aiBtn = document.createElement('button');
    aiBtn.setAttribute('data-button', '');
    aiBtn.textContent = 'Copy for AI';
    aiBtn.onclick = function (event) {
      event.stopPropagation();
      // Keep the toast open while the user is choosing a template
      clearTimeout(toast._autoTimer);
      togglePromptMenu(toast, aiBtn, markdown);
    };

    // --- assemble in Sonner order: icon, content, buttons, close ---
    toast.appendChild(icon);
    toast.appendChild(content);
    if (isError) {
      // "Copy log" puts the error and the step log into the clipboard for a bug report
      copyBtn.textContent = 'Copy log';
      copyBtn.onclick = function () {
        var log = 'cpdown error: ' + payload.error + '\n' + (payload.debug || []).join('\n');
        navigator.clipboard.writeText(log).then(function () {
          copyBtn.textContent = 'Copied!';
        }).catch(function () {
          copyBtn.textContent = 'Failed';
        });
      };
      toast.appendChild(copyBtn);
    } else {
      toast.appendChild(copyBtn);
      toast.appendChild(aiBtn);
      toast.appendChild(saveBtn);
    }
    toast.appendChild(closeBtn);
    root.appendChild(toast);

    // Trigger mount animation — set heights Sonner expects
    requestAnimationFrame(function () {
      var h = toast.offsetHeight + 'px';
      toast.style.setProperty('--initial-height', h);
      toast.style.setProperty('--front-toast-height', h);
    });

    // Auto-dismiss after 15 s
    var autoTimer = setTimeout(function () { closeToast(toast); }, isError ? 60000 : 15000);
    toast._autoTimer = autoTimer;
  }

  // Default templates; the user edits them on the options page (key cpdownPromptTemplates).
  var DEFAULT_PROMPT_TEMPLATES = [
    { name: 'Краткий конспект', text: 'Сделай краткий конспект этого видео по пунктам.' },
    { name: '5 главных мыслей', text: 'Выдели 5 главных мыслей из этого видео и кратко поясни каждую.' },
    { name: 'Статья на русском', text: 'Преобразуй этот транскрипт в связную статью на русском языке. Сохрани все факты без исключения: цифры, даты, имена, названия, примеры, аргументы и выводы. Ничего не сокращай и не обобщай до потери деталей, ничего не добавляй от себя. Убери только слова-паразиты, повторы и оговорки. Раздели текст на логичные разделы с подзаголовками.' },
    { name: 'Перевод на русский', text: 'Переведи этот текст на русский язык, сохранив смысл и структуру.' }
  ];

  // AI sites for "copy and open"; the user picks which ones are shown (key cpdownAiSites).
  var AI_SITES = [
    { id: 'chatgpt', name: 'ChatGPT', short: 'GPT', url: 'https://chatgpt.com/' },
    { id: 'claude', name: 'Claude', short: 'Claude', url: 'https://claude.ai/new' },
    { id: 'qwen', name: 'Qwen', short: 'Qwen', url: 'https://chat.qwen.ai/' },
    { id: 'deepseek', name: 'DeepSeek', short: 'DS', url: 'https://chat.deepseek.com/' }
  ];

  function loadPromptTemplates(callback) {
    var allIds = AI_SITES.map(function (site) { return site.id; });
    try {
      chrome.storage.sync.get(['cpdownPromptTemplates', 'cpdownAiSites'], function (data) {
        var list = data && data.cpdownPromptTemplates;
        var ids = data && Array.isArray(data.cpdownAiSites) ? data.cpdownAiSites : allIds;
        callback(
          Array.isArray(list) && list.length ? list : DEFAULT_PROMPT_TEMPLATES,
          AI_SITES.filter(function (site) { return ids.indexOf(site.id) !== -1; })
        );
      });
    } catch (e) {
      callback(DEFAULT_PROMPT_TEMPLATES, AI_SITES);
    }
  }

  function closePromptMenu() {
    var menu = document.getElementById('cpdown-prompt-menu');
    if (menu) menu.remove();
    document.removeEventListener('click', closePromptMenu);
  }

  function togglePromptMenu(toast, anchor, markdown) {
    if (document.getElementById('cpdown-prompt-menu')) {
      closePromptMenu();
      return;
    }
    loadPromptTemplates(function (templates, sites) {
      var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var menu = document.createElement('div');
      menu.id = 'cpdown-prompt-menu';
      var rect = anchor.getBoundingClientRect();
      menu.style.cssText =
        'position:fixed;z-index:2147483647;min-width:240px;max-width:420px;padding:4px;' +
        'border-radius:8px;font:13px/1.4 system-ui,-apple-system,sans-serif;' +
        'box-shadow:0 4px 16px rgba(0,0,0,.25);' +
        'top:' + Math.round(rect.bottom + 6) + 'px;' +
        'right:' + Math.max(8, Math.round(window.innerWidth - rect.right)) + 'px;' +
        (dark ? 'background:#1f1f1f;color:#ededed;border:1px solid #333;'
              : 'background:#fff;color:#171717;border:1px solid #e5e5e5;');

      var hint = document.createElement('div');
      hint.textContent = sites.length ? 'Choose a prompt (name = copy, button = copy and open):' : 'Choose a prompt:';
      hint.style.cssText = 'padding:4px 8px;opacity:.6;font-size:12px;';
      menu.appendChild(hint);

      templates.forEach(function (template) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:2px;border-radius:6px;';
        row.onmouseenter = function () { row.style.background = dark ? '#2e2e2e' : '#f2f2f2'; };
        row.onmouseleave = function () { row.style.background = 'transparent'; };

        var item = document.createElement('button');
        item.textContent = template.name || 'Untitled';
        item.title = 'Copy: ' + (template.text || '');
        item.style.cssText =
          'flex:1;min-width:0;text-align:left;padding:6px 8px;border:0;border-radius:6px;' +
          'background:transparent;color:inherit;font:inherit;cursor:pointer;' +
          'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        item.onclick = function (event) {
          event.stopPropagation();
          copyWithPrompt(template, null);
        };
        row.appendChild(item);

        sites.forEach(function (site) {
          var siteBtn = document.createElement('button');
          siteBtn.textContent = site.short;
          siteBtn.title = 'Copy and open ' + site.name;
          siteBtn.style.cssText =
            'flex:none;padding:3px 6px;border-radius:4px;font:inherit;font-size:11px;cursor:pointer;' +
            'background:transparent;color:inherit;border:1px solid ' + (dark ? '#444' : '#d4d4d4') + ';';
          siteBtn.onclick = function (event) {
            event.stopPropagation();
            copyWithPrompt(template, site);
          };
          row.appendChild(siteBtn);
        });
        menu.appendChild(row);
      });

      // Copies prompt + markdown; with a site, also opens it in a new tab (paste with Ctrl+V)
      function copyWithPrompt(template, site) {
        closePromptMenu();
        // Open the tab synchronously inside the click so the popup blocker allows it
        if (site) window.open(site.url, '_blank', 'noopener');
        var text = (template.text ? template.text.trim() + '\n\n' : '') + markdown;
        navigator.clipboard.writeText(text).then(function () {
          anchor.textContent = site ? 'Copied, paste with Ctrl+V' : 'Copied!';
        }).catch(function () {
          anchor.textContent = 'Failed';
        });
        setTimeout(function () { anchor.textContent = 'Copy for AI'; }, site ? 4000 : 2000);
        toast._autoTimer = setTimeout(function () { closeToast(toast); }, 15000);
      }

      var edit = document.createElement('div');
      edit.textContent = 'Edit templates in cpdown options';
      edit.style.cssText = 'padding:6px 8px 4px;opacity:.6;font-size:11px;border-top:1px solid ' +
        (dark ? '#333' : '#eee') + ';margin-top:4px;';
      menu.appendChild(edit);

      menu.onclick = function (event) { event.stopPropagation(); };
      document.body.appendChild(menu);
      setTimeout(function () { document.addEventListener('click', closePromptMenu); }, 0);
    });
  }

  function closeToast(toast) {
    closePromptMenu();
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
