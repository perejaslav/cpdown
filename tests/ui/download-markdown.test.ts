// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadMarkdownFile } from '../../src/ui/download-markdown';

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.innerHTML = '<head></head><body></body>';
});

describe('downloadMarkdownFile', () => {
  it('creates a UTF-8 markdown blob and revokes its object URL', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:cpdown-test');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadMarkdownFile('result.md', '# Result');
    await Promise.resolve();

    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe('text/markdown;charset=utf-8');
    expect(await blob.text()).toBe('# Result');
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:cpdown-test');
    expect(document.querySelector('a')).toBeNull();
  });
});
