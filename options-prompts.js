// "Copy for AI" prompt templates editor (stored in chrome.storage.sync as cpdownPromptTemplates).
(function () {
  var STORAGE_KEY = 'cpdownPromptTemplates';
  var DEFAULT_PROMPT_TEMPLATES = [
    { name: 'Краткий конспект', text: 'Сделай краткий конспект этого материала по пунктам.' },
    { name: '5 главных мыслей', text: 'Выдели 5 главных мыслей из этого материала и кратко поясни каждую.' },
    { name: 'Статья на русском', text: 'Преобразуй этот транскрипт в связную статью на русском языке. Сохрани все факты без исключения: цифры, даты, имена, названия, примеры, аргументы и выводы. Ничего не сокращай и не обобщай до потери деталей, ничего не добавляй от себя. Убери только слова-паразиты, повторы и оговорки. Раздели текст на логичные разделы с подзаголовками.' },
    { name: 'Перевод на русский', text: 'Переведи этот текст на русский язык, сохранив смысл и структуру.' }
  ];

  var AI_SITES = [
    { id: 'chatgpt', name: 'ChatGPT' },
    { id: 'claude', name: 'Claude' },
    { id: 'qwen', name: 'Qwen' },
    { id: 'deepseek', name: 'DeepSeek' }
  ];

  var style = document.createElement('style');
  style.textContent =
    '#cpdown-cleanup{max-width:640px;margin:0 auto 48px;padding:0 16px;font:14px/1.5 system-ui,-apple-system,sans-serif;color:#171717}body.dark #cpdown-cleanup{color:#ededed}' +
    '#cpdown-cleanup h2{font-size:16px;margin:0 0 4px}#cpdown-cleanup p{margin:0 0 12px;opacity:.7;font-size:13px}' +
    '#cpdown-cleanup textarea{width:100%;box-sizing:border-box;min-height:180px;font:inherit;font-size:13px;padding:6px 8px;border:1px solid #d4d4d4;border-radius:6px;background:transparent;color:inherit;margin:8px 0}' +
    'body.dark #cpdown-cleanup textarea{border-color:#444}' +
    '#cpdown-cleanup button{font:inherit;font-size:13px;padding:6px 12px;border-radius:6px;border:1px solid #d4d4d4;background:transparent;color:inherit;cursor:pointer}' +
    'body.dark #cpdown-cleanup button{border-color:#444}' +
    '#cpdown-cleanup button.primary{background:#171717;color:#fff;border-color:#171717}' +
    'body.dark #cpdown-cleanup button.primary{background:#ededed;color:#171717;border-color:#ededed}' +
    '#cpdown-cleanup .actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#cpdown-cleanup .status{font-size:13px;opacity:.7}' +
    '#cpdown-prompts{max-width:640px;margin:24px auto 32px;padding:0 16px;font:14px/1.5 system-ui,-apple-system,sans-serif;color:#171717}' +
    'body.dark #cpdown-prompts{color:#ededed}' +
    '#cpdown-prompts h2{font-size:16px;margin:0 0 4px}' +
    '#cpdown-prompts .sites{margin:0 0 12px;font-size:13px}#cpdown-prompts p{margin:0 0 12px;opacity:.7;font-size:13px}' +
    '#cpdown-prompts .row{border:1px solid #e5e5e5;border-radius:8px;padding:10px;margin-bottom:10px}' +
    'body.dark #cpdown-prompts .row{border-color:#333}' +
    '#cpdown-prompts input,#cpdown-prompts textarea{width:100%;box-sizing:border-box;font:inherit;padding:6px 8px;border:1px solid #d4d4d4;border-radius:6px;background:transparent;color:inherit}' +
    'body.dark #cpdown-prompts input,body.dark #cpdown-prompts textarea{border-color:#444}' +
    '#cpdown-prompts textarea{min-height:60px;resize:vertical;margin-top:6px}' +
    '#cpdown-prompts button{font:inherit;font-size:13px;padding:6px 12px;border-radius:6px;border:1px solid #d4d4d4;background:transparent;color:inherit;cursor:pointer}' +
    'body.dark #cpdown-prompts button{border-color:#444}' +
    '#cpdown-prompts button.primary{background:#171717;color:#fff;border-color:#171717}' +
    'body.dark #cpdown-prompts button.primary{background:#ededed;color:#171717;border-color:#ededed}' +
    '#cpdown-prompts .actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
    '#cpdown-prompts .row .actions{justify-content:flex-end;margin-top:6px}' +
    '#cpdown-prompts .status{font-size:13px;opacity:.7}';
  document.head.appendChild(style);

  function init() {
    var section = document.createElement('section');
    section.id = 'cpdown-prompts';
    section.innerHTML =
      '<h2>Copy for AI — prompt templates</h2>' +
      '<p>The prompt is added above the transcript when you press “Copy for AI” in the YouTube subtitles toast. Site buttons copy the text and open the chat — paste it with Ctrl+V.</p>' +
      '<div class="sites"><b>Open in:</b> </div>' +
      '<div class="list"></div>' +
      '<div class="actions">' +
      '<button type="button" class="add">+ Add template</button>' +
      '<button type="button" class="primary save">Save</button>' +
      '<button type="button" class="reset">Reset to defaults</button>' +
      '<span class="status"></span>' +
      '</div>';
    document.body.appendChild(section);

    var list = section.querySelector('.list');
    var sitesBox = section.querySelector('.sites');
    AI_SITES.forEach(function (site) {
      var label = document.createElement('label');
      label.style.cssText = 'margin-right:12px;white-space:nowrap;';
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.value = site.id;
      box.style.cssText = 'width:auto;margin-right:4px;vertical-align:middle;';
      box.onchange = saveSites;
      label.appendChild(box);
      label.appendChild(document.createTextNode(site.name));
      sitesBox.appendChild(label);
    });

    function saveSites() {
      var ids = [];
      sitesBox.querySelectorAll('input').forEach(function (box) { if (box.checked) ids.push(box.value); });
      chrome.storage.sync.set({ cpdownAiSites: ids }, function () { flash('Saved'); });
    }
    var status = section.querySelector('.status');

    function addRow(template) {
      var row = document.createElement('div');
      row.className = 'row';
      var name = document.createElement('input');
      name.placeholder = 'Name, e.g. Short summary';
      name.value = template.name || '';
      var text = document.createElement('textarea');
      text.placeholder = 'Prompt text';
      text.value = template.text || '';
      var actions = document.createElement('div');
      actions.className = 'actions';
      var del = document.createElement('button');
      del.type = 'button';
      del.textContent = 'Delete';
      del.onclick = function () { row.remove(); };
      actions.appendChild(del);
      row.appendChild(name);
      row.appendChild(text);
      row.appendChild(actions);
      list.appendChild(row);
    }

    function render(templates) {
      list.innerHTML = '';
      templates.forEach(addRow);
    }

    function flash(message) {
      status.textContent = message;
      setTimeout(function () { status.textContent = ''; }, 2000);
    }

    section.querySelector('.add').onclick = function () {
      addRow({ name: '', text: '' });
    };

    section.querySelector('.save').onclick = function () {
      var templates = [];
      list.querySelectorAll('.row').forEach(function (row) {
        var name = row.querySelector('input').value.trim();
        var text = row.querySelector('textarea').value.trim();
        if (name || text) templates.push({ name: name || text.slice(0, 40), text: text });
      });
      chrome.storage.sync.set({ cpdownPromptTemplates: templates }, function () {
        if (chrome.runtime.lastError) {
          flash('Error: ' + chrome.runtime.lastError.message);
          return;
        }
        render(templates.length ? templates : DEFAULT_PROMPT_TEMPLATES);
        flash(templates.length ? 'Saved' : 'Saved (empty list — defaults will be used)');
      });
    };

    section.querySelector('.reset').onclick = function () {
      chrome.storage.sync.remove(STORAGE_KEY, function () {
        render(DEFAULT_PROMPT_TEMPLATES);
        flash('Defaults restored');
      });
    };

    chrome.storage.sync.get('cpdownAiSites', function (data) {
      var ids = Array.isArray(data && data.cpdownAiSites) ? data.cpdownAiSites : AI_SITES.map(function (s) { return s.id; });
      sitesBox.querySelectorAll('input').forEach(function (box) { box.checked = ids.indexOf(box.value) !== -1; });
    });

    chrome.storage.sync.get(STORAGE_KEY, function (data) {
      var saved = data && data[STORAGE_KEY];
      render(Array.isArray(saved) && saved.length ? saved : DEFAULT_PROMPT_TEMPLATES);
    });
  }

  // Junk cleanup settings for regular pages (keys cpdownCleanupEnabled, cpdownCleanupPhrases).
  var DEFAULT_CLEANUP_PHRASES = [
    'подпишитесь', 'подписывайтесь', 'подписаться на', 'читайте также', 'читать также',
    'смотрите также', 'поделиться', 'поделитесь', 'оставьте комментарий', 'комментарии',
    'мы используем cookie', 'мы используем файлы cookie', 'принять cookie', 'реклама',
    'вам также может понравиться', 'похожие статьи', 'похожие материалы',
    'subscribe', 'sign up for', 'newsletter', 'read also', 'read more', 'related articles',
    'related posts', 'you may also like', 'share this', 'share on', 'leave a comment',
    'comments', 'we use cookies', 'accept cookies', 'advertisement', 'sponsored'
  ];

  function initCleanup() {
    var section = document.createElement('section');
    section.id = 'cpdown-cleanup';
    section.className = 'cpdown-extra';
    section.innerHTML =
      '<h2>Junk cleanup</h2>' +
      '<p>Removes short lines that start with one of these phrases (one per line) and lines made only of share links. Applies to regular pages copied with the toolbar button.</p>' +
      '<label class="toggle"><input type="checkbox" class="enabled"> Enabled</label>' +
      '<textarea class="phrases"></textarea>' +
      '<div class="actions">' +
      '<button type="button" class="primary save">Save</button>' +
      '<button type="button" class="reset">Reset to defaults</button>' +
      '<span class="status"></span>' +
      '</div>';
    document.body.appendChild(section);

    var enabled = section.querySelector('.enabled');
    var phrases = section.querySelector('.phrases');
    var status = section.querySelector('.status');

    function flash(message) {
      status.textContent = message;
      setTimeout(function () { status.textContent = ''; }, 2000);
    }

    chrome.storage.sync.get(['cpdownCleanupEnabled', 'cpdownCleanupPhrases'], function (data) {
      enabled.checked = !(data && data.cpdownCleanupEnabled === false);
      var list = data && Array.isArray(data.cpdownCleanupPhrases) ? data.cpdownCleanupPhrases : DEFAULT_CLEANUP_PHRASES;
      phrases.value = list.join('\n');
    });

    enabled.onchange = function () {
      chrome.storage.sync.set({ cpdownCleanupEnabled: enabled.checked }, function () { flash('Saved'); });
    };

    section.querySelector('.save').onclick = function () {
      var list = phrases.value.split('\n').map(function (p) { return p.trim(); }).filter(Boolean);
      chrome.storage.sync.set({ cpdownCleanupPhrases: list }, function () {
        flash(chrome.runtime.lastError ? 'Error: ' + chrome.runtime.lastError.message : 'Saved');
      });
    };

    section.querySelector('.reset').onclick = function () {
      chrome.storage.sync.remove('cpdownCleanupPhrases', function () {
        phrases.value = DEFAULT_CLEANUP_PHRASES.join('\n');
        flash('Defaults restored');
      });
    };
  }

  function start() {
    init();
    initCleanup();
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
