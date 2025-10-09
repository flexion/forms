import { beforeAll, expect, it, vi } from 'vitest';

import {
  type DbTestContext,
  describeDatabase,
} from '@flexion/forms-database/testing';
import { getFormJobs } from './get-form-jobs.js';
import { createFormJob } from './create-form-job.js';
import { addForm } from '../add-form.js';
import { defaultFormConfig } from '../../patterns/index.js';

describeDatabase('getFormJobs', () => {
  const today = new Date(2000, 1, 1);

  beforeAll(async () => {
    vi.setSystemTime(today);
  });

  it<DbTestContext>('returns empty array when no jobs exist', async ({
    db,
  }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    const result = await getFormJobs(ctx, formResult.data.id);

    if (!result.success) {
      expect.fail('getFormJobs failed');
    }

    expect(result.data).toEqual([]);
  });

  it<DbTestContext>('returns all jobs in descending order', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

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
      jobType: 'validate-schema',
    });
    expect(job2.success).toBe(true);

    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 2));
    const job3 = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'publish',
    });
    expect(job3.success).toBe(true);

    const result = await getFormJobs(ctx, formResult.data.id);

    if (!result.success) {
      expect.fail('getFormJobs failed');
    }

    expect(result.data.length).toBe(3);

    // Should be ordered newest first
    expect(result.data[0].createdAt.getTime()).toBeGreaterThan(
      result.data[1].createdAt.getTime()
    );
    expect(result.data[1].createdAt.getTime()).toBeGreaterThan(
      result.data[2].createdAt.getTime()
    );

    // Verify order of job types
    expect(result.data[0].jobType).toBe('publish');
    expect(result.data[1].jobType).toBe('validate-schema');
    expect(result.data[2].jobType).toBe('import-pdf');
  });

  it<DbTestContext>('returns jobs for specific form only', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    // Create two forms
    const form1Result = await addForm(ctx, testForm);
    const form2Result = await addForm(ctx, testForm);
    if (!form1Result.success || !form2Result.success) {
      expect.fail('addForm failed');
    }

    // Create jobs for both forms
    await createFormJob(ctx, {
      formId: form1Result.data.id,
      jobType: 'import-pdf',
    });
    await createFormJob(ctx, {
      formId: form2Result.data.id,
      jobType: 'import-pdf',
    });

    const result = await getFormJobs(ctx, form1Result.data.id);

    if (!result.success) {
      expect.fail('getFormJobs failed');
    }

    expect(result.data.length).toBe(1);
    expect(result.data[0].formId).toBe(form1Result.data.id);
  });
});

const testForm = {
  summary: { title: 'Test form', description: 'Test description' },
  root: 'root',
  patterns: { root: { type: 'sequence', id: 'root', data: { patterns: [] } } },
  outputs: [],
};
