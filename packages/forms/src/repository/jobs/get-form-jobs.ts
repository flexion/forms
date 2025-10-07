import { type Result, success, failure } from '@flexion/forms-common';
import type { FormRepositoryContext } from '../index.js';
import { type FormJob, rowToFormJob } from './types.js';

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

    const jobs = rows.map(rowToFormJob);

    return success(jobs as FormJob[]);
  } catch (err) {
    return failure(`Failed to get jobs: ${(err as Error).message}`);
  }
};
