import * as z from 'zod';

import { type Result, failure, success } from '@flexion/forms-common';

import { BlueprintBuilder } from '../builder/index.js';
import { type InternalFormServiceContext } from '../context/index.js';
import type { FormSummary } from '../types.js';
import { base64ToUint8Array } from '../util/base64.js';

type InitializeFormError = {
  status: number;
  message: string;
};
type InitializeFormResult = {
  timestamp: string;
  id: string;
  jobId?: string;
  status: 'ready' | 'processing';
};

export type InitializeForm = (
  ctx: InternalFormServiceContext,
  opts:
    | unknown
    | {
        summary?: FormSummary;
        document?: { fileName: string; data: Uint8Array };
      }
) => Promise<Result<InitializeFormResult, InitializeFormError>>;

const base64 =
  /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;

const optionSchema = z.object({
  summary: z
    .object({
      title: z.string(),
      description: z.string(),
    })
    .optional(),
  document: z
    .object({
      fileName: z.string(),
      data: z
        .string()
        .refine(value => base64.test(value), {
          message: 'Invalid base64 string',
        })
        .transform(value => base64ToUint8Array(value)),
    })
    .optional(),
});

/**
 * Asynchronously initializes a new form based on the provided context and options.
 * If a document is provided, creates the form immediately and processes the PDF asynchronously.
 * Otherwise, creates a form with the provided summary.
 */
export const initializeForm: InitializeForm = async (ctx, opts) => {
  if (!ctx.isUserLoggedIn()) {
    return failure({
      status: 401,
      message: 'You must be logged in to initialize a new form',
    });
  }

  const parseResult = optionSchema.safeParse(opts);
  if (!parseResult.success) {
    console.error('Invalid options:', parseResult.error);
    return failure({
      status: 400,
      message: 'Invalid options',
    });
  }
  const { document, summary } = parseResult.data;

  // Create empty blueprint
  const builder = new BlueprintBuilder(ctx.config);

  if (summary) {
    builder.setFormSummary(summary);
  } else if (document) {
    builder.setFormSummary({
      title: document.fileName,
      description: '',
    });
  }

  // Step 1: Create form in database (empty, draft state)
  const formResult = await ctx.repository.addForm(builder.form);
  if (!formResult.success) {
    console.error('Failed to add form:', formResult.error);
    return failure({
      status: 500,
      message: formResult.error,
    });
  }

  const formId = formResult.data.id;

  // Step 2: If document provided, store it and initiate async processing
  if (document !== undefined) {
    const fileName = document.fileName.split('/').pop() || 'my-form.pdf';

    // Store document (without extract, will be filled by job processing)
    const addDocumentResult = await ctx.repository.addDocument({
      fileName,
      data: document.data,
      extract: undefined,
    });

    if (!addDocumentResult.success) {
      return failure({
        status: 500,
        message: `Failed to add document: ${addDocumentResult.error}`,
      });
    }

    const documentId = addDocumentResult.data.id;

    // Create job record (status: 'processing')
    const jobResult = await ctx.repository.createFormJob({
      formId,
      jobType: 'import-pdf',
      metadata: {
        documentId,
        fileName,
        userId: ctx.getUserId?.() || 'system',
      },
    });

    if (!jobResult.success) {
      return failure({
        status: 500,
        message: 'Failed to create processing job',
      });
    }

    const job = jobResult.data;

    // Step 3: Fire async processing (don't await!)
    processFormDocumentAsync(ctx, formId, job.id, documentId).catch(err => {
      console.error('Async form processing failed:', err);
      // Error already logged to database by processFormDocumentAsync
    });

    // Step 4: Return immediately
    return success({
      id: formId,
      timestamp: formResult.data.timestamp,
      jobId: job.id,
      status: 'processing',
    });
  }

  // No document, form is ready immediately
  return success({
    id: formId,
    timestamp: formResult.data.timestamp,
    status: 'ready',
  });
};

/**
 * Async function that processes PDF and updates form + job.
 * Runs in background, not awaited by HTTP request.
 */
async function processFormDocumentAsync(
  ctx: InternalFormServiceContext,
  formId: string,
  jobId: string,
  documentId: string
): Promise<void> {
  try {
    // Get document data
    const documentResult = await ctx.repository.getDocument(documentId);
    if (!documentResult.success) {
      await ctx.repository.failFormJob(jobId, {
        message: `Document not found: ${documentResult.error}`,
      });
      return;
    }

    // Parse PDF via Bedrock
    const parsePdfResult = await ctx.parsePdf(documentResult.data.data);
    const { parsedPdf, fields } = parsePdfResult;

    // Get current form
    const formResult = await ctx.repository.getForm(formId);
    if (!formResult.success || !formResult.data) {
      await ctx.repository.failFormJob(jobId, {
        message: 'Form not found',
      });
      return;
    }

    // Build updated form with parsed patterns
    const builder = new BlueprintBuilder(ctx.config, formResult.data);

    // Update summary from parsed PDF
    builder.setFormSummary({
      title: parsedPdf.title || documentResult.data.path || 'Untitled',
      description: parsedPdf.description || '',
    });

    // Add document reference
    await builder.addDocumentRef({
      id: documentId,
      extract: parsedPdf,
    });

    // Save updated form
    const saveResult = await ctx.repository.saveForm(formId, builder.form);
    if (!saveResult.success) {
      await ctx.repository.failFormJob(jobId, {
        message: `Failed to save form: ${saveResult.error}`,
      });
      return;
    }

    // Mark job as completed
    await ctx.repository.completeFormJob(jobId, {
      patternsAdded: Object.keys(builder.form.patterns).length,
      fieldsExtracted: Object.keys(fields).length,
      documentId,
    });

    console.log(`Form ${formId} processed successfully`);
  } catch (err) {
    // Catch any unexpected errors
    console.error('Unexpected error in processFormDocumentAsync:', err);
    await ctx.repository.failFormJob(jobId, {
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
  }
}
