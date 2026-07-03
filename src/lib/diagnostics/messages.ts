/**
 * Human-readable messages for diagnostic codes.
 * Privacy-safe: NO page content, URL, titles, or tokens.
 */

import type { DiagnosticCode } from "../contracts";

const MESSAGES: Record<DiagnosticCode, { en: string; ru: string }> = {
  TAB_RELOAD_REQUIRED: {
    en: "The extension was updated. Please refresh the tab and try again.",
    ru: "Расширение было обновлено. Обновите вкладку и повторите действие.",
  },
  PAGE_RESTRICTED: {
    en: "This page cannot be accessed by the extension.",
    ru: "Браузер не разрешает работать с этой страницей.",
  },
  YOUTUBE_NO_CAPTIONS: {
    en: "No captions are available for this video.",
    ru: "Для этого видео нет доступных субтитров.",
  },
  YOUTUBE_PLAYER_TIMEOUT: {
    en: "Could not get caption data from YouTube in time. Reload the page and try again.",
    ru: "Не удалось вовремя получить данные субтитров YouTube. Обновите страницу и повторите действие.",
  },
  YOUTUBE_TRACK_NOT_FOUND: {
    en: "No suitable caption track found for your language.",
    ru: "Не найдена подходящая дорожка субтитров для вашего языка.",
  },
  YOUTUBE_TIMEDTEXT_EMPTY: {
    en: "Downloaded captions are empty.",
    ru: "Загруженные субтитры пусты.",
  },
  YOUTUBE_TIMEDTEXT_REQUEST_FAILED: {
    en: "Could not download the caption file.",
    ru: "Не удалось загрузить файл субтитров.",
  },
  YOUTUBE_STALE_RESPONSE: {
    en: "Received data belongs to a different video. Try again.",
    ru: "Получены данные от другого видео. Повторите попытку.",
  },
  YOUTUBE_BRIDGE_INVALID_MESSAGE: {
    en: "Internal communication error. Reload the page.",
    ru: "Внутренняя ошибка связи. Обновите страницу.",
  },
  XCOM_NOT_FOUND: {
    en: "Could not find X.com post content on the page.",
    ru: "Не удалось найти текст публикации X.com на странице.",
  },
  COPY_FAILED: {
    en: "Could not copy to clipboard.",
    ru: "Не удалось скопировать результат в буфер обмена.",
  },
  STORAGE_FAILED: {
    en: "Could not save local diagnostics.",
    ru: "Не удалось сохранить локальную диагностику.",
  },
};

export function humanizeError(code: DiagnosticCode, locale: "en" | "ru" = "en"): string {
  return MESSAGES[code][locale];
}
