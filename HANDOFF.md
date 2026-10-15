# HANDOFF

## Проект
cpdown — браузерное расширение: страница/субтитры YouTube → Markdown, меню «Copy for AI» с кнопками нейросетей.

## Последнее (v1.13)
- Добавлена кнопка **Gemini** (`https://gemini.google.com/app`).
- Список сайтов: `content-scripts/toast-overlay.js` (AI_SITES: id/name/short/url) и `options-prompts.js` (AI_SITES для галочек). Новый сайт = добавить в оба.
- В manifest.json при релизе менять ОБА поля: `version` и `version_name` (браузер показывает version_name).
- Нюанс: у кого сохранён `cpdownAiSites` в storage — новый сайт появится только после включения галочки в настройках.

## Ветка
`claude/pensive-newton-i7vqwh`
