export function createJobId(prefix = 'job'): string {
  const randomPart = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}_${Date.now()}_${randomPart}`;
}
