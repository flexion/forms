import { beforeAll, expect, it, vi } from 'vitest';

import {
  type DbTestContext,
  describeDatabase,
} from '@flexion/forms-database/testing';
import { getLatestFormJob } from './get-latest-form-job.js';
import { createFormJob } from './create-form-job.js';
import { addForm } from '../add-form.js';
import { defaultFormConfig } from '../../patterns/index.js';

describeDatabase('getLatestFormJob', () => {
  const today = new Date(2000, 1, 1);

  beforeAll(async () => {
    vi.setSystemTime(today);
  });

  it<DbTestContext>('returns null when no job exists', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    const result = await getLatestFormJob(
      ctx,
      formResult.data.id,
      'import-pdf'
    );

    if (!result.success) {
      expect.fail('getLatestFormJob failed');
    }

    expect(result.data).toBeNull();
  });

  it<DbTestContext>('returns the latest job of specific type', async ({
    db,
  }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    // Create two jobs of the same type
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
    if (!job2.success) {
      expect.fail('createFormJob failed');
    }

    const result = await getLatestFormJob(
      ctx,
      formResult.data.id,
      'import-pdf'
    );

    if (!result.success || !result.data) {
      expect.fail('getLatestFormJob failed');
    }

    // Should return the second (newer) job
    expect(result.data.id).toBe(job2.data.id);
  });

  it<DbTestContext>('returns job of specific type only', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    // Create jobs of different types
    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 0));
    const importJob = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
    });
    if (!importJob.success) {
      expect.fail('createFormJob failed');
    }

    vi.setSystemTime(new Date(2000, 1, 1, 0, 0, 1));
    await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'validate-schema',
    });

    // Should return import-pdf job, not the newer validate-schema
    const result = await getLatestFormJob(
      ctx,
      formResult.data.id,
      'import-pdf'
    );

    if (!result.success || !result.data) {
      expect.fail('getLatestFormJob failed');
    }

    expect(result.data.jobType).toBe('import-pdf');
    expect(result.data.id).toBe(importJob.data.id);
  });

  it<DbTestContext>('returns job with metadata and result', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    const jobResult = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'validate-schema',
      metadata: {
        validatorVersion: '2.0',
        userId: 'user-123',
      },
    });
    if (!jobResult.success) {
      expect.fail('createFormJob failed');
    }

    const result = await getLatestFormJob(
      ctx,
      formResult.data.id,
      'validate-schema'
    );

    if (!result.success || !result.data) {
      expect.fail('getLatestFormJob failed');
    }

    expect(result.data.metadata).toEqual({
      validatorVersion: '2.0',
      userId: 'user-123',
    });
  });
});

const testForm = {
  summary: { title: 'Test form', description: 'Test description' },
  root: 'root',
  patterns: { root: { type: 'sequence', id: 'root', data: { patterns: [] } } },
  outputs: [],
};
