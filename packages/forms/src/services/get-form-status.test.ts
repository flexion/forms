import { describe, expect, it } from 'vitest';

import { createForm } from '../index.js';
import { createTestFormServiceContext } from '../testing.js';
import { getFormStatus } from './get-form-status.js';

const TEST_FORM = createForm({ title: 'Form Title', description: '' });

const TEST_FORM_WITH_PATTERNS = {
  summary: { title: 'Test form', description: 'Test description' },
  root: 'root',
  patterns: {
    root: { type: 'sequence', id: 'root', data: { patterns: ['page1'] } },
    page1: {
      type: 'page',
      id: 'page1',
      data: { title: 'Page 1', patterns: [] },
    },
  },
  outputs: [],
};

describe('getFormStatus', () => {
  it('returns 404 for non-existent form', async () => {
    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => false,
    });

    const result = await getFormStatus(ctx, 'non-existent-id');

    expect(result).toEqual({
      success: false,
      error: {
        status: 404,
        message: 'Form not found',
      },
    });
  });

  it('returns draft status for empty form with no job', async () => {
    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => false,
    });

    const addResult = await ctx.repository.addForm(TEST_FORM);
    if (!addResult.success) {
      expect.fail('Failed to add form');
    }

    const result = await getFormStatus(ctx, addResult.data.id);

    if (!result.success) {
      expect.fail(`Failed to get form status: ${JSON.stringify(result.error)}`);
    }

    expect(result.data.formStatus).toBe('draft');
    expect(result.data.latestJob).toBeUndefined();
  });

  it('returns ready status for form with patterns and no job', async () => {
    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => false,
    });

    const addResult = await ctx.repository.addForm(TEST_FORM_WITH_PATTERNS);
    if (!addResult.success) {
      expect.fail('Failed to add form');
    }

    const result = await getFormStatus(ctx, addResult.data.id);

    if (!result.success) {
      expect.fail(`Failed to get form status: ${JSON.stringify(result.error)}`);
    }

    expect(result.data.formStatus).toBe('ready');
    expect(result.data.latestJob).toBeUndefined();
  });

  it('returns draft status when job is processing (race condition fix)', async () => {
    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => false,
    });

    // Create form with patterns (simulating mid-processing state where patterns exist)
    const addResult = await ctx.repository.addForm(TEST_FORM_WITH_PATTERNS);
    if (!addResult.success) {
      expect.fail('Failed to add form');
    }

    // Create a processing job
    const jobResult = await ctx.repository.createFormJob({
      formId: addResult.data.id,
      jobType: 'import-pdf',
      metadata: {
        documentId: 'doc-1',
        fileName: 'test.pdf',
        userId: 'user-1',
      },
    });
    if (!jobResult.success) {
      expect.fail('Failed to create job');
    }

    // Get form status - should be 'draft' even though patterns exist
    // because the job is still processing
    const result = await getFormStatus(ctx, addResult.data.id);

    if (!result.success) {
      expect.fail(`Failed to get form status: ${JSON.stringify(result.error)}`);
    }

    // Key assertion: form status should be 'draft' because job is still processing
    expect(result.data.formStatus).toBe('draft');
    expect(result.data.latestJob).toBeDefined();
    expect(result.data.latestJob?.status).toBe('processing');
  });

  it('returns ready status after job completes successfully', async () => {
    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => false,
    });

    // Create form
    const addResult = await ctx.repository.addForm(TEST_FORM);
    if (!addResult.success) {
      expect.fail('Failed to add form');
    }

    // Create and complete a job
    const jobResult = await ctx.repository.createFormJob({
      formId: addResult.data.id,
      jobType: 'import-pdf',
      metadata: {
        documentId: 'doc-1',
        fileName: 'test.pdf',
        userId: 'user-1',
      },
    });
    if (!jobResult.success) {
      expect.fail('Failed to create job');
    }

    // Add patterns to form (simulating job completion)
    await ctx.repository.saveForm(
      addResult.data.id,
      TEST_FORM_WITH_PATTERNS as any
    );

    // Complete the job
    await ctx.repository.completeFormJob(jobResult.data.id, {
      patternsAdded: 1,
      fieldsExtracted: 5,
      documentId: 'doc-1',
    });

    // Get form status - should be 'ready' now
    const result = await getFormStatus(ctx, addResult.data.id);

    if (!result.success) {
      expect.fail(`Failed to get form status: ${JSON.stringify(result.error)}`);
    }

    expect(result.data.formStatus).toBe('ready');
    expect(result.data.latestJob).toBeDefined();
    expect(result.data.latestJob?.status).toBe('completed');
  });

  it('returns draft status when job fails', async () => {
    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => false,
    });

    // Create form
    const addResult = await ctx.repository.addForm(TEST_FORM);
    if (!addResult.success) {
      expect.fail('Failed to add form');
    }

    // Create and fail a job
    const jobResult = await ctx.repository.createFormJob({
      formId: addResult.data.id,
      jobType: 'import-pdf',
      metadata: {
        documentId: 'doc-1',
        fileName: 'test.pdf',
        userId: 'user-1',
      },
    });
    if (!jobResult.success) {
      expect.fail('Failed to create job');
    }

    await ctx.repository.failFormJob(jobResult.data.id, {
      message: 'Processing failed',
    });

    // Get form status - should be 'draft' because no patterns and job failed
    const result = await getFormStatus(ctx, addResult.data.id);

    if (!result.success) {
      expect.fail(`Failed to get form status: ${JSON.stringify(result.error)}`);
    }

    expect(result.data.formStatus).toBe('draft');
    expect(result.data.latestJob).toBeDefined();
    expect(result.data.latestJob?.status).toBe('failed');
    expect(result.data.latestJob?.errorMessage).toBe('Processing failed');
  });
});
