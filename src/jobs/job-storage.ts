import type { BackgroundYouTubeJob } from "./youtube-job";

const STORAGE_KEY = "cpdown.youtubeJobs";

export interface SessionStorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

function defaultStorage(): SessionStorageArea {
  return chrome.storage.session;
}

function asJobMap(value: unknown): Record<string, BackgroundYouTubeJob> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, BackgroundYouTubeJob>;
}

export async function readYouTubeJobs(
  storage: SessionStorageArea = defaultStorage(),
): Promise<Record<string, BackgroundYouTubeJob>> {
  const data = await storage.get(STORAGE_KEY);
  return asJobMap(data[STORAGE_KEY]);
}

export async function writeYouTubeJobs(
  jobs: Record<string, BackgroundYouTubeJob>,
  storage: SessionStorageArea = defaultStorage(),
): Promise<void> {
  await storage.set({ [STORAGE_KEY]: jobs });
}

export async function putYouTubeJob(
  job: BackgroundYouTubeJob,
  storage: SessionStorageArea = defaultStorage(),
): Promise<void> {
  const jobs = await readYouTubeJobs(storage);
  jobs[job.jobId] = job;
  await writeYouTubeJobs(jobs, storage);
}

export async function removeYouTubeJob(
  jobId: string,
  storage: SessionStorageArea = defaultStorage(),
): Promise<BackgroundYouTubeJob | undefined> {
  const jobs = await readYouTubeJobs(storage);
  const removed = jobs[jobId];
  if (!removed) return undefined;
  delete jobs[jobId];
  await writeYouTubeJobs(jobs, storage);
  return removed;
}

export async function updateYouTubeJob(
  jobId: string,
  patch: Partial<Omit<BackgroundYouTubeJob, "jobId" | "createdAt">>,
  storage: SessionStorageArea = defaultStorage(),
): Promise<BackgroundYouTubeJob> {
  const jobs = await readYouTubeJobs(storage);
  const current = jobs[jobId];
  if (!current) throw new Error(`YouTube job not found: ${jobId}`);

  const updated: BackgroundYouTubeJob = {
    ...current,
    ...patch,
    jobId: current.jobId,
    createdAt: current.createdAt,
    updatedAt: patch.updatedAt ?? Date.now(),
  };
  jobs[jobId] = updated;
  await writeYouTubeJobs(jobs, storage);
  return updated;
}
