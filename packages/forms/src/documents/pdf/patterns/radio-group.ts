import { PDFForm, PDFName, createPDFAcroFields } from 'pdf-lib';
import type { RadioGroupPattern } from '../../../patterns/radio-group.js';
import type { RadioGroupComponent } from '../parsers/bedrock/schema.js';
import type {
  PatternFieldHandler,
  MappingContext,
  MappingResult,
} from './types.js';

/**
 * Handler for radio group patterns.
 * Maps radio_group components from Bedrock to RadioGroupPattern.
 */
export const radioGroupPatternHandler: PatternFieldHandler<
  RadioGroupPattern,
  RadioGroupComponent
> = {
  patternType: 'radio-group',

  parse(
    group: RadioGroupComponent,
    context: MappingContext
  ): MappingResult<RadioGroupPattern> {
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
  },

  fill(form: PDFForm, name: string, value: string) {
    // TODO: harmonize the option ids between pdf-lib and the API at ingestion time
    try {
      const field = form.getRadioGroup(name);
      field.select(value);
    } catch (error: any) {
      // This logic should work even if pdf-lib misidentifies the field type
      // TODO: radioParent should contain the name, not the id
      const [radioParent, radioChild] = value.split('.');
      if (radioChild) {
        // TODO: resolve import failure when spaces are present in name, id
        const radioChildWithSpace = radioChild.replace('_', ' ');
        const field = form.getField(name);
        const acroField = field.acroField;
        acroField.dict.set(PDFName.of('V'), PDFName.of(radioChildWithSpace));
        const kids = createPDFAcroFields(acroField.Kids()).map(_ => _[0]);
        kids.forEach(kid => {
          kid.dict.set(PDFName.of('AS'), PDFName.of(radioChildWithSpace));
        });
      }
    }
  },
};
