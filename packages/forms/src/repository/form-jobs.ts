import { type Result, success, failure } from '@flexion/forms-common';
import type { FormRepositoryContext } from './index.js';

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
 * Create a new job record in 'processing' state.
 * Call this before starting async work.
 */
export type CreateFormJob = <T extends JobType>(
  ctx: FormRepositoryContext,
  params: {
    formId: string;
    jobType: T;
    metadata?: JobMetadata[T];
  }
) => Promise<Result<FormJob<T>, string>>;

export const createFormJob: CreateFormJob = async (ctx, params) => {
  const uuid = crypto.randomUUID();
  const db = await ctx.db.getKysely();

  try {
    const now = new Date();
    await db
      .insertInto('form_jobs')
      .values({
        id: uuid,
        form_id: params.formId,
        job_type: params.jobType,
        status: 'processing',
        created_at: now.toISOString() as any,
        started_at: now.toISOString() as any,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      })
      .execute();

    return success({
      id: uuid,
      formId: params.formId,
      jobType: params.jobType,
      status: 'processing' as JobStatus,
      createdAt: new Date(),
      startedAt: new Date(),
      metadata: params.metadata,
    }) as any;
  } catch (err) {
    return failure(`Failed to create job: ${(err as Error).message}`);
  }
};

/**
 * Mark a job as completed with result data.
 */
export type CompleteFormJob = <T extends JobType>(
  ctx: FormRepositoryContext,
  jobId: string,
  result?: JobResult[T]
) => Promise<Result<void, string>>;

export const completeFormJob: CompleteFormJob = async (ctx, jobId, result) => {
  const db = await ctx.db.getKysely();

  try {
    await db
      .updateTable('form_jobs')
      .set({
        status: 'completed',
        completed_at: new Date().toISOString() as any,
        result: result ? JSON.stringify(result) : null,
      })
      .where('id', '=', jobId)
      .execute();

    return success(undefined);
  } catch (err) {
    return failure(`Failed to complete job: ${(err as Error).message}`);
  }
};

/**
 * Mark a job as failed with error information.
 */
export type FailFormJob = (
  ctx: FormRepositoryContext,
  jobId: string,
  error: { message: string; stack?: string }
) => Promise<Result<void, string>>;

export const failFormJob: FailFormJob = async (ctx, jobId, error) => {
  const db = await ctx.db.getKysely();

  try {
    await db
      .updateTable('form_jobs')
      .set({
        status: 'failed',
        completed_at: new Date().toISOString() as any,
        error_message: error.message,
        error_stack: error.stack || null,
      })
      .where('id', '=', jobId)
      .execute();

    return success(undefined);
  } catch (err) {
    return failure(`Failed to fail job: ${(err as Error).message}`);
  }
};

/**
 * Get the latest job for a form of a specific type.
 * Useful for status polling: "What's the current import-pdf job status?"
 */
export type GetLatestFormJob = <T extends JobType>(
  ctx: FormRepositoryContext,
  formId: string,
  jobType: T
) => Promise<Result<FormJob<T> | null, string>>;

export const getLatestFormJob: GetLatestFormJob = async (
  ctx,
  formId,
  jobType
) => {
  const db = await ctx.db.getKysely();

  try {
    const row = await db
      .selectFrom('form_jobs')
      .selectAll()
      .where('form_id', '=', formId)
      .where('job_type', '=', jobType)
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (!row) {
      return success(null);
    }

    return success({
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
    }) as any;
  } catch (err) {
    return failure(`Failed to get latest job: ${(err as Error).message}`);
  }
};

/**
 * Get all jobs for a form (full history).
 * Useful for debugging and audit logs.
 */
export type GetFormJobs = (
  ctx: FormRepositoryContext,
  formId: string
) => Promise<Result<FormJob[], string>>;

export const getFormJobs: GetFormJobs = async (ctx, formId) => {
  const db = await ctx.db.getKysely();

  try {
    const rows = await db
      .selectFrom('form_jobs')
      .selectAll()
      .where('form_id', '=', formId)
      .orderBy('created_at', 'desc')
      .execute();

    const jobs = rows.map(row => ({
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
    }));

    return success(jobs as FormJob[]);
  } catch (err) {
    return failure(`Failed to get jobs: ${(err as Error).message}`);
  }
};
