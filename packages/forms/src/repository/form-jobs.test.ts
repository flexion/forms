import { beforeAll, expect, it, vi } from 'vitest';

import {
  type DbTestContext,
  describeDatabase,
} from '@flexion/forms-database/testing';
import { createFormJob } from './jobs/create-form-job.js';
import { completeFormJob } from './jobs/complete-form-job.js';
import { failFormJob } from './jobs/fail-form-job.js';
import { getLatestFormJob } from './jobs/get-latest-form-job.js';
import { getFormJobs } from './jobs/get-form-jobs.js';
import { addForm } from './add-form.js';
import { defaultFormConfig } from '../patterns/index.js';

describeDatabase('form jobs repository', getDb => {
  const today = new Date(2000, 1, 1);

  beforeAll(async () => {
    vi.setSystemTime(today);
  });

  it<DbTestContext>('creates a job in processing state', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    // Create a form first
    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    // Create a job
    const jobResult = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
      metadata: {
        documentId: 'doc-1',
        fileName: 'test.pdf',
        userId: 'user-1',
      },
    });

    if (!jobResult.success) {
      console.error('Job creation failed:', jobResult.error);
      expect.fail(`createFormJob failed: ${jobResult.error}`);
    }
    expect(jobResult.success).toBe(true);

    expect(jobResult.data.status).toBe('processing');
    expect(jobResult.data.jobType).toBe('import-pdf');
    expect(jobResult.data.formId).toBe(formResult.data.id);
    expect(jobResult.data.metadata).toEqual({
      documentId: 'doc-1',
      fileName: 'test.pdf',
      userId: 'user-1',
    });
  });

  it<DbTestContext>('completes a job with result data', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    // Create a form
    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    // Create a job
    const jobResult = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
    });
    if (!jobResult.success) {
      expect.fail('createFormJob failed');
    }

    // Complete the job
    const completeResult = await completeFormJob(ctx, jobResult.data.id, {
      patternsAdded: 5,
      fieldsExtracted: 12,
      documentId: 'doc-1',
    });

    expect(completeResult.success).toBe(true);

    // Verify the job was updated
    const latestResult = await getLatestFormJob(
      ctx,
      formResult.data.id,
      'import-pdf'
    );
    if (!latestResult.success || !latestResult.data) {
      expect.fail('getLatestFormJob failed');
    }

    expect(latestResult.data.status).toBe('completed');
    expect(latestResult.data.result).toEqual({
      patternsAdded: 5,
      fieldsExtracted: 12,
      documentId: 'doc-1',
    });
    expect(latestResult.data.completedAt).toBeDefined();
  });

  it<DbTestContext>('fails a job with error message', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    // Create a form
    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    // Create a job
    const jobResult = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
    });
    if (!jobResult.success) {
      expect.fail('createFormJob failed');
    }

    // Fail the job
    const failResult = await failFormJob(ctx, jobResult.data.id, {
      message: 'PDF parsing failed',
      stack: 'Error stack trace',
    });

    expect(failResult.success).toBe(true);

    // Verify the job was updated
    const latestResult = await getLatestFormJob(
      ctx,
      formResult.data.id,
      'import-pdf'
    );
    if (!latestResult.success || !latestResult.data) {
      expect.fail('getLatestFormJob failed');
    }

    expect(latestResult.data.status).toBe('failed');
    expect(latestResult.data.errorMessage).toBe('PDF parsing failed');
    expect(latestResult.data.errorStack).toBe('Error stack trace');
    expect(latestResult.data.completedAt).toBeDefined();
  });

  it<DbTestContext>('returns null when no job exists', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    // Create a form
    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    // Try to get a job that doesn't exist
    const latestResult = await getLatestFormJob(
      ctx,
      formResult.data.id,
      'import-pdf'
    );

    expect(latestResult.success).toBe(true);
    if (!latestResult.success) {
      expect.fail('getLatestFormJob failed');
    }
    expect(latestResult.data).toBeNull();
  });

  it<DbTestContext>('returns job history in chronological order', async ({
    db,
  }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    // Create a form
    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    // Create 3 jobs with different timestamps
    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 0));
    const job1 = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
    });
    expect(job1.success).toBe(true);

    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 1));
    const job2 = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
    });
    expect(job2.success).toBe(true);

    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 2));
    const job3 = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'validate-schema',
      metadata: {
        validatorVersion: '1.0',
        userId: 'user-1',
      },
    });
    expect(job3.success).toBe(true);

    // Get all jobs
    const historyResult = await getFormJobs(ctx, formResult.data.id);
    if (!historyResult.success) {
      expect.fail('getFormJobs failed');
    }

    expect(historyResult.data.length).toBe(3);

    // Should be ordered newest first
    expect(historyResult.data[0].createdAt.getTime()).toBeGreaterThan(
      historyResult.data[1].createdAt.getTime()
    );
    expect(historyResult.data[1].createdAt.getTime()).toBeGreaterThan(
      historyResult.data[2].createdAt.getTime()
    );

    // Verify the last one is the validate-schema job
    expect(historyResult.data[0].jobType).toBe('validate-schema');
  });

  it<DbTestContext>('gets only the latest job of a specific type', async ({
    db,
  }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    // Create a form
    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    // Create 2 import-pdf jobs
    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 0));
    await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
    });

    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 1));
    const job2 = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
    });
    if (!job2.success) {
      expect.fail('createFormJob failed');
    }

    // Get latest import-pdf job
    const latestResult = await getLatestFormJob(
      ctx,
      formResult.data.id,
      'import-pdf'
    );
    if (!latestResult.success || !latestResult.data) {
      expect.fail('getLatestFormJob failed');
    }

    // Should be the second job
    expect(latestResult.data.id).toBe(job2.data.id);
  });
});

const testForm = {
  summary: { title: 'Test form', description: 'Test description' },
  root: 'root',
  patterns: { root: { type: 'sequence', id: 'root', data: { patterns: [] } } },
  outputs: [],
};
