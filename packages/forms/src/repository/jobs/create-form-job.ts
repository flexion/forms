import { type Result, success, failure } from '@flexion/forms-common';
import type { FormRepositoryContext } from '../index.js';
import {
  type FormJob,
  type JobMetadata,
  type JobStatus,
  type JobType,
} from './types.js';
import { dateValue } from '@flexion/forms-database';

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
        created_at: dateValue(ctx.db.engine, now),
        started_at: dateValue(ctx.db.engine, now),
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      })
      .execute();

    return success({
      id: uuid,
      formId: params.formId,
      jobType: params.jobType,
      status: 'processing' as JobStatus,
      createdAt: now,
      startedAt: now,
      metadata: params.metadata,
    }) as any;
  } catch (err) {
    return failure(`Failed to create job: ${(err as Error).message}`);
  }
};
