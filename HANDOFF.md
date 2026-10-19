# HANDOFF

## Проект
cpdown — браузерное расширение: страница/субтитры YouTube → Markdown, меню «Copy for AI» с кнопками нейросетей.

## Последнее (v1.14) — новый дизайн «Чистый»
- Страница настроек переписана без React: `options.html` + `options.css` + `options.js`. Всё сохраняется само (без кнопок Save), подписи по-русски, версия берётся из manifest.
- Старые файлы настроек удалены: `chunks/`, `assets/`, `options-prompts.js`, `options-theme.js`.
- Всплывашка (`content-scripts/toast-overlay.js`) теперь своя, в Shadow DOM, больше не зависит от CSS Sonner из content.js. Меню «Copy for AI» открывается внутри всплывашки.
- Баг-фикс: content.js читает флаг Defuddle как `useDeffudle` (опечатка в бандле), старые настройки писали `useDefuddle`, и переключатель ничего не делал. Теперь пишутся оба ключа.
- Макеты трёх вариантов дизайна: https://claude.ai/artifact/TZZcftc7hxuU6pUEVS6m29 (выбран A).

## Важно
- Список сайтов: `content-scripts/toast-overlay.js` (AI_SITES: id/name/short/color/url) и `options.js` (AI_SITES для чипов). Новый сайт = добавить в оба.
- Шаблоны по умолчанию тоже в двух местах: `toast-overlay.js` и `options.js`.
- В manifest.json при релизе менять ОБА поля: `version` и `version_name`.
- У кого сохранён `cpdownAiSites` в storage — новый сайт появится только после включения в настройках.

## Ветка
`claude/project-thread-7b3n48`
