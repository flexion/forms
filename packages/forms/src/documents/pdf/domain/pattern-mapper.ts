import { success, failure, type Result } from '@flexion/forms-common';
import { PagePattern } from '../../../patterns/page/config.js';
import { PageSetPattern } from '../../../patterns/page-set/config.js';
import { type DocumentFieldMap } from '../../types.js';
import {
  createPattern,
  FormConfig,
  Pattern,
  PatternId,
  PatternMap,
} from '../../../pattern.js';
import { FormErrors } from '../../../error.js';
import type { ParseError } from './types.js';
import type { BedrockExtractedObject } from '../parsers/bedrock/schema.js';
import {
  mapTextInput,
  mapCheckbox,
  mapCheckboxGroup,
  mapRadioGroup,
  mapParagraph,
  mapRichText,
  mapFieldset,
  type MappingContext,
} from '../parsers/bedrock/mapper.js';

/**
 * Result type for parsed PDF with patterns
 */
export type ParsedPdf = {
  patterns: PatternMap;
  errors: {
    type: Pattern['type'];
    data: Pattern['data'];
    errors: FormErrors;
  }[];
  outputs: DocumentFieldMap;
  root: PatternId;
  title: string;
  description: string;
};

/**
 * Maps a BedrockExtractedObject to internal pattern representation.
 * This is a pure domain function with no external dependencies.
 *
 * @param config - Form configuration (pattern definitions)
 * @param extracted - Parsed form structure from Bedrock LLM
 * @returns Result containing ParsedPdf or error
 */
export const mapExtractedObjectToPatterns = (
  config: FormConfig,
  extracted: BedrockExtractedObject
): Result<ParsedPdf, ParseError> => {
  try {
    const parsedPdf: ParsedPdf = {
      patterns: {},
      errors: [],
      outputs: {},
      root: 'root',
      title: extracted.form_summary.title || 'Default Form Title',
      description:
        extracted.form_summary.description || 'Default Form Description',
    };

    // Create mapping context with helper functions
    const context: MappingContext = {
      config,
      processPattern: (type, data, id) =>
        processPatternData(config, parsedPdf, type, data, id),
    };

    // Process form summary
    processPatternData(config, parsedPdf, 'form-summary', {
      title: extracted.form_summary.title || 'Default Form Title',
      description:
        extracted.form_summary.description || 'Default Form Description',
    });

    // Process each page
    const pageIds: PatternId[] = [];
    for (const page of extracted.pages) {
      const pageElementIds: PatternId[] = [];

      // Process elements within the page
      for (const element of page.elements) {
        let result;

        // Map each element type using extracted functions
        switch (element.component_type) {
          case 'paragraph':
            result = mapParagraph(element, context);
            if (result.pattern) {
              pageElementIds.push(result.pattern.id);
            }
            break;

          case 'rich_text':
            result = mapRichText(element, context);
            if (result.pattern) {
              pageElementIds.push(result.pattern.id);
            }
            break;

          case 'checkbox':
            result = mapCheckbox(element, context);
            if (result.pattern) {
              pageElementIds.push(result.pattern.id);
              if (result.output) {
                parsedPdf.outputs[result.output[0]] = result.output[1];
              }
            }
            break;

          case 'checkbox_group':
            // Checkbox group returns a fieldset, but outputs are handled separately
            result = mapCheckboxGroup(element, context);
            if (result.pattern) {
              pageElementIds.push(result.pattern.id);
              // Map outputs for each checkbox in the group
              for (const option of element.options) {
                const checkboxResult = mapCheckbox(
                  {
                    component_type: 'checkbox',
                    id: option.id,
                    label: option.label,
                    default_checked: option.default_checked,
                  },
                  context
                );
                if (checkboxResult.output) {
                  parsedPdf.outputs[checkboxResult.output[0]] =
                    checkboxResult.output[1];
                }
              }
            }
            break;

          case 'radio_group':
            result = mapRadioGroup(element, context);
            if (result.pattern) {
              pageElementIds.push(result.pattern.id);
              if (result.output) {
                parsedPdf.outputs[result.output[0]] = result.output[1];
              }
            }
            break;

          case 'fieldset':
            result = mapFieldset(element, context);
            if (result.pattern) {
              pageElementIds.push(result.pattern.id);
              // Map outputs for each field in the fieldset
              for (const field of element.fields) {
                let fieldResult;
                if (field.component_type === 'text_input') {
                  fieldResult = mapTextInput(field, context);
                } else if (field.component_type === 'checkbox') {
                  fieldResult = mapCheckbox(field, context);
                }
                if (fieldResult?.output) {
                  parsedPdf.outputs[fieldResult.output[0]] =
                    fieldResult.output[1];
                }
              }
            }
            break;
        }
      }

      // Create page pattern with title from schema
      const pagePattern = processPatternData<PagePattern>(
        config,
        parsedPdf,
        'page',
        {
          title: page.title,
          patterns: pageElementIds,
        },
        undefined
      );
      if (pagePattern) {
        pageIds.push(pagePattern.id);
      }
    }

    // Assign the pages to the root page set
    const rootPattern = processPatternData<PageSetPattern>(
      config,
      parsedPdf,
      'page-set',
      {
        pages: pageIds,
      },
      'root'
    );
    if (rootPattern) {
      parsedPdf.patterns['root'] = rootPattern;
    }

    return success(parsedPdf);
  } catch (error) {
    const parseError: ParseError = {
      code: 'PATTERN_MAPPING_ERROR',
      message: 'Failed to map extracted object to patterns',
      details: error,
    };
    return failure(parseError);
  }
};

/**
 * Helper function to create and register a pattern.
 * Accumulates errors if pattern creation fails.
 */
const processPatternData = <T extends Pattern>(
  config: FormConfig,
  parsedPdf: ParsedPdf,
  patternType: T['type'],
  patternData: T['data'],
  patternId?: PatternId
): T | undefined => {
  const result = createPattern<T>(config, patternType, patternData, patternId);
  if (!result.success) {
    parsedPdf.errors.push({
      type: patternType,
      data: patternData,
      errors: result.error,
    });
    return undefined;
  }
  parsedPdf.patterns[result.data.id] = result.data;
  return result.data;
};
