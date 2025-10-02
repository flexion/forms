import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { type Result, success, failure } from '@flexion/forms-common';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { uint8ArrayToBase64 } from '../../util/base64.js';
import { getDocumentFieldData } from './extract.js';
import { ExtractedObject } from './parsing-api.js';

// Configuration
export type BedrockParserOptions = {
  modelId?: string;
  region?: string;
  client?: BedrockRuntimeClient;
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

Guided Interview Design Principles:

1. PROGRESSIVE DISCLOSURE
   - Break long forms into multiple pages (aim for 5-8 fields per page)
   - Group related information together
   - Order pages logically (personal info → specific details → review)

2. CLEAR CONTEXT
   - Use 'paragraph' or 'rich_text' elements to provide instructions
   - Place context BEFORE the related fields
   - Use fieldset legends to label grouped fields

3. USER-FRIENDLY LABELS
   - Convert technical field names to plain language
   - "Fst Name 1" → "First Name"
   - Add helpful hints where appropriate

4. LOGICAL GROUPING
   - Use fieldsets for related fields (e.g., name parts, address components)
   - Group by topic, not just by PDF page

5. FIELD ID PRESERVATION
   - CRITICAL: Use exact field IDs from the metadata
   - The 'id' field must match the PDF field name exactly
   - Only the 'label' should be user-friendly

6. PAGE ORGANIZATION
   - Page 0: Introduction, form summary, high-level instructions
   - Page 1-N: Logical sections of the form
   - Final page: Declarations, signatures, submission info

Return only valid JSON matching the provided schema. Do not include any explanatory text outside the JSON structure.`;

// User prompt template
const buildPrompt = (fieldMetadata: FieldMetadata[]): string => {
  const jsonSchema = zodToJsonSchema(ExtractedObject, {
    name: 'ExtractedObject',
    $refStrategy: 'none',
  });

  return `I'm providing:
1. A fillable PDF document (attached)
2. Metadata about PDF form fields (JSON below)

Your task: Create a guided interview structure following the schema.

CRITICAL: Use the exact field IDs from the metadata. Do not modify them.

Field Metadata:
${JSON.stringify(fieldMetadata, null, 2)}

Schema Definition:
${JSON.stringify(jsonSchema, null, 2)}

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

// Invoke Bedrock with PDF
const invokeBedrockWithPdf = async (
  client: BedrockRuntimeClient,
  modelId: string,
  pdfBytes: Uint8Array,
  prompt: string
): Promise<Result<string, BedrockParserError>> => {
  try {
    const base64Pdf = await uint8ArrayToBase64(pdfBytes);

    const request = {
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Pdf,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        system: SYSTEM_PROMPT,
      }),
    };

    const command = new InvokeModelCommand(request);
    const response = await client.send(command);
    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body)
    );

    return success(responseBody.content[0].text);
  } catch (error) {
    console.error(error);
    return failure({
      code: 'BEDROCK_API_ERROR',
      message: 'Failed to invoke Bedrock API',
      details: error,
    });
  }
};

// Validate and parse LLM response
const validateAndParse = (
  llmResponse: string
): Result<ExtractedObject, BedrockParserError> => {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = llmResponse.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : llmResponse;

    const parsed = JSON.parse(jsonStr);

    // Validate using existing Zod schema
    const result = ExtractedObject.safeParse(parsed);
    if (!result.success) {
      return failure({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: 'LLM output does not match ExtractedObject schema',
        details: result.error,
      });
    }

    return success(result.data);
  } catch (error) {
    return failure({
      code: 'SCHEMA_VALIDATION_ERROR',
      message: 'Failed to parse LLM response as JSON',
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
    options?.modelId ||
    'us.anthropic.claude-sonnet-4-5-20250929-v1:0';

  // Use provided client or create new one
  // AWS SDK will pick up credentials from environment automatically
  const client = options?.client || new BedrockRuntimeClient({
    region: options?.region || 'us-east-1',
  });

  // Extract field metadata
  const metadataResult = await extractFieldMetadata(pdfBytes);
  if (!metadataResult.success) {
    return metadataResult;
  }

  // Build prompt
  const prompt = buildPrompt(metadataResult.data);

  // Invoke Bedrock
  const invokeResult = await invokeBedrockWithPdf(
    client,
    modelId,
    pdfBytes,
    prompt
  );
  if (!invokeResult.success) {
    return invokeResult;
  }

  // Validate and parse response
  return validateAndParse(invokeResult.data);
};

// Export the Zod schema for testing
export { ExtractedObject };
