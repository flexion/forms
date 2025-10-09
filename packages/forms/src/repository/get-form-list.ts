import type { FormRepositoryContext } from './index.js';
import type { JobStatus } from './jobs/types.js';

export type FormListItem = {
  id: string;
  title: string;
  description: string;
  latestJob?: {
    id: string;
    jobType: string;
    status: JobStatus;
    createdAt: Date;
    completedAt?: Date;
    errorMessage?: string;
  };
};

export type GetFormList = (
  ctx: FormRepositoryContext
) => Promise<FormListItem[] | null>;

/**
 * Retrieves a list of forms from the database with their latest job status.
 */
export const getFormList: GetFormList = async ctx => {
  const db = await ctx.db.getKysely();

  // Get all forms
  const forms = await db.selectFrom('forms').select(['id', 'data']).execute();

  // For each form, get the latest import-pdf job
  const formList = await Promise.all(
    forms.map(async (row) => {
      const form = JSON.parse(row.data);

      // Get latest import-pdf job for this form
      const latestJob = await db
        .selectFrom('form_jobs')
        .selectAll()
        .where('form_id', '=', row.id)
        .where('job_type', '=', 'import-pdf')
        .orderBy('created_at', 'desc')
        .limit(1)
        .executeTakeFirst();

      const formListItem: FormListItem = {
        id: row.id,
        title: form.summary.title,
        description: form.summary.description,
      };

      if (latestJob) {
        formListItem.latestJob = {
          id: latestJob.id,
          jobType: latestJob.job_type,
          status: latestJob.status as JobStatus,
          createdAt: new Date(latestJob.created_at),
          completedAt: latestJob.completed_at
            ? new Date(latestJob.completed_at)
            : undefined,
          errorMessage: latestJob.error_message || undefined,
        };
      }

      return formListItem;
    })
  );

  return formList;
};
