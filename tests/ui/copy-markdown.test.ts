// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyMarkdown } from '../../src/ui/copy-markdown';

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.innerHTML = '<head></head><body></body>';
});

describe('copyMarkdown', () => {
  it('uses the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await copyMarkdown('# Markdown');

    expect(writeText).toHaveBeenCalledWith('# Markdown');
  });

  it('falls back to execCommand and removes the temporary textarea', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    await copyMarkdown('fallback');

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('reports a failed fallback copy', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });

    await expect(copyMarkdown('failure')).rejects.toThrow('Не удалось скопировать Markdown');
  });
});
