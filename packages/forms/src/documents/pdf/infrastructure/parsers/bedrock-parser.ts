import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { generateObject } from 'ai';
import { success, failure } from '@flexion/forms-common';
import type { PdfParser } from '../../application/parser-interface.js';
import {
  ExtractedObject,
  type FieldMetadata,
  type ParseResult,
  type ParseError,
} from '../../domain/types.js';

/**
 * Configuration options for BedrockParser
 */
export type BedrockParserConfig = {
  modelId: string;
  region: string;
};

/**
 * System prompt for the LLM
 */
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
   - Use 'paragraph' for simple plain text instructions
   - Use 'rich_text' for formatted content (headings, lists, emphasis)
   - IMPORTANT: rich_text must use HTML format (h2, h3, p, ul, li, strong, etc.)
   - Place context BEFORE the related fields
   - Use fieldset legends to label grouped fields

4. USER-FRIENDLY LABELS
   - Convert technical field names to plain language
   - "Fst Name 1" → "First Name"
   - Add helpful hints where appropriate

5. LOGICAL GROUPING
   - Use fieldsets for related fields (e.g., name parts, address components)
   - Group by topic, not just by PDF page

6. CHECKBOX GROUPS
   - Use 'checkbox_group' for semantically related checkboxes
   - Examples: race options, interests, preferences, multi-select categories
   - Each checkbox option 'id' must be the EXACT field ID from PDF metadata
   - The group 'legend' should describe what the checkboxes represent
   - Individual 'checkbox' component is for standalone checkboxes only

7. RADIO GROUPS
   - CRITICAL: Radio group 'id' must be the EXACT field name from metadata
   - Do NOT simplify, clean, or modify the radio group ID
   - Example: If metadata shows "Ethnicity.undefined", use "Ethnicity.undefined" exactly
   - Radio option 'id' should follow pattern: {groupId}.{index}
   - Use numeric indices starting from 0 (e.g., "Ethnicity.0", "Ethnicity.1")
   - Radio option 'name' field must match the group 'id' exactly
   - The 'legend' field should be user-friendly, but 'id' must match metadata

8. FIELD ID PRESERVATION
   - CRITICAL: Use exact field IDs from the metadata for all input fields
   - The 'id' field must match the PDF field name exactly (including suffixes like .undefined)
   - Only the 'label' should be user-friendly`;

/**
 * Builds the user prompt with field metadata
 */
const buildPrompt = (fieldMetadata: FieldMetadata[]): string => {
  return `I'm providing:
1. A fillable PDF document (attached)
2. Metadata about PDF form fields (JSON below)

Your task: Create a guided interview structure following the schema.

CRITICAL REQUIREMENTS:
- Use the EXACT field IDs from the metadata. Do not modify, clean, or simplify them.
- For radio groups: The group 'id' must match the RadioGroup field name exactly (e.g., "Ethnicity.undefined")
- For radio options: Use numeric indices (e.g., "Ethnicity.0", "Ethnicity.1", not "Ethnicity.yes")
- For checkbox groups: Each option 'id' must match the individual CheckBox field name exactly
- Use plain language for all labels and legends.
- Be concise in all text fields (form summary, instructions, labels)

Field Metadata:
${JSON.stringify(fieldMetadata, null, 2)}

Please analyze the PDF and field metadata to create a well-organized guided interview structure that follows the design principles outlined in the system prompt.`;
};

/**
 * PDF parser implementation using AWS Bedrock (Claude via AI SDK)
 */
export class BedrockParser implements PdfParser {
  private readonly modelId: string;
  private readonly region: string;

  constructor(config: BedrockParserConfig) {
    this.modelId = config.modelId;
    this.region = config.region;
  }

  async parse(
    pdfBytes: Uint8Array,
    metadata: FieldMetadata[]
  ): Promise<ParseResult> {
    try {
      const bedrock = createAmazonBedrock({ region: this.region });
      const prompt = buildPrompt(metadata);

      const result = await generateObject({
        model: bedrock(this.modelId),
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
      console.error('Bedrock API error:', error);
      const parseError: ParseError = {
        code: 'PARSER_ERROR',
        message: 'Failed to parse PDF with Bedrock',
        details: error,
      };
      return failure(parseError);
    }
  }
}

/**
 * Factory function to create BedrockParser with default configuration
 */
export const createBedrockParser = (
  config?: Partial<BedrockParserConfig>
): BedrockParser => {
  return new BedrockParser({
    modelId:
      config?.modelId || 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
    region: config?.region || 'us-east-1',
  });
};
