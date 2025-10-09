import { beforeAll, expect, it, vi } from 'vitest';

import {
  type DbTestContext,
  describeDatabase,
} from '@flexion/forms-database/testing';
import { completeFormJob } from './complete-form-job.js';
import { createFormJob } from './create-form-job.js';
import { getLatestFormJob } from './get-latest-form-job.js';
import { addForm } from '../add-form.js';
import { defaultFormConfig } from '../../patterns/index.js';

describeDatabase('completeFormJob', () => {
  const today = new Date(2000, 1, 1);

  beforeAll(async () => {
    vi.setSystemTime(today);
  });

  it<DbTestContext>('completes a job with result data', async ({ db }) => {
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

    const result = await completeFormJob(ctx, jobResult.data.id, {
      patternsAdded: 5,
      fieldsExtracted: 12,
      documentId: 'doc-1',
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

    expect(latestResult.data.status).toBe('completed');
    expect(latestResult.data.completedAt).toBeDefined();
    expect(latestResult.data.result).toEqual({
      patternsAdded: 5,
      fieldsExtracted: 12,
      documentId: 'doc-1',
    });
  });

  it<DbTestContext>('completes a job without result data', async ({ db }) => {
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

    const result = await completeFormJob(ctx, jobResult.data.id);

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

    expect(latestResult.data.status).toBe('completed');
    expect(latestResult.data.completedAt).toBeDefined();
    expect(latestResult.data.result).toBeUndefined();
  });
});

const testForm = {
  summary: { title: 'Test form', description: 'Test description' },
  root: 'root',
  patterns: { root: { type: 'sequence', id: 'root', data: { patterns: [] } } },
  outputs: [],
};
