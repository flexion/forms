import { beforeAll, expect, it, vi } from 'vitest';

import {
  type DbTestContext,
  describeDatabase,
} from '@flexion/forms-database/testing';
import { failFormJob } from './fail-form-job.js';
import { createFormJob } from './create-form-job.js';
import { getLatestFormJob } from './get-latest-form-job.js';
import { addForm } from '../add-form.js';
import { defaultFormConfig } from '../../patterns/index.js';

describeDatabase('failFormJob', () => {
  const today = new Date(2000, 1, 1);

  beforeAll(async () => {
    vi.setSystemTime(today);
  });

  it<DbTestContext>('fails a job with error message and stack', async ({
    db,
  }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    const jobResult = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
    });
    if (!jobResult.success) {
      expect.fail('createFormJob failed');
    }

    const result = await failFormJob(ctx, jobResult.data.id, {
      message: 'PDF parsing failed',
      stack: 'Error: PDF parsing failed\n  at parsePDF',
    });

    expect(result.success).toBe(true);

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
    expect(latestResult.data.completedAt).toBeDefined();
    expect(latestResult.data.errorMessage).toBe('PDF parsing failed');
    expect(latestResult.data.errorStack).toBe(
      'Error: PDF parsing failed\n  at parsePDF'
    );
  });

  it<DbTestContext>('fails a job without stack trace', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    const jobResult = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'validate-schema',
    });
    if (!jobResult.success) {
      expect.fail('createFormJob failed');
    }

    const result = await failFormJob(ctx, jobResult.data.id, {
      message: 'Validation failed',
    });

    expect(result.success).toBe(true);

    // Verify the job was updated
    const latestResult = await getLatestFormJob(
      ctx,
      formResult.data.id,
      'validate-schema'
    );
    if (!latestResult.success || !latestResult.data) {
      expect.fail('getLatestFormJob failed');
    }

    expect(latestResult.data.status).toBe('failed');
    expect(latestResult.data.completedAt).toBeDefined();
    expect(latestResult.data.errorMessage).toBe('Validation failed');
    expect(latestResult.data.errorStack).toBeUndefined();
  });
});

const testForm = {
  summary: { title: 'Test form', description: 'Test description' },
  root: 'root',
  patterns: { root: { type: 'sequence', id: 'root', data: { patterns: [] } } },
  outputs: [],
};
