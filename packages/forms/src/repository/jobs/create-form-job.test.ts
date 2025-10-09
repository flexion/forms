import { beforeAll, expect, it, vi } from 'vitest';

import {
  type DbTestContext,
  describeDatabase,
} from '@flexion/forms-database/testing';
import { createFormJob } from './create-form-job.js';
import { addForm } from '../add-form.js';
import { defaultFormConfig } from '../../patterns/index.js';

describeDatabase('createFormJob', () => {
  const today = new Date(2000, 1, 1);

  beforeAll(async () => {
    vi.setSystemTime(today);
  });

  it<DbTestContext>('creates a job in processing state', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    const result = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
      metadata: {
        documentId: 'doc-1',
        fileName: 'test.pdf',
        userId: 'user-1',
      },
    });

    if (!result.success) {
      expect.fail(`createFormJob failed: ${result.error}`);
    }

    expect(result.data.status).toBe('processing');
    expect(result.data.jobType).toBe('import-pdf');
    expect(result.data.formId).toBe(formResult.data.id);
    expect(result.data.createdAt).toEqual(today);
    expect(result.data.startedAt).toEqual(today);
    expect(result.data.metadata).toEqual({
      documentId: 'doc-1',
      fileName: 'test.pdf',
      userId: 'user-1',
    });
    expect(result.data.id).toBeDefined();
  });

  it<DbTestContext>('creates a job without metadata', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    const result = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'import-pdf',
    });

    if (!result.success) {
      expect.fail(`createFormJob failed: ${result.error}`);
    }

    expect(result.data.status).toBe('processing');
    expect(result.data.metadata).toBeUndefined();
  });

  it<DbTestContext>('creates jobs with different types', async ({ db }) => {
    const ctx = { db: db.ctx, formConfig: defaultFormConfig };

    const formResult = await addForm(ctx, testForm);
    if (!formResult.success) {
      expect.fail('addForm failed');
    }

    const validateResult = await createFormJob(ctx, {
      formId: formResult.data.id,
      jobType: 'validate-schema',
      metadata: {
        validatorVersion: '1.0',
        userId: 'user-1',
      },
    });

    if (!validateResult.success) {
      expect.fail('createFormJob failed');
    }

    expect(validateResult.data.jobType).toBe('validate-schema');
    expect(validateResult.data.metadata).toEqual({
      validatorVersion: '1.0',
      userId: 'user-1',
    });
  });
});

const testForm = {
  summary: { title: 'Test form', description: 'Test description' },
  root: 'root',
  patterns: { root: { type: 'sequence', id: 'root', data: { patterns: [] } } },
  outputs: [],
};
