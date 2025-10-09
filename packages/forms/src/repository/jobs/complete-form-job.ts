import { type Result, success, failure } from '@flexion/forms-common';
import type { FormRepositoryContext } from '../index.js';
import { type JobResult, type JobType } from './types.js';

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
