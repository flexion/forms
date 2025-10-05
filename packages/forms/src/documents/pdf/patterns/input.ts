import type { PDFForm } from 'pdf-lib';
import type { InputPattern } from '../../../patterns/input/config.js';
import type { TxInputComponent } from '../domain/schema.js';
import type {
  PatternFieldHandler,
  MappingContext,
  MappingResult,
} from './types.js';

/**
 * Handler for input (text field) patterns.
 * Maps text_input components from Bedrock to InputPattern.
 */
export const inputPatternHandler: PatternFieldHandler<
  InputPattern,
  TxInputComponent
> = {
  patternType: 'input',

  parse(
    input: TxInputComponent,
    context: MappingContext
  ): MappingResult<InputPattern> {
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
  },

  fill(form: PDFForm, name: string, value: string) {
    const field = form.getTextField(name);
    field.setText(value);
  },
};
