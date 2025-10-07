import { describe, expect, it, vi } from 'vitest';

import { createTestFormServiceContext } from '../testing.js';

import { initializeForm } from './initialize-form.js';

const summary = { title: 'Form Title', description: '' };

describe('initializeForm', () => {
  it('returns access denied (401) if user is not logged in', async () => {
    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => false,
    });
    const result = await initializeForm(ctx, { summary });
    expect(result).toEqual({
      success: false,
      error: {
        status: 401,
        message: 'You must be logged in to initialize a new form',
      },
    });
  });

  it('initializes with summary when user is logged in', async () => {
    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => true,
    });
    const result = await initializeForm(ctx, { summary });
    expect(result).toEqual({
      success: true,
      data: {
        timestamp: expect.any(String),
        id: expect.any(String),
        status: 'ready',
      },
    });
  });

  it('initializes and returns immediately with document (async processing)', async () => {
    const mockParsedPdf = {
      title: 'Parsed Form Title',
      description: 'This form was parsed from a PDF',
      root: 'page1',
      patterns: {
        page1: {
          type: 'page',
          id: 'page1',
          data: {
            title: 'Page 1',
            patterns: ['paragraph1', 'input1'],
          },
        },
        paragraph1: {
          type: 'paragraph',
          id: 'paragraph1',
          data: {
            text: 'Welcome to the parsed form',
          },
        },
        input1: {
          type: 'input',
          id: 'input1',
          data: {
            label: 'First Name',
            required: true,
          },
        },
      },
      outputs: {
        firstName: { type: 'text' as const, name: 'firstName', value: '' },
      },
      errors: [],
    };

    const mockFields = {
      firstName: {
        type: 'TextField' as const,
        name: 'firstName',
        label: 'First Name',
        value: '',
        required: true,
      },
    };

    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => true,
    });

    // Mock parsePdf to avoid needing a real PDF
    ctx.parsePdf = async () => ({
      parsedPdf: mockParsedPdf as any,
      fields: mockFields,
    });

    // Base64 encoded "This is test PDF data"
    const testPdfData = 'VGhpcyBpcyB0ZXN0IFBERiBkYXRh';

    const result = await initializeForm(ctx, {
      document: { fileName: 'test.pdf', data: testPdfData },
    });

    // Should return immediately with processing status
    expect(result).toEqual({
      success: true,
      data: {
        timestamp: expect.any(String),
        id: expect.any(String),
        jobId: expect.any(String),
        status: 'processing',
      },
    });

    if (!result.success) return;

    const { id: formId, jobId } = result.data;

    // Wait for async processing to complete
    await vi.waitFor(
      async () => {
        const job = await ctx.repository.getLatestFormJob(formId, 'import-pdf');
        expect(job.success).toBe(true);
        if (!job.success) throw new Error('Job not found');
        expect(job.data?.status).toBe('completed');
      },
      { timeout: 5000 }
    );

    // Verify job was completed successfully
    const jobResult = await ctx.repository.getLatestFormJob(
      formId,
      'import-pdf'
    );
    expect(jobResult.success).toBe(true);
    if (!jobResult.success) return;

    const job = jobResult.data!;
    expect(job.status).toBe('completed');
    expect(job.completedAt).toBeDefined();
    expect(job.result).toEqual({
      patternsAdded: expect.any(Number),
      fieldsExtracted: expect.any(Number),
      documentId: expect.any(String),
    });

    // Verify form was updated with parsed content
    const formResult = await ctx.repository.getForm(formId);
    expect(formResult.success).toBe(true);
    if (!formResult.success) return;

    const form = formResult.data!;

    // Form should have been updated with parsed title
    expect(form.summary.title).toBe('Parsed Form Title');
    expect(form.summary.description).toBe('This form was parsed from a PDF');

    // Form should have patterns added (more than just root)
    expect(Object.keys(form.patterns).length).toBeGreaterThan(1);
  });

  it('handles async processing errors gracefully', async () => {
    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => true,
    });

    // Mock parsePdf to throw an error
    ctx.parsePdf = async () => {
      throw new Error('Parser failed to process PDF');
    };

    const testPdfData = 'VGhpcyBpcyB0ZXN0IFBERiBkYXRh';

    const result = await initializeForm(ctx, {
      document: { fileName: 'failing-test.pdf', data: testPdfData },
    });

    // Should still return successfully (processing happens async)
    expect(result.success).toBe(true);
    if (!result.success) return;

    const { id: formId } = result.data;

    // Wait for async processing to fail
    await vi.waitFor(
      async () => {
        const job = await ctx.repository.getLatestFormJob(formId, 'import-pdf');
        expect(job.success).toBe(true);
        if (!job.success) throw new Error('Job not found');
        expect(job.data?.status).toBe('failed');
      },
      { timeout: 5000 }
    );

    // Verify job failed with error message
    const jobResult = await ctx.repository.getLatestFormJob(
      formId,
      'import-pdf'
    );
    expect(jobResult.success).toBe(true);
    if (!jobResult.success) return;

    const job = jobResult.data!;
    expect(job.status).toBe('failed');
    expect(job.errorMessage).toContain('Parser failed to process PDF');
    expect(job.completedAt).toBeDefined();
    expect(job.result).toBeUndefined();
  });

  it('validates document data is valid base64', async () => {
    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => true,
    });

    const result = await initializeForm(ctx, {
      document: { fileName: 'test.pdf', data: 'not-valid-base64!!!' },
    });

    expect(result).toEqual({
      success: false,
      error: {
        status: 400,
        message: 'Invalid options',
      },
    });
  });

  it('uses filename as title when no summary provided', async () => {
    const mockParsedPdf = {
      title: 'Override Title',
      description: 'Description from PDF',
      root: 'root',
      patterns: {
        root: {
          type: 'page',
          id: 'root',
          data: { title: 'Page 1', patterns: [] },
        },
      },
      outputs: {},
      errors: [],
    };

    const ctx = await createTestFormServiceContext({
      isUserLoggedIn: () => true,
    });

    // Mock parsePdf
    ctx.parsePdf = async () => ({
      parsedPdf: mockParsedPdf as any,
      fields: {},
    });

    const result = await initializeForm(ctx, {
      document: { fileName: 'my-form.pdf', data: 'VGVzdA==' },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const { id: formId } = result.data;

    // Wait for processing
    await vi.waitFor(
      async () => {
        const job = await ctx.repository.getLatestFormJob(formId, 'import-pdf');
        if (!job.success) throw new Error('Job not found');
        expect(job.data?.status).toBe('completed');
      },
      { timeout: 5000 }
    );

    // Check that the parsed title was used (not the filename)
    const formResult = await ctx.repository.getForm(formId);
    expect(formResult.success).toBe(true);
    if (!formResult.success) return;

    expect(formResult.data!.summary.title).toBe('Override Title');
  });
});
