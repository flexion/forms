import { type Result, success, failure } from '@flexion/forms-common';
import type { FormRepositoryContext } from '../index.js';
import { type FormJob, type JobType, rowToFormJob } from './types.js';

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

    return success(rowToFormJob(row)) as any;
  } catch (err) {
    return failure(`Failed to get latest job: ${(err as Error).message}`);
  }
};
