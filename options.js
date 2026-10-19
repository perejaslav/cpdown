// cpdown options page. Every change is saved to chrome.storage.sync right away.
(function () {
  // Copy settings read by content-scripts/content.js. It reads the Defuddle flag as "useDeffudle"
  // (typo in the bundle), the old options page wrote "useDefuddle", so we keep both in sync.
  var COPY_DEFAULTS = {
    useDeffudle: true,
    useReadability: false,
    wrapInTripleBackticks: true,
    showSuccessToast: true,
    showConfetti: false
  };

  // Keep in sync with content-scripts/toast-overlay.js.
  var DEFAULT_PROMPT_TEMPLATES = [
    { name: 'Краткий конспект', text: 'Сделай краткий конспект этого материала по пунктам.' },
    { name: '5 главных мыслей', text: 'Выдели 5 главных мыслей из этого материала и кратко поясни каждую.' },
    { name: 'Статья на русском', text: 'Преобразуй этот транскрипт в связную статью на русском языке. Сохрани все факты без исключения: цифры, даты, имена, названия, примеры, аргументы и выводы. Ничего не сокращай и не обобщай до потери деталей, ничего не добавляй от себя. Убери только слова-паразиты, повторы и оговорки. Раздели текст на логичные разделы с подзаголовками.' },
    { name: 'Перевод на русский', text: 'Переведи этот текст на русский язык, сохранив смысл и структуру.' }
  ];

  // Keep in sync with AI_SITES in content-scripts/toast-overlay.js.
  var AI_SITES = [
    { id: 'chatgpt', name: 'ChatGPT' },
    { id: 'claude', name: 'Claude' },
    { id: 'qwen', name: 'Qwen' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'gemini', name: 'Gemini' }
  ];

  var DEFAULT_CLEANUP_PHRASES = [
    'подпишитесь', 'подписывайтесь', 'подписаться на', 'читайте также', 'читать также',
    'смотрите также', 'поделиться', 'поделитесь', 'оставьте комментарий', 'комментарии',
    'мы используем cookie', 'мы используем файлы cookie', 'принять cookie', 'реклама',
    'вам также может понравиться', 'похожие статьи', 'похожие материалы',
    'subscribe', 'sign up for', 'newsletter', 'read also', 'read more', 'related articles',
    'related posts', 'you may also like', 'share this', 'share on', 'leave a comment',
    'comments', 'we use cookies', 'accept cookies', 'advertisement', 'sponsored'
  ];

  var $ = function (id) { return document.getElementById(id); };
  var storage = chrome.storage.sync;

  // ---------- "Saved" indicator ----------
  var savedEl = $('saved');
  var savedTimer;
  function save(values) {
    storage.set(values, function () {
      var err = chrome.runtime.lastError;
      savedEl.classList.toggle('error', !!err);
      savedEl.lastChild.textContent = err ? 'Не сохранилось: ' + err.message : 'Сохранено';
      savedEl.classList.add('show');
      clearTimeout(savedTimer);
      savedTimer = setTimeout(function () { savedEl.classList.remove('show'); }, err ? 6000 : 1600);
    });
  }

  // Delays writes while the user types (storage.sync limits writes per minute).
  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  // ---------- header ----------
  var manifest = chrome.runtime.getManifest();
  $('version').textContent = manifest.version_name || manifest.version;

  if (chrome.commands && chrome.commands.getAll) {
    chrome.commands.getAll(function (commands) {
      var cmd = (commands || []).filter(function (c) { return c.name === 'copy-as-markdown'; })[0];
      if (cmd) $('shortcut').textContent = cmd.shortcut || 'не назначена';
    });
  }
  $('shortcut-edit').onclick = function () {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  };

  // ---------- copy settings ----------
  var copyBoxes = {
    useDeffudle: $('opt-defuddle'),
    useReadability: $('opt-readability'),
    wrapInTripleBackticks: $('opt-backticks'),
    showSuccessToast: $('opt-toast'),
    showConfetti: $('opt-confetti')
  };

  storage.get(Object.keys(COPY_DEFAULTS).concat('useDefuddle'), function (data) {
    var values = Object.assign({}, COPY_DEFAULTS, data);
    if (data.useDeffudle === undefined && typeof data.useDefuddle === 'boolean') values.useDeffudle = data.useDefuddle;
    Object.keys(copyBoxes).forEach(function (key) { copyBoxes[key].checked = !!values[key]; });
  });

  Object.keys(copyBoxes).forEach(function (key) {
    copyBoxes[key].onchange = function () {
      var change = {};
      change[key] = copyBoxes[key].checked;
      // Defuddle and Readability are alternatives: turning one on turns the other off
      if (key === 'useReadability' && change[key]) { copyBoxes.useDeffudle.checked = false; change.useDeffudle = false; }
      if (key === 'useDeffudle' && change[key]) { copyBoxes.useReadability.checked = false; change.useReadability = false; }
      if ('useDeffudle' in change) change.useDefuddle = change.useDeffudle;
      save(change);
    };
  });

  // ---------- junk cleanup ----------
  var cleanupBox = $('cleanup-enabled');
  var phrasesBox = $('cleanup-phrases');

  storage.get(['cpdownCleanupEnabled', 'cpdownCleanupPhrases'], function (data) {
    cleanupBox.checked = data.cpdownCleanupEnabled !== false;
    var list = Array.isArray(data.cpdownCleanupPhrases) ? data.cpdownCleanupPhrases : DEFAULT_CLEANUP_PHRASES;
    phrasesBox.value = list.join('\n');
  });

  cleanupBox.onchange = function () { save({ cpdownCleanupEnabled: cleanupBox.checked }); };
  phrasesBox.oninput = debounce(function () {
    var list = phrasesBox.value.split('\n').map(function (p) { return p.trim(); }).filter(Boolean);
    save({ cpdownCleanupPhrases: list });
  }, 700);
  $('cleanup-reset').onclick = function () {
    phrasesBox.value = DEFAULT_CLEANUP_PHRASES.join('\n');
    storage.remove('cpdownCleanupPhrases', function () { save({}); });
  };

  // ---------- AI sites ----------
  var sitesBox = $('sites');
  AI_SITES.forEach(function (site) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = site.name;
    chip.dataset.id = site.id;
    chip.setAttribute('aria-pressed', 'true');
    chip.onclick = function () {
      chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      var ids = [];
      sitesBox.querySelectorAll('.chip[aria-pressed="true"]').forEach(function (c) { ids.push(c.dataset.id); });
      save({ cpdownAiSites: ids });
    };
    sitesBox.appendChild(chip);
  });
  storage.get('cpdownAiSites', function (data) {
    var ids = Array.isArray(data.cpdownAiSites) ? data.cpdownAiSites : AI_SITES.map(function (s) { return s.id; });
    sitesBox.querySelectorAll('.chip').forEach(function (chip) {
      chip.setAttribute('aria-pressed', ids.indexOf(chip.dataset.id) !== -1 ? 'true' : 'false');
    });
  });

  // ---------- prompt templates ----------
  var list = $('templates');
  var rowTemplate = $('tpl-row');
  var addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'add';
  addBtn.textContent = '+ Новый шаблон';
  addBtn.onclick = function () {
    var row = addRow({ name: '', text: '' });
    toggleRow(row, true);
    row.querySelector('.tpl-name').focus();
  };

  function collectTemplates() {
    var templates = [];
    list.querySelectorAll('.tpl').forEach(function (row) {
      var name = row.querySelector('.tpl-name').value.trim();
      var text = row.querySelector('.tpl-text').value.trim();
      if (name || text) templates.push({ name: name || text.slice(0, 40), text: text });
    });
    return templates;
  }
  var saveTemplates = function () { save({ cpdownPromptTemplates: collectTemplates() }); };
  var saveTemplatesSoon = debounce(saveTemplates, 700);

  function refreshSummary(row) {
    var name = row.querySelector('.tpl-name').value.trim();
    var text = row.querySelector('.tpl-text').value.trim();
    row.querySelector('.tpl-open b').textContent = name || (text ? text.slice(0, 40) : 'Новый шаблон');
    row.querySelector('.tpl-open span').textContent = text || 'Пустой промпт';
  }

  function toggleRow(row, open) {
    row.classList.toggle('open', open);
    row.querySelector('.tpl-edit').hidden = !open;
    row.querySelector('.tpl-open').setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function addRow(template) {
    var row = rowTemplate.content.firstElementChild.cloneNode(true);
    var nameInput = row.querySelector('.tpl-name');
    var textInput = row.querySelector('.tpl-text');
    nameInput.value = template.name || '';
    textInput.value = template.text || '';
    refreshSummary(row);

    row.querySelector('.tpl-open').onclick = function () { toggleRow(row, !row.classList.contains('open')); };
    nameInput.oninput = textInput.oninput = function () { refreshSummary(row); saveTemplatesSoon(); };
    row.querySelector('.del').onclick = function () { row.remove(); saveTemplates(); };
    enableDrag(row);

    list.insertBefore(row, addBtn);
    return row;
  }

  function render(templates) {
    list.querySelectorAll('.tpl').forEach(function (row) { row.remove(); });
    templates.forEach(addRow);
  }

  // Drag by the grip to reorder
  var dragged = null;
  function enableDrag(row) {
    var grip = row.querySelector('.grip');
    grip.onmousedown = function () { row.draggable = true; };
    row.ondragstart = function (event) {
      dragged = row;
      row.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
    };
    row.ondragend = function () {
      row.draggable = false;
      row.classList.remove('dragging');
      list.querySelectorAll('.over').forEach(function (r) { r.classList.remove('over'); });
      dragged = null;
      saveTemplates();
    };
    row.ondragover = function (event) {
      if (!dragged || dragged === row) return;
      event.preventDefault();
      list.querySelectorAll('.over').forEach(function (r) { r.classList.remove('over'); });
      row.classList.add('over');
    };
    row.ondrop = function (event) {
      if (!dragged || dragged === row) return;
      event.preventDefault();
      row.classList.remove('over');
      list.insertBefore(dragged, row);
    };
  }

  // Dropping on "+ New template" moves the row to the end
  addBtn.ondragover = function (event) { if (dragged) event.preventDefault(); };
  addBtn.ondrop = function (event) {
    if (!dragged) return;
    event.preventDefault();
    list.insertBefore(dragged, addBtn);
  };

  list.appendChild(addBtn);
  storage.get('cpdownPromptTemplates', function (data) {
    var saved = data.cpdownPromptTemplates;
    render(Array.isArray(saved) && saved.length ? saved : DEFAULT_PROMPT_TEMPLATES);
  });

  $('templates-reset').onclick = function () {
    render(DEFAULT_PROMPT_TEMPLATES);
    storage.remove('cpdownPromptTemplates', function () { save({}); });
  };
})();
