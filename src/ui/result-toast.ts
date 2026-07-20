import type { ExtractionError, ExtractionResult } from '../core/result-types';
import { copyMarkdown } from './copy-markdown';
import { downloadMarkdownFile } from './download-markdown';

const HOST_ID = 'cpdown-toast-host';

function removeExistingToast(): void {
  document.getElementById(HOST_ID)?.remove();
}

function createHost(): ShadowRoot {
  removeExistingToast();
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  host.style.right = '20px';
  host.style.bottom = '20px';
  document.documentElement.append(host);
  return host.attachShadow({ mode: 'closed' });
}

function createStyle(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = `
    :host { color-scheme: light dark; }
    .card {
      box-sizing: border-box;
      width: min(360px, calc(100vw - 32px));
      padding: 16px;
      border: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
      border-radius: 14px;
      background: Canvas;
      color: CanvasText;
      box-shadow: 0 14px 40px rgba(0,0,0,.24);
      font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .title { margin: 0 0 6px; font-size: 15px; font-weight: 700; }
    .meta { margin: 0 0 14px; opacity: .76; }
    .error { color: #c62828; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    button {
      appearance: none;
      border: 1px solid color-mix(in srgb, CanvasText 22%, transparent);
      border-radius: 9px;
      padding: 8px 11px;
      background: color-mix(in srgb, Canvas 92%, CanvasText 8%);
      color: CanvasText;
      cursor: pointer;
      font: inherit;
    }
    button:hover { filter: brightness(.96); }
    button.primary { background: #2563eb; border-color: #2563eb; color: white; }
    button:disabled { opacity: .55; cursor: default; }
    .status { min-height: 20px; margin-top: 10px; font-size: 13px; opacity: .8; }
  `;
  return style;
}

function button(label: string, className = ''): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.className = className;
  return element;
}

export function showExtractionResultToast(result: ExtractionResult): void {
  const root = createHost();
  root.append(createStyle());

  const card = document.createElement('section');
  card.className = 'card';

  const title = document.createElement('h2');
  title.className = 'title';
  title.textContent = 'Markdown готов';

  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = `${result.title} · ${result.wordCount} слов · ≈${result.estimatedTokens} токенов`;

  const actions = document.createElement('div');
  actions.className = 'actions';
  const copy = button('Копировать', 'primary');
  const save = button('Сохранить .md');
  const close = button('Закрыть');
  const status = document.createElement('div');
  status.className = 'status';

  copy.addEventListener('click', async () => {
    copy.disabled = true;
    try {
      await copyMarkdown(result.markdown);
      status.textContent = 'Скопировано в буфер обмена';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Не удалось скопировать';
    } finally {
      copy.disabled = false;
    }
  });

  save.addEventListener('click', () => {
    downloadMarkdownFile(result.fileName, result.markdown);
    status.textContent = `Сохранён файл ${result.fileName}`;
  });
  close.addEventListener('click', removeExistingToast);

  actions.append(copy, save, close);
  card.append(title, meta, actions, status);
  root.append(card);
}

export function showExtractionErrorToast(error: ExtractionError): void {
  const root = createHost();
  root.append(createStyle());
  const card = document.createElement('section');
  card.className = 'card';
  const title = document.createElement('h2');
  title.className = 'title error';
  title.textContent = 'Не удалось получить Markdown';
  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = error.message;
  const close = button('Закрыть');
  close.addEventListener('click', removeExistingToast);
  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.append(close);
  card.append(title, meta, actions);
  root.append(card);
}
