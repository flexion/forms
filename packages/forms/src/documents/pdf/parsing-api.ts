import { type FieldsetPattern } from '../../patterns/fieldset/config.js';
import { type InputPattern } from '../../patterns/input/config.js';
import { PagePattern } from '../../patterns/page/config.js';
import { PageSetPattern } from '../../patterns/page-set/config.js';
import { type ParagraphPattern } from '../../patterns/paragraph.js';
import { type CheckboxPattern } from '../../patterns/checkbox.js';
import { type RadioGroupPattern } from '../../patterns/radio-group.js';
import { RichTextPattern } from '../../patterns/rich-text.js';

import { uint8ArrayToBase64 } from '../../util/base64.js';
import { type DocumentFieldMap } from '../types.js';
import {
  createPattern,
  FormConfig,
  Pattern,
  PatternId,
  PatternMap,
} from '../../pattern.js';
import { FormErrors } from '../../error.js';
import { defaultFormConfig } from '../../patterns/index.js';
import { parseWithBedrock } from './bedrock-parser.js';
import { ExtractedObject } from './parser-schema.js';

export type ParsedPdf = {
  patterns: PatternMap;
  errors: {
    type: Pattern['type'];
    data: Pattern['data'];
    errors: FormErrors;
  }[];
  outputs: DocumentFieldMap; // to populate FormOutput
  root: PatternId;
  title: string;
  description: string;
};

export type FetchPdfApiResponse = (
  rawData: Uint8Array,
  url?: string
) => Promise<any>;

export const fetchPdfApiResponse: FetchPdfApiResponse = async (
  rawData: Uint8Array,
  url?: string
) => {
  // If URL is provided, use external service (backward compatibility)
  if (url) {
    const base64 = await uint8ArrayToBase64(rawData);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdf: base64,
      }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  }

  // Default: use Bedrock
  const parseResult = await parseWithBedrock(rawData);
  if (!parseResult.success) {
    throw new Error(`Bedrock parsing failed: ${parseResult.error.message}`);
  }

  return {
    message: 'PDF parsed successfully',
    parsed_pdf: parseResult.data,
    cache_id: 'bedrock-parsed',
  };
};

export const processApiResponse = async (json: any): Promise<ParsedPdf> => {
  const extracted: ExtractedObject = ExtractedObject.parse(json.parsed_pdf);
  const parsedPdf: ParsedPdf = {
    patterns: {},
    errors: [],
    outputs: {},
    root: 'root',
    title: extracted.form_summary.title || 'Default Form Title',
    description:
      extracted.form_summary.description || 'Default Form Description',
  };

  processPatternData(
    defaultFormConfig,
    parsedPdf,
    'form-summary',
    {
      title: extracted.form_summary.title || 'Default Form Title',
      description:
        extracted.form_summary.description || 'Default Form Description',
    }
  );

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
          defaultFormConfig,
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
          defaultFormConfig,
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
          defaultFormConfig,
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

      if (element.component_type === 'radio_group') {
        const radioGroupPattern = processPatternData<RadioGroupPattern>(
          defaultFormConfig,
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
              defaultFormConfig,
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
              defaultFormConfig,
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
      if (element.component_type === 'fieldset' && fieldsetPatterns.length > 0) {
        const fieldset = processPatternData<FieldsetPattern>(
          defaultFormConfig,
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
      defaultFormConfig,
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
    defaultFormConfig,
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
  return parsedPdf;
};

const processPatternData = <T extends Pattern>(
  config: FormConfig,
  parsedPdf: ParsedPdf,
  patternType: T['type'],
  patternData: T['data'],
  patternId?: PatternId
) => {
  const result = createPattern<T>(config, patternType, patternData, patternId);
  if (!result.success) {
    parsedPdf.errors.push({
      type: patternType,
      data: patternData,
      errors: result.error,
    });
    return;
  }
  parsedPdf.patterns[result.data.id] = result.data;
  return result.data;
};
