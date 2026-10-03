// "Copy for AI" prompt templates editor (stored in chrome.storage.sync as cpdownPromptTemplates).
(function () {
  var STORAGE_KEY = 'cpdownPromptTemplates';
  var DEFAULT_PROMPT_TEMPLATES = [
    { name: 'Краткий конспект', text: 'Сделай краткий конспект этого видео по пунктам.' },
    { name: '5 главных мыслей', text: 'Выдели 5 главных мыслей из этого видео и кратко поясни каждую.' },
    { name: 'План статьи', text: 'Составь подробный план статьи по материалам этого видео.' },
    { name: 'Перевод на русский', text: 'Переведи этот текст на русский язык, сохранив смысл и структуру.' }
  ];

  var style = document.createElement('style');
  style.textContent =
    '#cpdown-prompts{max-width:640px;margin:24px auto 48px;padding:0 16px;font:14px/1.5 system-ui,-apple-system,sans-serif;color:#171717}' +
    'body.dark #cpdown-prompts{color:#ededed}' +
    '#cpdown-prompts h2{font-size:16px;margin:0 0 4px}' +
    '#cpdown-prompts p{margin:0 0 12px;opacity:.7;font-size:13px}' +
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
      '<p>The prompt is added above the transcript when you press “Copy for AI” in the YouTube subtitles toast.</p>' +
      '<div class="list"></div>' +
      '<div class="actions">' +
      '<button type="button" class="add">+ Add template</button>' +
      '<button type="button" class="primary save">Save</button>' +
      '<button type="button" class="reset">Reset to defaults</button>' +
      '<span class="status"></span>' +
      '</div>';
    document.body.appendChild(section);

    var list = section.querySelector('.list');
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

    chrome.storage.sync.get(STORAGE_KEY, function (data) {
      var saved = data && data[STORAGE_KEY];
      render(Array.isArray(saved) && saved.length ? saved : DEFAULT_PROMPT_TEMPLATES);
    });
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
