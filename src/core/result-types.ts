export type ExtractionType = 'article' | 'youtube' | 'x' | 'selection';

export interface ExtractionResult {
  jobId: string;
  type: ExtractionType;
  title: string;
  sourceUrl: string;
  markdown: string;
  fileName: string;
  wordCount: number;
  estimatedTokens: number;
  warnings: string[];
  metadata: Record<string, string | number | boolean | null>;
}

export interface ExtractionError {
  jobId: string;
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
}

export type JobStatus =
  | 'created'
  | 'opening-tab'
  | 'waiting-page'
  | 'extracting'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';
