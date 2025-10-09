import { type Result, success, failure } from '@flexion/forms-common';
import type { FormRepositoryContext } from '../index.js';

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
