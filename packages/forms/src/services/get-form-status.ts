import { type Result, success, failure } from '@flexion/forms-common';
import type { InternalFormServiceContext } from '../context/index.js';
import type { JobStatus } from '../repository/jobs/types.js';

export type FormStatusResponse = {
  formId: string;
  formStatus: 'draft' | 'ready'; // Usability status
  latestJob?: {
    id: string;
    jobType: string;
    status: JobStatus;
    createdAt: string;
    completedAt?: string;
    errorMessage?: string;
  };
};

export type GetFormStatusError = {
  status: number;
  message: string;
};

export type GetFormStatus = (
  ctx: InternalFormServiceContext,
  formId: string
) => Promise<Result<FormStatusResponse, GetFormStatusError>>;

/**
 * Get form status and latest import-pdf job status.
 * Used by frontend polling to check processing progress.
 */
export const getFormStatus: GetFormStatus = async (ctx, formId) => {
  // Get form to check if it exists
  const formResult = await ctx.repository.getForm(formId);
  if (!formResult.success) {
    return failure({
      status: 404,
      message: 'Form not found',
    });
  }

  const form = formResult.data;
  if (!form) {
    return failure({
      status: 404,
      message: 'Form not found',
    });
  }

  // Get latest import-pdf job (if any)
  const latestJobResult = await ctx.repository.getLatestFormJob(
    formId,
    'import-pdf'
  );

  if (!latestJobResult.success) {
    return failure({
      status: 500,
      message: 'Failed to get job status',
    });
  }

  const job = latestJobResult.data;

  // Determine form status based on job state first to avoid race conditions
  // If a job is actively processing, keep status as 'draft' even if patterns exist
  let formStatus: 'draft' | 'ready';

  if (job && (job.status === 'pending' || job.status === 'processing')) {
    // Job is still active - form is not ready yet
    formStatus = 'draft';
  } else {
    // No active job - determine status based on content
    const hasContent = Object.keys(form.patterns).length > 1; // >1 because root pattern always exists
    formStatus = hasContent ? 'ready' : 'draft';
  }

  return success({
    formId,
    formStatus,
    latestJob: job
      ? {
          id: job.id,
          jobType: job.jobType,
          status: job.status,
          createdAt: job.createdAt.toISOString(),
          completedAt: job.completedAt?.toISOString(),
          errorMessage: job.errorMessage,
        }
      : undefined,
  });
};
