import type { ExtractionError, ExtractionResult } from './result-types';

export interface RuntimeEnvelope<TType extends string, TPayload> {
  type: TType;
  jobId: string;
  timestamp: number;
  payload: TPayload;
}

export type StartExtractionMessage = RuntimeEnvelope<
  'EXTRACTION_START',
  {
    tabId: number;
    sourceUrl: string;
  }
>;

export type ExtractionCompletedMessage = RuntimeEnvelope<
  'EXTRACTION_COMPLETED',
  ExtractionResult
>;

export type ExtractionFailedMessage = RuntimeEnvelope<
  'EXTRACTION_FAILED',
  ExtractionError
>;

export type CpdownRuntimeMessage =
  | StartExtractionMessage
  | ExtractionCompletedMessage
  | ExtractionFailedMessage;
