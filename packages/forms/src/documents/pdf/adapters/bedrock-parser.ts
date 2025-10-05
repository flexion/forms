import { success, failure, type Result } from '@flexion/forms-common';
import type { PdfParser } from '../services/parser-interface.js';
import type { FieldMetadata, ParseError } from '../domain/types.js';
import { ExtractedFormSchema, type ExtractedForm } from '../domain/schema.js';
import type { LlmContext } from '../../../llm/services/context.js';
import { generateObjectCached } from '../../../llm/services/generate-object.js';
import {
  createBedrockModel,
  type BedrockConfig,
} from '../../../llm/providers/bedrock.js';


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
- Include EVERY field from the metadata - do not omit any fields
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
 * Extracts all field IDs from the parsed output by traversing the nested structure
 */
const extractFieldIds = (output: ExtractedForm): Set<string> => {
  const ids = new Set<string>();

  const processElement = (
    element: (typeof output.pages)[0]['elements'][0]
  ): void => {
    switch (element.component_type) {
      case 'text_input':
      case 'checkbox':
        ids.add(element.id);
        break;
      case 'checkbox_group':
        element.options.forEach(opt => ids.add(opt.id));
        break;
      case 'radio_group':
        ids.add(element.id);
        break;
      case 'fieldset':
        element.fields.forEach(field => ids.add(field.id));
        break;
      // paragraph and rich_text have no field IDs
    }
  };

  output.pages.forEach(page => {
    page.elements.forEach(processElement);
  });

  return ids;
};

/**
 * Finds fields from metadata that are missing in the parser output
 */
const findMissingFields = (
  metadata: FieldMetadata[],
  output: ExtractedForm
): FieldMetadata[] => {
  const outputIds = extractFieldIds(output);
  return metadata.filter(field => !outputIds.has(field.id));
};

/**
 * Adds missing fields to a fallback page in the output to ensure completeness
 */
const addMissingFieldsToOutput = (
  output: ExtractedForm,
  missingFields: FieldMetadata[]
): void => {
  if (missingFields.length === 0) return;

  // Find or create "Additional Information" page
  let additionalPage = output.pages.find(
    p => p.title === 'Additional Information'
  );

  if (!additionalPage) {
    additionalPage = {
      title: 'Additional Information',
      elements: [],
    };
    output.pages.push(additionalPage);
  }

  // Add context paragraph if this is a newly created page
  if (additionalPage.elements.length === 0) {
    additionalPage.elements.push({
      component_type: 'paragraph',
      text: 'The following fields were not categorized in the form structure:',
    });
  }

  // Add each missing field as a text input (safest default assumption)
  missingFields.forEach(field => {
    additionalPage!.elements.push({
      component_type: 'text_input',
      id: field.id,
      label: field.label || field.id,
      required: false,
    });
  });
};

/**
 * PDF parser using AWS Bedrock (Claude) via AI SDK.
 * Uses LLM context for automatic caching and provider management.
 */
export class BedrockParser implements PdfParser {
  private readonly model: ReturnType<typeof createBedrockModel>;
  private readonly llmContext: LlmContext;

  constructor(llmContext: LlmContext, config: Partial<BedrockConfig> = {}) {
    this.llmContext = llmContext;
    this.model = createBedrockModel(config);
  }

  async parse(
    pdfBytes: Uint8Array,
    metadata: FieldMetadata[]
  ): Promise<Result<ExtractedForm, ParseError>> {
    try {
      const prompt = buildPrompt(metadata);

      // Use cached generateObject from llm services
      const result = await generateObjectCached(this.llmContext, {
        model: this.model,
        schema: ExtractedFormSchema,
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

      // Extract and type the parsed object (schema ensures correct type)
      const parsedForm = result.object as ExtractedForm;

      // Validate that all fields from metadata are present in the output
      const missingFields = findMissingFields(metadata, parsedForm);
      if (missingFields.length > 0) {
        console.warn(
          `Parser omitted ${missingFields.length} field(s): ${missingFields.map(f => f.id).join(', ')}`
        );
        addMissingFieldsToOutput(parsedForm, missingFields);
      }

      return success(parsedForm);
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
 * Factory function to create BedrockParser with default configuration.
 * @deprecated Use `new BedrockParser(llmContext)` directly instead.
 */
export const createBedrockParser = (
  llmContext: LlmContext,
  config?: Partial<BedrockConfig>
): BedrockParser => {
  return new BedrockParser(llmContext, config);
};
