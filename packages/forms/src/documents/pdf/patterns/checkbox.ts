import type { PDFForm } from 'pdf-lib';
import type { CheckboxPattern } from '../../../patterns/checkbox.js';
import type { CheckboxComponent } from '../parsers/bedrock/schema.js';
import type {
  PatternFieldHandler,
  MappingContext,
  MappingResult,
} from './types.js';

/**
 * Handler for checkbox patterns.
 * Maps checkbox components from Bedrock to CheckboxPattern.
 */
export const checkboxPatternHandler: PatternFieldHandler<
  CheckboxPattern,
  CheckboxComponent
> = {
  patternType: 'checkbox',

  parse(
    checkbox: CheckboxComponent,
    context: MappingContext
  ): MappingResult<CheckboxPattern> {
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
  },

  fill(form: PDFForm, name: string, value: boolean) {
    const field = form.getCheckBox(name);
    if (value) {
      field.check();
    } else {
      field.uncheck();
    }
  },
};
