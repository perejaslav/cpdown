import { describe, expect, it } from 'vitest';
import { createJobId } from '../../src/jobs/job-id';

describe('createJobId', () => {
  it('creates distinct identifiers with the requested prefix', () => {
    const first = createJobId('youtube');
    const second = createJobId('youtube');

    expect(first).toMatch(/^youtube_\d+_/);
    expect(second).toMatch(/^youtube_\d+_/);
    expect(first).not.toBe(second);
  });
});
