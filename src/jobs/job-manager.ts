import type { BackgroundYouTubeJob, BackgroundYouTubeJobStatus } from './youtube-job';
import {
  getYouTubeJob,
  listYouTubeJobs,
  removeYouTubeJob,
  saveYouTubeJob,
} from './job-storage';

export interface JobManagerStorage {
  get(jobId: string): Promise<BackgroundYouTubeJob | null>;
  list(): Promise<BackgroundYouTubeJob[]>;
  save(job: BackgroundYouTubeJob): Promise<void>;
  remove(jobId: string): Promise<void>;
}

const defaultStorage: JobManagerStorage = {
  get: getYouTubeJob,
  list: listYouTubeJobs,
  save: saveYouTubeJob,
  remove: removeYouTubeJob,
};

export class YouTubeJobManager {
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly storage: JobManagerStorage = defaultStorage) {}

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.mutationQueue.then(operation, operation);
    this.mutationQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  create(job: BackgroundYouTubeJob): Promise<BackgroundYouTubeJob> {
    return this.enqueue(async () => {
      const existing = await this.storage.get(job.jobId);
      if (existing) throw new Error(`Job already exists: ${job.jobId}`);
      await this.storage.save(job);
      return job;
    });
  }

  update(
    jobId: string,
    patch: Partial<Omit<BackgroundYouTubeJob, 'jobId' | 'createdAt'>>,
  ): Promise<BackgroundYouTubeJob> {
    return this.enqueue(async () => {
      const current = await this.storage.get(jobId);
      if (!current) throw new Error(`Job not found: ${jobId}`);
      const next: BackgroundYouTubeJob = {
        ...current,
        ...patch,
        jobId: current.jobId,
        createdAt: current.createdAt,
        updatedAt: Date.now(),
      };
      await this.storage.save(next);
      return next;
    });
  }

  setStatus(
    jobId: string,
    status: BackgroundYouTubeJobStatus,
    error?: string,
  ): Promise<BackgroundYouTubeJob> {
    return this.update(jobId, { status, error });
  }

  remove(jobId: string): Promise<void> {
    return this.enqueue(() => this.storage.remove(jobId));
  }

  get(jobId: string): Promise<BackgroundYouTubeJob | null> {
    return this.storage.get(jobId);
  }

  list(): Promise<BackgroundYouTubeJob[]> {
    return this.storage.list();
  }
}
