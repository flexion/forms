import { type FieldsetPattern } from '../../../../patterns/fieldset/config.js';
import { type InputPattern } from '../../../../patterns/input/config.js';
import { type ParagraphPattern } from '../../../../patterns/paragraph.js';
import { type CheckboxPattern } from '../../../../patterns/checkbox.js';
import { type RadioGroupPattern } from '../../../../patterns/radio-group.js';
import { type RichTextPattern } from '../../../../patterns/rich-text.js';
import { type DocumentFieldValue } from '../../../types.js';
import {
  type FormConfig,
  type Pattern,
  type PatternId,
} from '../../../../pattern.js';
import type {
  TxInputComponent,
  CheckboxComponent,
  CheckboxGroupComponent,
  RadioGroupComponent,
  ParagraphComponent,
  RichTextComponent,
  FieldsetComponent,
} from './schema.js';

/**
 * Context passed to all mapping functions
 */
export type MappingContext = {
  config: FormConfig;
  processPattern: <T extends Pattern>(
    type: string,
    data: any,
    id?: PatternId
  ) => T | undefined;
};

/**
 * Result of mapping a component - includes pattern and optional output mapping
 */
export type MappingResult<T> = {
  pattern?: T;
  output?: [PatternId, DocumentFieldValue];
};

/**
 * Maps a text input component to an input pattern
 */
export const mapTextInput = (
  input: TxInputComponent,
  context: MappingContext
): MappingResult<InputPattern> => {
  const pattern = context.processPattern<InputPattern>('input', {
    label: input.label,
    required: input.required,
    initial: input.default_value || '',
  });

  if (!pattern) return {};

  return {
    pattern,
    output: [
      pattern.id,
      {
        type: 'TextField',
        name: input.id,
        label: input.label,
        value: '',
        maxLength: 1024,
        required: input.required,
      },
    ],
  };
};

/**
 * Maps a checkbox component to a checkbox pattern
 */
export const mapCheckbox = (
  checkbox: CheckboxComponent,
  context: MappingContext
): MappingResult<CheckboxPattern> => {
  const pattern = context.processPattern<CheckboxPattern>('checkbox', {
    label: checkbox.label,
    defaultChecked: checkbox.default_checked,
  });

  if (!pattern) return {};

  return {
    pattern,
    output: [
      pattern.id,
      {
        type: 'CheckBox',
        name: checkbox.id,
        label: checkbox.label,
        value: false,
        required: true,
      },
    ],
  };
};

/**
 * Maps a checkbox group component to a fieldset with checkboxes
 */
export const mapCheckboxGroup = (
  group: CheckboxGroupComponent,
  context: MappingContext
): MappingResult<FieldsetPattern> => {
  const checkboxPatternIds: PatternId[] = [];
  const outputs: Array<[PatternId, DocumentFieldValue]> = [];

  for (const option of group.options) {
    const result = mapCheckbox(
      {
        component_type: 'checkbox',
        id: option.id,
        label: option.label,
        default_checked: option.default_checked,
      },
      context
    );

    if (result.pattern) {
      checkboxPatternIds.push(result.pattern.id);
      if (result.output) {
        outputs.push(result.output);
      }
    }
  }

  if (checkboxPatternIds.length === 0) return {};

  const fieldset = context.processPattern<FieldsetPattern>('fieldset', {
    legend: group.legend,
    patterns: checkboxPatternIds,
  });

  if (!fieldset) return {};

  // Return fieldset and all checkbox outputs
  return {
    pattern: fieldset,
    // We can't return multiple outputs here, so we'll handle this in the main loop
  };
};

/**
 * Maps a radio group component to a radio group pattern
 */
export const mapRadioGroup = (
  group: RadioGroupComponent,
  context: MappingContext
): MappingResult<RadioGroupPattern> => {
  const pattern = context.processPattern<RadioGroupPattern>('radio-group', {
    label: group.legend,
    hint: '',
    options: group.options.map(option => ({
      id: option.id,
      label: option.label,
      name: option.name,
      defaultChecked: option.default_checked,
    })),
    required: false,
  });

  if (!pattern) return {};

  return {
    pattern,
    output: [
      pattern.id,
      {
        type: 'RadioGroup',
        name: group.id,
        label: group.legend,
        options: group.options.map(option => ({
          id: option.id,
          label: option.label,
          name: option.name,
          defaultChecked: option.default_checked,
        })),
        value: '',
        required: true,
      },
    ],
  };
};

/**
 * Maps a paragraph component to a paragraph pattern
 */
export const mapParagraph = (
  paragraph: ParagraphComponent,
  context: MappingContext
): MappingResult<ParagraphPattern> => {
  const pattern = context.processPattern<ParagraphPattern>('paragraph', {
    text: paragraph.text,
  });

  return pattern ? { pattern } : {};
};

/**
 * Maps a rich text component to a rich text pattern
 */
export const mapRichText = (
  richText: RichTextComponent,
  context: MappingContext
): MappingResult<RichTextPattern> => {
  const pattern = context.processPattern<RichTextPattern>('rich-text', {
    text: richText.text,
  });

  return pattern ? { pattern } : {};
};

/**
 * Maps a fieldset component to a fieldset pattern
 */
export const mapFieldset = (
  fieldset: FieldsetComponent,
  context: MappingContext
): MappingResult<FieldsetPattern> => {
  const fieldPatternIds: PatternId[] = [];
  const outputs: Array<[PatternId, DocumentFieldValue]> = [];

  for (const field of fieldset.fields) {
    let result: MappingResult<any>;

    if (field.component_type === 'text_input') {
      result = mapTextInput(field, context);
    } else if (field.component_type === 'checkbox') {
      result = mapCheckbox(field, context);
    } else {
      continue;
    }

    if (result.pattern) {
      fieldPatternIds.push(result.pattern.id);
      if (result.output) {
        outputs.push(result.output);
      }
    }
  }

  if (fieldPatternIds.length === 0) return {};

  const pattern = context.processPattern<FieldsetPattern>('fieldset', {
    legend: fieldset.legend,
    patterns: fieldPatternIds,
  });

  if (!pattern) return {};

  // Return pattern, outputs will be handled separately
  return { pattern };
};
