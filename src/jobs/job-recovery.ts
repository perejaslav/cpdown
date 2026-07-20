import { readYouTubeJobs, writeYouTubeJobs, type SessionStorageArea } from "./job-storage";
import { isExpiredYouTubeJob, isTerminalYouTubeJobStatus, type BackgroundYouTubeJob } from "./youtube-job";

export interface TabRecoveryAdapter {
  exists(tabId: number): Promise<boolean>;
  close(tabId: number): Promise<void>;
}

export interface RecoveryResult {
  resumableJobs: BackgroundYouTubeJob[];
  removedJobIds: string[];
  closedWorkerTabIds: number[];
}

export async function recoverYouTubeJobs(options: {
  storage?: SessionStorageArea;
  tabs: TabRecoveryAdapter;
  now?: number;
  timeoutMs?: number;
}): Promise<RecoveryResult> {
  const jobs = await readYouTubeJobs(options.storage);
  const retained: Record<string, BackgroundYouTubeJob> = {};
  const resumableJobs: BackgroundYouTubeJob[] = [];
  const removedJobIds: string[] = [];
  const closedWorkerTabIds: number[] = [];

  for (const job of Object.values(jobs)) {
    const workerExists =
      typeof job.workerTabId === "number" ? await options.tabs.exists(job.workerTabId) : false;

    if (isTerminalYouTubeJobStatus(job.status) || isExpiredYouTubeJob(job, options.now, options.timeoutMs)) {
      removedJobIds.push(job.jobId);
      if (workerExists && typeof job.workerTabId === "number") {
        await options.tabs.close(job.workerTabId);
        closedWorkerTabIds.push(job.workerTabId);
      }
      continue;
    }

    if (typeof job.workerTabId === "number" && !workerExists) {
      removedJobIds.push(job.jobId);
      continue;
    }

    retained[job.jobId] = job;
    resumableJobs.push(job);
  }

  await writeYouTubeJobs(retained, options.storage);
  return { resumableJobs, removedJobIds, closedWorkerTabIds };
}
