(function () {
  if (window.__cpdownToastInjected) return;
  window.__cpdownToastInjected = true;

  // The toast lives in a shadow root, so page styles don't leak in and ours don't leak out.
  var TOAST_CSS =
    ':host{all:initial}' +
    '.toast{--bg:#fff;--fg:#111214;--muted:#6b6f78;--line:#e7e8eb;--soft:#f4f5f6;--acc:#111214;--acc-fg:#fff;--ok:#2fa36b;--err:#d33c3c;' +
    'position:fixed;top:24px;right:24px;z-index:2147483647;width:380px;max-width:calc(100vw - 32px);box-sizing:border-box;' +
    'display:flex;flex-direction:column;gap:12px;padding:14px;border-radius:12px;background:var(--bg);color:var(--fg);' +
    'border:1px solid var(--line);box-shadow:0 10px 30px rgba(0,0,0,.14);font:13px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
    'animation:in .25s ease-out;transition:opacity .2s,transform .2s}' +
    '.toast.dark{--bg:#1b1c20;--fg:#f0f1f3;--muted:#989ca6;--line:#2e3036;--soft:#26282d;--acc:#f0f1f3;--acc-fg:#141518;--err:#ff7b7b;box-shadow:0 10px 30px rgba(0,0,0,.5)}' +
    '.toast.out{opacity:0;transform:translateY(-8px)}' +
    '@keyframes in{from{opacity:0;transform:translateY(-8px)}}' +
    '@media (prefers-reduced-motion:reduce){.toast{animation:none;transition:none}}' +
    '.head{display:flex;gap:10px;align-items:flex-start}' +
    '.mark{flex:none;width:22px;height:22px;border-radius:50%;background:var(--ok);color:#fff;display:grid;place-items:center}' +
    '.toast.error .mark{background:var(--err)}' +
    '.text{flex:1;min-width:0}' +
    '.title{font-weight:600;font-size:14px}' +
    '.sub{color:var(--muted);font-size:12.5px;overflow-wrap:anywhere}' +
    '.toast.error .sub{color:var(--fg)}' +
    'button{font:inherit;color:inherit;cursor:pointer;margin:0}' +
    'button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}' +
    '.close{flex:none;width:24px;height:24px;border:0;border-radius:6px;background:none;color:var(--muted);display:grid;place-items:center;padding:0}' +
    '.close:hover{background:var(--soft);color:var(--fg)}' +
    '.btns{display:flex;gap:6px;flex-wrap:wrap}' +
    '.btn{font-size:13px;padding:6px 12px;border-radius:8px;border:1px solid var(--line);background:var(--bg)}' +
    '.btn:hover{background:var(--soft)}' +
    '.btn.primary{background:var(--acc);color:var(--acc-fg);border-color:var(--acc)}' +
    '.btn.primary:hover{opacity:.88}' +
    '.menu{border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:1px}' +
    '.hint{color:var(--muted);font-size:12px;padding:0 4px 4px}' +
    '.item{display:flex;align-items:center;gap:4px;padding:2px 4px;border-radius:6px}' +
    '.item:hover{background:var(--soft)}' +
    '.name{flex:1;min-width:0;text-align:left;border:0;background:none;padding:5px 0;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.site{flex:none;min-width:24px;height:22px;padding:0 5px;border:0;border-radius:6px;color:#fff;font-size:10px;font-weight:700;letter-spacing:.02em}' +
    '.site:hover{filter:brightness(1.12)}' +
    '.foot{color:var(--muted);font-size:11.5px;padding:6px 4px 0}';

  var ICON_OK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var ICON_ERR = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"><line x1="12" y1="6" x2="12" y2="13"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
  var ICON_X = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function isDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  // Shows a short label on a button, then puts the original text back
  function flashLabel(button, label, ms) {
    if (!button._label) button._label = button.textContent;
    button.textContent = label;
    clearTimeout(button._flashTimer);
    button._flashTimer = setTimeout(function () { button.textContent = button._label; }, ms || 2000);
  }

  function showOverlay(payload) {
    var isError = !!payload.error;
    var markdown = payload.markdown;
    var title = payload.title || 'YouTube Video';
    var tokenCount = payload.tokenCount || Math.ceil((markdown || '').length / 4);

    // Remove previous cpdown toast if any
    var old = document.getElementById('cpdown-toast-root');
    if (old) old.remove();

    var host = document.createElement('div');
    host.id = 'cpdown-toast-root';
    var shadow = host.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = TOAST_CSS;
    shadow.appendChild(style);

    var toast = el('div', 'toast' + (isDark() ? ' dark' : '') + (isError ? ' error' : ''));
    toast.setAttribute('role', isError ? 'alert' : 'status');
    toast._host = host;

    // --- head: icon, title, details, close ---
    var head = el('div', 'head');
    var mark = el('span', 'mark');
    mark.innerHTML = isError ? ICON_ERR : ICON_OK;
    var text = el('div', 'text');
    var heading = payload.kind === 'page' ? 'Markdown готов'
      : payload.kind === 'selection' ? 'Выделение готово' : 'Субтитры готовы';
    var details = [title, tokenCount.toLocaleString('ru-RU') + ' токенов'];
    if (payload.removedLines) details.push('убрано строк мусора: ' + payload.removedLines);
    text.appendChild(el('div', 'title', isError ? 'cpdown: ошибка' : heading));
    text.appendChild(el('div', 'sub', isError ? payload.error : details.join(' · ')));
    var closeBtn = el('button', 'close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.innerHTML = ICON_X;
    closeBtn.onclick = function () { closeToast(toast); };
    head.appendChild(mark);
    head.appendChild(text);
    head.appendChild(closeBtn);
    toast.appendChild(head);

    // --- buttons ---
    var btns = el('div', 'btns');
    toast.appendChild(btns);

    if (isError) {
      // "Copy log" puts the error and the step log into the clipboard for a bug report
      var logBtn = el('button', 'btn', 'Скопировать лог');
      logBtn.type = 'button';
      logBtn.onclick = function () {
        var log = 'cpdown error: ' + payload.error + '\n' + (payload.debug || []).join('\n');
        navigator.clipboard.writeText(log).then(function () {
          flashLabel(logBtn, 'Скопировано!');
        }).catch(function () {
          flashLabel(logBtn, 'Не получилось');
        });
      };
      btns.appendChild(logBtn);
    } else {
      var copyBtn = el('button', 'btn', 'Копировать');
      copyBtn.type = 'button';
      copyBtn.onclick = function () {
        navigator.clipboard.writeText(markdown).then(function () {
          flashLabel(copyBtn, 'Скопировано!');
        }).catch(function () {
          flashLabel(copyBtn, 'Не получилось');
        });
      };

      // "Copy for AI": picks a prompt template and copies prompt + markdown
      var aiBtn = el('button', 'btn primary', 'Copy for AI ▾');
      aiBtn.type = 'button';
      aiBtn.setAttribute('aria-expanded', 'false');
      aiBtn.onclick = function () {
        // Keep the toast open while the user is choosing a template
        clearTimeout(toast._autoTimer);
        togglePromptMenu(toast, aiBtn, markdown);
      };

      var saveBtn = el('button', 'btn', 'Сохранить .md');
      saveBtn.type = 'button';
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

      btns.appendChild(copyBtn);
      btns.appendChild(aiBtn);
      btns.appendChild(saveBtn);
    }

    shadow.appendChild(toast);
    document.documentElement.appendChild(host);

    // Hovering keeps the toast open; leaving restarts the timer
    var delay = isError ? 60000 : 15000;
    toast.onmouseenter = function () { clearTimeout(toast._autoTimer); };
    toast.onmouseleave = function () {
      if (toast.querySelector('.menu')) return;
      toast._autoTimer = setTimeout(function () { closeToast(toast); }, delay);
    };
    toast._autoTimer = setTimeout(function () { closeToast(toast); }, delay);

    // "Copy selection for AI" opens the template menu right away
    if (payload.openAiMenu && !isError) {
      setTimeout(function () { aiBtn.click(); }, 50);
    }
  }

  // Default templates; the user edits them on the options page (key cpdownPromptTemplates).
  var DEFAULT_PROMPT_TEMPLATES = [
    { name: 'Краткий конспект', text: 'Сделай краткий конспект этого материала по пунктам.' },
    { name: '5 главных мыслей', text: 'Выдели 5 главных мыслей из этого материала и кратко поясни каждую.' },
    { name: 'Статья на русском', text: 'Преобразуй этот транскрипт в связную статью на русском языке. Сохрани все факты без исключения: цифры, даты, имена, названия, примеры, аргументы и выводы. Ничего не сокращай и не обобщай до потери деталей, ничего не добавляй от себя. Убери только слова-паразиты, повторы и оговорки. Раздели текст на логичные разделы с подзаголовками.' },
    { name: 'Перевод на русский', text: 'Переведи этот текст на русский язык, сохранив смысл и структуру.' }
  ];

  // AI sites for "copy and open"; the user picks which ones are shown (key cpdownAiSites).
  var AI_SITES = [
    { id: 'chatgpt', name: 'ChatGPT', short: 'GPT', color: '#10a37f', url: 'https://chatgpt.com/' },
    { id: 'claude', name: 'Claude', short: 'C', color: '#c96442', url: 'https://claude.ai/new' },
    { id: 'qwen', name: 'Qwen', short: 'Q', color: '#615ced', url: 'https://chat.qwen.ai/' },
    { id: 'deepseek', name: 'DeepSeek', short: 'DS', color: '#4d6bfe', url: 'https://chat.deepseek.com/' },
    { id: 'gemini', name: 'Gemini', short: 'G', color: '#1a73e8', url: 'https://gemini.google.com/app' }
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

  function closePromptMenu(toast) {
    var menu = toast && toast.querySelector('.menu');
    if (menu) menu.remove();
    var aiBtn = toast && toast.querySelector('[aria-expanded]');
    if (aiBtn) aiBtn.setAttribute('aria-expanded', 'false');
  }

  // The menu opens inside the toast, under the buttons
  function togglePromptMenu(toast, anchor, markdown) {
    if (toast.querySelector('.menu')) {
      closePromptMenu(toast);
      return;
    }
    loadPromptTemplates(function (templates, sites) {
      var menu = el('div', 'menu');
      menu.appendChild(el('div', 'hint', sites.length
        ? 'Название копирует, значок копирует и открывает чат'
        : 'Выберите промпт'));

      templates.forEach(function (template) {
        var row = el('div', 'item');
        var item = el('button', 'name', template.name || 'Без названия');
        item.type = 'button';
        item.title = 'Скопировать: ' + (template.text || '');
        item.onclick = function () { copyWithPrompt(template, null); };
        row.appendChild(item);

        sites.forEach(function (site) {
          var siteBtn = el('button', 'site', site.short);
          siteBtn.type = 'button';
          siteBtn.style.background = site.color;
          siteBtn.title = 'Скопировать и открыть ' + site.name;
          siteBtn.setAttribute('aria-label', siteBtn.title);
          siteBtn.onclick = function () { copyWithPrompt(template, site); };
          row.appendChild(siteBtn);
        });
        menu.appendChild(row);
      });

      // Copies prompt + markdown; with a site, also opens it in a new tab (paste with Ctrl+V)
      function copyWithPrompt(template, site) {
        closePromptMenu(toast);
        // Open the tab synchronously inside the click so the popup blocker allows it
        if (site) window.open(site.url, '_blank', 'noopener');
        var text = (template.text ? template.text.trim() + '\n\n' : '') + markdown;
        navigator.clipboard.writeText(text).then(function () {
          flashLabel(anchor, site ? 'Скопировано, вставьте Ctrl+V' : 'Скопировано!', site ? 4000 : 2000);
        }).catch(function () {
          flashLabel(anchor, 'Не получилось');
        });
        clearTimeout(toast._autoTimer);
        toast._autoTimer = setTimeout(function () { closeToast(toast); }, 15000);
      }

      menu.appendChild(el('div', 'foot', 'Шаблоны и чаты меняются в настройках cpdown'));
      toast.appendChild(menu);
      anchor.setAttribute('aria-expanded', 'true');
    });
  }

  function closeToast(toast) {
    if (!toast || !toast._host || !toast._host.parentNode) return;
    clearTimeout(toast._autoTimer);
    toast.classList.add('out');
    setTimeout(function () {
      if (toast._host.parentNode) toast._host.remove();
    }, 220);
  }

  // Junk cleanup for regular pages; settings are edited on the options page.
  var DEFAULT_CLEANUP_PHRASES = [
    'подпишитесь', 'подписывайтесь', 'подписаться на', 'читайте также', 'читать также',
    'смотрите также', 'поделиться', 'поделитесь', 'оставьте комментарий', 'комментарии',
    'мы используем cookie', 'мы используем файлы cookie', 'принять cookie', 'реклама',
    'вам также может понравиться', 'похожие статьи', 'похожие материалы',
    'subscribe', 'sign up for', 'newsletter', 'read also', 'read more', 'related articles',
    'related posts', 'you may also like', 'share this', 'share on', 'leave a comment',
    'comments', 'we use cookies', 'accept cookies', 'advertisement', 'sponsored'
  ];
  var SHARE_WORDS = /^(twitter|x|facebook|vk|вконтакте|telegram|телеграм|whatsapp|linkedin|reddit|одноклассники|ok|email|e-mail|pinterest|threads)$/i;

  // Removes short lines that start with a stop phrase and lines made only of share links.
  function cleanupMarkdown(markdown, phrases) {
    var lowered = phrases.map(function (p) { return p.trim().toLowerCase(); }).filter(Boolean);
    var removed = 0;
    var kept = markdown.split('\n').filter(function (line) {
      var links = line.match(/\[([^\]]*)\]\([^)]*\)/g);
      var rest = line.replace(/\[([^\]]*)\]\([^)]*\)/g, '').replace(/[\s|•·,–—-]/g, '');
      if (links && !rest && links.every(function (l) { return SHARE_WORDS.test(l.replace(/^\[|\]\(.*$/g, '').trim()); })) {
        removed++;
        return false;
      }
      var plain = line.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/^[\s#>*_\-+\d.)]+/, '')
        .replace(/[*_`]/g, '').trim().toLowerCase();
      if (plain && plain.length <= 150 && lowered.some(function (p) { return plain.indexOf(p) === 0; })) {
        removed++;
        return false;
      }
      return true;
    });
    return { markdown: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim(), removed: removed };
  }

  // Used by content.js (toolbar button / Ctrl+Shift+T) and background.js (selection menu)
  window.__cpdownShowOverlay = function (payload) {
    if (payload.kind !== 'page') {
      showOverlay(payload);
      return;
    }
    try {
      chrome.storage.sync.get(['cpdownCleanupEnabled', 'cpdownCleanupPhrases'], function (data) {
        if (data && data.cpdownCleanupEnabled === false) {
          showOverlay(payload);
          return;
        }
        var phrases = data && Array.isArray(data.cpdownCleanupPhrases) ? data.cpdownCleanupPhrases : DEFAULT_CLEANUP_PHRASES;
        var result = cleanupMarkdown(payload.markdown || '', phrases);
        if (result.removed) {
          var ratio = result.markdown.length / Math.max(1, (payload.markdown || '').length);
          payload.tokenCount = Math.round((payload.tokenCount || 0) * ratio);
          payload.markdown = result.markdown;
          payload.removedLines = result.removed;
        }
        showOverlay(payload);
      });
    } catch (e) {
      showOverlay(payload);
    }
  };

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === 'SHOW_TRANSCRIPT_TOAST') {
      showOverlay(msg.payload);
    }
  });
})();
