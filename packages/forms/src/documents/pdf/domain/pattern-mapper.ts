import { success, failure, type Result } from '@flexion/forms-common';
import { type FieldsetPattern } from '../../../patterns/fieldset/config.js';
import { type InputPattern } from '../../../patterns/input/config.js';
import { PagePattern } from '../../../patterns/page/config.js';
import { PageSetPattern } from '../../../patterns/page-set/config.js';
import { type ParagraphPattern } from '../../../patterns/paragraph.js';
import { type CheckboxPattern } from '../../../patterns/checkbox.js';
import { type RadioGroupPattern } from '../../../patterns/radio-group.js';
import { RichTextPattern } from '../../../patterns/rich-text.js';
import { type DocumentFieldMap } from '../../types.js';
import {
  createPattern,
  FormConfig,
  Pattern,
  PatternId,
  PatternMap,
} from '../../../pattern.js';
import { FormErrors } from '../../../error.js';
import type { ExtractedObject, ParseError } from './types.js';

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
 * Maps an ExtractedObject (from LLM/parser) to internal pattern representation.
 * This is a pure domain function with no external dependencies.
 *
 * @param config - Form configuration (pattern definitions)
 * @param extracted - Parsed form structure from LLM
 * @returns Result containing ParsedPdf or error
 */
export const mapExtractedObjectToPatterns = (
  config: FormConfig,
  extracted: ExtractedObject
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

    // Process form summary
    processPatternData(config, parsedPdf, 'form-summary', {
      title: extracted.form_summary.title || 'Default Form Title',
      description:
        extracted.form_summary.description || 'Default Form Description',
    });

    // Process each page
    const pageIds: PatternId[] = [];
    for (let pageIdx = 0; pageIdx < extracted.pages.length; pageIdx++) {
      const page = extracted.pages[pageIdx];
      const pageElementIds: PatternId[] = [];

      // Process elements within the page
      for (const element of page.elements) {
        const fieldsetPatterns: PatternId[] = [];

        // Add paragraph elements
        if (element.component_type === 'paragraph') {
          const paragraph = processPatternData<ParagraphPattern>(
            config,
            parsedPdf,
            'paragraph',
            {
              text: element.text,
            }
          );
          if (paragraph) {
            pageElementIds.push(paragraph.id);
          }
          continue;
        }

        if (element.component_type === 'rich_text') {
          const richText = processPatternData<RichTextPattern>(
            config,
            parsedPdf,
            'rich-text',
            {
              text: element.text,
            }
          );
          if (richText) {
            pageElementIds.push(richText.id);
          }
          continue;
        }

        if (element.component_type === 'checkbox') {
          const checkboxPattern = processPatternData<CheckboxPattern>(
            config,
            parsedPdf,
            'checkbox',
            {
              label: element.label,
              defaultChecked: element.default_checked,
            }
          );
          if (checkboxPattern) {
            pageElementIds.push(checkboxPattern.id);
            parsedPdf.outputs[checkboxPattern.id] = {
              type: 'CheckBox',
              name: element.id,
              label: element.label,
              value: false,
              required: true,
            };
          }
          continue;
        }

        if (element.component_type === 'checkbox_group') {
          // Process each checkbox in the group
          const checkboxPatternIds: PatternId[] = [];
          for (const option of element.options) {
            const checkboxPattern = processPatternData<CheckboxPattern>(
              config,
              parsedPdf,
              'checkbox',
              {
                label: option.label,
                defaultChecked: option.default_checked,
              }
            );
            if (checkboxPattern) {
              checkboxPatternIds.push(checkboxPattern.id);
              parsedPdf.outputs[checkboxPattern.id] = {
                type: 'CheckBox',
                name: option.id,
                label: option.label,
                value: false,
                required: true,
              };
            }
          }
          // Wrap checkboxes in a fieldset
          if (checkboxPatternIds.length > 0) {
            const fieldset = processPatternData<FieldsetPattern>(
              config,
              parsedPdf,
              'fieldset',
              {
                legend: element.legend,
                patterns: checkboxPatternIds,
              }
            );
            if (fieldset) {
              pageElementIds.push(fieldset.id);
            }
          }
          continue;
        }

        if (element.component_type === 'radio_group') {
          const radioGroupPattern = processPatternData<RadioGroupPattern>(
            config,
            parsedPdf,
            'radio-group',
            {
              label: element.legend,
              hint: '',
              options: element.options.map(option => ({
                id: option.id,
                label: option.label,
                name: option.name,
                defaultChecked: option.default_checked,
              })),
              required: false,
            }
          );
          if (radioGroupPattern) {
            pageElementIds.push(radioGroupPattern.id);
            parsedPdf.outputs[radioGroupPattern.id] = {
              type: 'RadioGroup',
              name: element.id,
              label: element.legend,
              options: element.options.map(option => ({
                id: option.id,
                label: option.label,
                name: option.name,
                defaultChecked: option.default_checked,
              })),
              value: '',
              required: true,
            };
          }
          continue;
        }

        if (element.component_type === 'fieldset') {
          for (const input of element.fields) {
            if (input.component_type === 'text_input') {
              const inputPattern = processPatternData<InputPattern>(
                config,
                parsedPdf,
                'input',
                {
                  label: input.label,
                  required: false,
                  initial: '',
                }
              );
              if (inputPattern) {
                fieldsetPatterns.push(inputPattern.id);
                parsedPdf.outputs[inputPattern.id] = {
                  type: 'TextField',
                  name: input.id,
                  label: input.label,
                  value: '',
                  maxLength: 1024,
                  required: input.required,
                };
              }
            }
            if (input.component_type === 'checkbox') {
              const checkboxPattern = processPatternData<CheckboxPattern>(
                config,
                parsedPdf,
                'checkbox',
                {
                  label: input.label,
                  defaultChecked: false,
                }
              );
              if (checkboxPattern) {
                fieldsetPatterns.push(checkboxPattern.id);
                parsedPdf.outputs[checkboxPattern.id] = {
                  type: 'CheckBox',
                  name: input.id,
                  label: input.label,
                  value: false,
                  required: true,
                };
              }
            }
          }
        }

        // Add fieldset to page elements
        if (
          element.component_type === 'fieldset' &&
          fieldsetPatterns.length > 0
        ) {
          const fieldset = processPatternData<FieldsetPattern>(
            config,
            parsedPdf,
            'fieldset',
            {
              legend: element.legend,
              patterns: fieldsetPatterns,
            }
          );
          if (fieldset) {
            pageElementIds.push(fieldset.id);
          }
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
