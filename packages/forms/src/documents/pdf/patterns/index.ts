import type { PDFForm } from 'pdf-lib';
import type { Pattern } from '../../../pattern.js';
import type { PDFFieldType } from '../index.js';
import type { PatternFieldHandler } from './types.js';
import { inputPatternHandler } from './input.js';
import { checkboxPatternHandler } from './checkbox.js';
import { radioGroupPatternHandler } from './radio-group.js';
import { paragraphPatternHandler } from './paragraph.js';
import { richTextPatternHandler } from './rich-text.js';
import { fieldsetPatternHandler } from './fieldset.js';

// Export individual handlers for use in pattern-mapper.ts
// These are exported to allow explicit usage in switch statements
export { inputPatternHandler } from './input.js';
export { checkboxPatternHandler } from './checkbox.js';
export { checkboxGroupPatternHandler } from './checkbox-group.js';
export { radioGroupPatternHandler } from './radio-group.js';
export { paragraphPatternHandler } from './paragraph.js';
export { richTextPatternHandler } from './rich-text.js';
export { fieldsetPatternHandler } from './fieldset.js';

// Export types
export type {
  PatternFieldHandler,
  MappingContext,
  MappingResult,
} from './types.js';

/**
 * Registry of all pattern field handlers.
 * Maps pattern type to handler implementation.
 */
export const patternHandlerRegistry = {
  input: inputPatternHandler,
  checkbox: checkboxPatternHandler,
  'radio-group': radioGroupPatternHandler,
  paragraph: paragraphPatternHandler,
  'rich-text': richTextPatternHandler,
  fieldset: fieldsetPatternHandler,
} as const satisfies Record<string, PatternFieldHandler>;

/**
 * Get a pattern handler by pattern type.
 */
export const getPatternHandler = <P extends Pattern>(
  patternType: P['type']
): PatternFieldHandler<P> | undefined => {
  return patternHandlerRegistry[
    patternType as keyof typeof patternHandlerRegistry
  ] as PatternFieldHandler<P> | undefined;
};

/**
 * Mapping from PDF field type to pattern handler fill method.
 * This is used during PDF generation to fill fields with user responses.
 */
const fieldTypeFillHandlers = {
  TextField: inputPatternHandler.fill,
  CheckBox: checkboxPatternHandler.fill,
  RadioGroup: radioGroupPatternHandler.fill,
  Dropdown: undefined, // Not yet implemented
  OptionList: undefined, // Not yet implemented
  Attachment: undefined, // Special case - uses dropdown logic
  Paragraph: undefined, // Display-only, no fill
  RichText: undefined, // Display-only, no fill
} as const satisfies Record<
  PDFFieldType,
  ((form: PDFForm, name: string, value: any) => void) | undefined
>;

/**
 * Fill a PDF field with a value based on its type.
 * Dispatches to the appropriate pattern handler's fill method.
 */
export const fillPdfField = (
  form: PDFForm,
  fieldType: PDFFieldType,
  name: string,
  value: any
): void => {
  // Handle special cases
  if (fieldType === 'Paragraph' || fieldType === 'RichText') {
    return; // Display-only, no fill needed
  }

  if (fieldType === 'Attachment') {
    // Attachment uses dropdown logic
    const field = form.getDropdown(name);
    field.select(value);
    return;
  }

  if (fieldType === 'Dropdown' || fieldType === 'OptionList') {
    // Fallback for dropdown/option list
    const field = form.getDropdown(name);
    field.select(value);
    return;
  }

  const fillHandler = fieldTypeFillHandlers[fieldType];
  if (!fillHandler) {
    throw new Error(`Unknown field type: ${fieldType}`);
  }

  fillHandler(form, name, value);
};
