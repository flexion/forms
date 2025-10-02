import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { generateObject } from 'ai';
import { type Result, success, failure } from '@flexion/forms-common';

import { getDocumentFieldData } from './extract.js';
import { ExtractedObject } from './parser-schema.js';

// Configuration
export type BedrockParserOptions = {
  modelId?: string;
  region?: string;
};

// Error types
export type BedrockParserError = {
  code:
    | 'BEDROCK_API_ERROR'
    | 'INVALID_PDF'
    | 'SCHEMA_VALIDATION_ERROR'
    | 'FIELD_MISMATCH_ERROR';
  message: string;
  details?: any;
};

// Internal types
type FieldMetadata = {
  id: string;
  type: string;
  label: string;
  instructions?: string;
  page: number;
};

// System prompt
const SYSTEM_PROMPT = `You are a forms architecture expert specializing in guided interviews.

Your task is to convert fillable PDF forms into multi-page guided interview structures that provide a better user experience through progressive disclosure and clear organization.

IMPORTANT: Focus on producing the structured output efficiently. Keep descriptions concise and avoid verbose summaries.

Guided Interview Design Principles:

1. PAGE STRUCTURE
   - Organize content into logical pages (aim for 5-8 fields per page)
   - Give each page a SHORT, DESCRIPTIVE title in plain language
   - Page titles should be suitable for navigation (e.g., "Personal Information", "Contact Details", "Employment History")
   - Page 0: Introduction with form summary and high-level instructions
   - Pages 1-N: Logical sections of the form
   - Final page: Declarations, signatures, submission info

2. PROGRESSIVE DISCLOSURE
   - Break long forms into multiple pages
   - Group related information together within pages
   - Order pages logically (personal info → specific details → review)

3. CLEAR CONTEXT
   - Use 'paragraph' or 'rich_text' elements to provide instructions
   - Place context BEFORE the related fields
   - Use fieldset legends to label grouped fields

4. USER-FRIENDLY LABELS
   - Convert technical field names to plain language
   - "Fst Name 1" → "First Name"
   - Add helpful hints where appropriate

5. LOGICAL GROUPING
   - Use fieldsets for related fields (e.g., name parts, address components)
   - Group by topic, not just by PDF page

6. FIELD ID PRESERVATION
   - CRITICAL: Use exact field IDs from the metadata
   - The 'id' field must match the PDF field name exactly
   - Only the 'label' should be user-friendly`;

// User prompt template
const buildPrompt = (fieldMetadata: FieldMetadata[]): string => {
  return `I'm providing:
1. A fillable PDF document (attached)
2. Metadata about PDF form fields (JSON below)

Your task: Create a guided interview structure following the schema.

CRITICAL REQUIREMENTS:
- Use the exact field IDs from the metadata. Do not modify them.
- Use plain language.
- Be concise in all text fields (form summary, instructions, labels)
Field Metadata:
${JSON.stringify(fieldMetadata, null, 2)}

Please analyze the PDF and field metadata to create a well-organized guided interview structure that follows the design principles outlined in the system prompt.`;
};

// Extract field metadata from PDF
const extractFieldMetadata = async (
  pdfBytes: Uint8Array
): Promise<Result<FieldMetadata[], BedrockParserError>> => {
  try {
    const documentFields = await getDocumentFieldData(pdfBytes);

    const metadata: FieldMetadata[] = [];
    for (const field of Object.values(documentFields)) {
      if (field.type !== 'not-supported') {
        metadata.push({
          id: field.name,
          type: field.type,
          label: field.label,
          instructions: '',
          page: 0,
        });
      }
    }

    return success(metadata);
  } catch (error) {
    return failure({
      code: 'INVALID_PDF',
      message: 'Failed to extract field metadata from PDF',
      details: error,
    });
  }
};

// Invoke Bedrock with PDF using AI SDK
const invokeBedrockWithPdf = async (
  modelId: string,
  region: string,
  pdfBytes: Uint8Array,
  prompt: string
): Promise<Result<ExtractedObject, BedrockParserError>> => {
  try {
    const bedrock = createAmazonBedrock({ region });

    const result = await generateObject({
      model: bedrock(modelId),
      schema: ExtractedObject,
      schemaName: 'GuidedInterviewForm',
      schemaDescription:
        'A structured guided interview form with multiple pages and organized elements',
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: pdfBytes,
              mediaType: 'application/pdf',
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    return success(result.object);
  } catch (error) {
    console.error(error);
    return failure({
      code: 'BEDROCK_API_ERROR',
      message: 'Failed to invoke Bedrock API',
      details: error,
    });
  }
};

// Main entry point
export const parseWithBedrock = async (
  pdfBytes: Uint8Array,
  options?: BedrockParserOptions
): Promise<Result<ExtractedObject, BedrockParserError>> => {
  const modelId =
    options?.modelId || 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';
  const region = options?.region || 'us-east-1';

  // Extract field metadata
  const metadataResult = await extractFieldMetadata(pdfBytes);
  if (!metadataResult.success) {
    return metadataResult;
  }

  // Build prompt
  const prompt = buildPrompt(metadataResult.data);

  // Invoke Bedrock (AI SDK handles validation automatically)
  return await invokeBedrockWithPdf(modelId, region, pdfBytes, prompt);
};

// Export the Zod schema for testing
export { ExtractedObject };
