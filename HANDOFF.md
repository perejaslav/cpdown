# HANDOFF

## Проект
cpdown — браузерное расширение: страница/субтитры YouTube → Markdown, меню «Copy for AI» с кнопками нейросетей.

## Последнее (v1.13.2) — «empty subtitles», вторая попытка
- Лог пользователя с 1.13.1 показал: в скрытой вкладке плеер не запрашивает субтитры (нет `pot`), панель расшифровки не рисуется, таймеры тормозятся. Прямые get_transcript (400, даже с SAPISIDHASH) и Android API (LOGIN_REQUIRED) мертвы.
- Решение: способ 5 в `content-scripts/yt-transcript.js` — шлём `TRANSCRIPT_NEED_VISIBLE`, `background.js` делает вкладку активной (она заглушена), повторяем `pot` + чтение панели, затем фон возвращает исходную вкладку.
- `youtube-main-world.js` ещё и ловит ответ страницы на её собственный get_transcript (`CPDOWN_GET_PAGE_TRANSCRIPT`).
- `youtube-main-world.js` теперь подключается из manifest (`world: MAIN`, `document_start`); вызов `IL(...)` в `content.js` заменён на `void 0` — это убирает ошибки «Unsafe attempt to load URL».
- Watchdog — 50 с.
- **На живом YouTube не проверено** (из облака недоступен). Ждём лог от пользователя: строки `visible tab: ...` и `page transcript: ...`.

## Раньше (v1.13.1)
- Причина: YouTube не отдаёт субтитры без токена `pot`, а скрытая вкладка не успевала его поймать (ждали 100 мс). Android API теперь отвечает LOGIN_REQUIRED, get_transcript — 400.
- `youtube-main-world.js` переписан читаемо: ловит `pot` из XHR, fetch и performance entries, ждёт до 4 с после включения субтитров.
- `content-scripts/yt-transcript.js`: get_transcript подписывается SAPISIDHASH; добавлен способ 4 — клик по «Показать расшифровку» и чтение текста со страницы.
- Watchdog в `background.js` — 35 с.
- **Не проверено на живом YouTube** (из облака он недоступен). Проверен только захват `pot` на макете. Если снова ошибка — смотреть лог шагов: строка `pot: ... (причина)` и `page transcript: ...`.

## Раньше (v1.13)
- Добавлена кнопка **Gemini** (`https://gemini.google.com/app`).
- Список сайтов: `content-scripts/toast-overlay.js` (AI_SITES: id/name/short/url) и `options-prompts.js` (AI_SITES для галочек). Новый сайт = добавить в оба.
- В manifest.json при релизе менять ОБА поля: `version` и `version_name` (браузер показывает version_name).
- Нюанс: у кого сохранён `cpdownAiSites` в storage — новый сайт появится только после включения галочки в настройках.

## Ветка
`claude/sharp-sagan-hx8j3b`
