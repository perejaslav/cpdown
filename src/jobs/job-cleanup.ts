import { readYouTubeJobs, writeYouTubeJobs, type SessionStorageArea } from "./job-storage";
import { isExpiredYouTubeJob, type BackgroundYouTubeJob } from "./youtube-job";

export interface TabsCleanupAdapter {
  exists(tabId: number): Promise<boolean>;
  close(tabId: number): Promise<void>;
}

export interface CleanupResult {
  removedJobIds: string[];
  closedWorkerTabIds: number[];
  retainedJobs: Record<string, BackgroundYouTubeJob>;
}

export async function cleanupExpiredYouTubeJobs(options: {
  storage?: SessionStorageArea;
  tabs: TabsCleanupAdapter;
  now?: number;
  timeoutMs?: number;
}): Promise<CleanupResult> {
  const jobs = await readYouTubeJobs(options.storage);
  const retainedJobs: Record<string, BackgroundYouTubeJob> = {};
  const removedJobIds: string[] = [];
  const closedWorkerTabIds: number[] = [];

  for (const job of Object.values(jobs)) {
    if (!isExpiredYouTubeJob(job, options.now, options.timeoutMs)) {
      retainedJobs[job.jobId] = job;
      continue;
    }

    removedJobIds.push(job.jobId);
    if (typeof job.workerTabId === "number" && (await options.tabs.exists(job.workerTabId))) {
      await options.tabs.close(job.workerTabId);
      closedWorkerTabIds.push(job.workerTabId);
    }
  }

  await writeYouTubeJobs(retainedJobs, options.storage);
  return { removedJobIds, closedWorkerTabIds, retainedJobs };
}
