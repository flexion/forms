// Type-safe job metadata by job type
export type JobMetadata = {
  'import-pdf': {
    documentId: string;
    fileName: string;
    userId: string;
  };
  'validate-schema': {
    validatorVersion: string;
    userId: string;
  };
  publish: {
    targetEnvironment: 'staging' | 'production';
    publisherId: string;
  };
};

// Type-safe job results by job type
export type JobResult = {
  'import-pdf': {
    patternsAdded: number;
    fieldsExtracted: number;
    documentId: string;
  };
  'validate-schema': {
    errorsFound: number;
    warningsFound: number;
    issues: Array<{ field: string; message: string }>;
  };
  publish: {
    publishedAt: string;
    url: string;
  };
};

export type JobType = keyof JobMetadata;
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type FormJob<T extends JobType = JobType> = {
  id: string;
  formId: string;
  jobType: T;
  status: JobStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  errorStack?: string;
  metadata?: JobMetadata[T];
  result?: JobResult[T];
};

/**
 * Helper to convert database row to FormJob object.
 * Handles date conversions and JSON parsing.
 */
export const rowToFormJob = (row: any): FormJob => ({
  id: row.id,
  formId: row.form_id,
  jobType: row.job_type as JobType,
  status: row.status as JobStatus,
  createdAt: new Date(row.created_at),
  startedAt: row.started_at ? new Date(row.started_at) : undefined,
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  errorMessage: row.error_message || undefined,
  errorStack: row.error_stack || undefined,
  metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  result: row.result ? JSON.parse(row.result) : undefined,
});
