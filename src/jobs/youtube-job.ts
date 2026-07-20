import type { RequestedCaptionTrack } from "../extractors/youtube/caption-track-selector";

export type BackgroundYouTubeJobStatus =
  | "created"
  | "opening-tab"
  | "waiting-page"
  | "extracting"
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout";

export interface BackgroundYouTubeJob {
  jobId: string;
  sourceTabId: number;
  workerTabId?: number;
  sourceUrl: string;
  videoUrl: string;
  requestedTrack?: RequestedCaptionTrack;
  status: BackgroundYouTubeJobStatus;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

export function isTerminalYouTubeJobStatus(status: BackgroundYouTubeJobStatus): boolean {
  return ["completed", "failed", "cancelled", "timeout"].includes(status);
}

export function isExpiredYouTubeJob(
  job: BackgroundYouTubeJob,
  now = Date.now(),
  timeoutMs = 30_000,
): boolean {
  return !isTerminalYouTubeJobStatus(job.status) && now - job.createdAt >= timeoutMs;
}
