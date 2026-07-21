// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtractionResult } from '../../src/core/result-types';

const mocks = vi.hoisted(() => ({
  copyMarkdown: vi.fn().mockResolvedValue(undefined),
  downloadMarkdownFile: vi.fn(),
}));

vi.mock('../../src/ui/copy-markdown', () => ({ copyMarkdown: mocks.copyMarkdown }));
vi.mock('../../src/ui/download-markdown', () => ({
  downloadMarkdownFile: mocks.downloadMarkdownFile,
}));

import {
  showExtractionErrorToast,
  showExtractionResultToast,
} from '../../src/ui/result-toast';

const result: ExtractionResult = {
  jobId: 'job-1',
  type: 'youtube',
  title: 'Тестовое видео',
  sourceUrl: 'https://www.youtube.com/watch?v=test',
  markdown: '# Тестовое видео\n',
  fileName: 'Тестовое видео.md',
  wordCount: 2,
  estimatedTokens: 5,
  warnings: [],
  metadata: {},
};

let latestRoot: ShadowRoot | undefined;

beforeEach(() => {
  latestRoot = undefined;
  const nativeAttachShadow = Element.prototype.attachShadow;
  vi.spyOn(Element.prototype, 'attachShadow').mockImplementation(function () {
    latestRoot = nativeAttachShadow.call(this, { mode: 'open' });
    return latestRoot;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  mocks.copyMarkdown.mockClear();
  mocks.downloadMarkdownFile.mockClear();
  document.documentElement.innerHTML = '<head></head><body></body>';
});

function findButton(label: string): HTMLButtonElement {
  const button = [...(latestRoot?.querySelectorAll('button') ?? [])].find(
    (candidate) => candidate.textContent === label,
  );
  if (!button) throw new Error(`Button not found: ${label}`);
  return button as HTMLButtonElement;
}

describe('result toast', () => {
  it('renders result metadata and executes copy and save actions', async () => {
    showExtractionResultToast(result);

    expect(latestRoot?.textContent).toContain('Markdown готов');
    expect(latestRoot?.textContent).toContain('Тестовое видео · 2 слов · ≈5 токенов');

    findButton('Копировать').click();
    await Promise.resolve();
    expect(mocks.copyMarkdown).toHaveBeenCalledWith(result.markdown);
    expect(latestRoot?.textContent).toContain('Скопировано в буфер обмена');

    findButton('Сохранить .md').click();
    expect(mocks.downloadMarkdownFile).toHaveBeenCalledWith(result.fileName, result.markdown);
    expect(latestRoot?.textContent).toContain('Сохранён файл Тестовое видео.md');
  });

  it('closes the current notification', () => {
    showExtractionResultToast(result);
    expect(document.getElementById('cpdown-toast-host')).not.toBeNull();

    findButton('Закрыть').click();

    expect(document.getElementById('cpdown-toast-host')).toBeNull();
  });

  it('replaces an existing notification instead of stacking duplicates', () => {
    showExtractionResultToast(result);
    const firstHost = document.getElementById('cpdown-toast-host');

    showExtractionErrorToast({
      jobId: 'job-2',
      code: 'NO_CAPTIONS',
      message: 'Субтитры недоступны',
      recoverable: true,
    });

    const hosts = document.querySelectorAll('#cpdown-toast-host');
    expect(hosts).toHaveLength(1);
    expect(hosts[0]).not.toBe(firstHost);
    expect(latestRoot?.textContent).toContain('Не удалось получить Markdown');
    expect(latestRoot?.textContent).toContain('Субтитры недоступны');
  });
});
