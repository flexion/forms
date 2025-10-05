import type { PatternId } from '../../../pattern.js';
import type { FieldsetPattern } from '../../../patterns/fieldset/config.js';
import type { FieldsetComponent } from '../parsers/bedrock/schema.js';
import type { DocumentFieldValue } from '../../types.js';
import type {
  PatternFieldHandler,
  MappingContext,
  MappingResult,
} from './types.js';
import { inputPatternHandler } from './input.js';
import { checkboxPatternHandler } from './checkbox.js';

/**
 * Handler for fieldset patterns.
 * Maps fieldset components from Bedrock to FieldsetPattern.
 * Processes nested fields using their respective handlers.
 */
export const fieldsetPatternHandler: PatternFieldHandler<
  FieldsetPattern,
  FieldsetComponent
> = {
  patternType: 'fieldset',

  parse(
    fieldset: FieldsetComponent,
    context: MappingContext
  ): MappingResult<FieldsetPattern> {
    const fieldPatternIds: PatternId[] = [];
    const outputs: Array<[PatternId, DocumentFieldValue]> = [];

    for (const field of fieldset.fields) {
      let result: MappingResult<any>;

      if (field.component_type === 'text_input') {
        result = inputPatternHandler.parse(field, context);
      } else if (field.component_type === 'checkbox') {
        result = checkboxPatternHandler.parse(field, context);
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

    // Note: We return the pattern here, but outputs are handled separately
    // in the main mapping logic (pattern-mapper.ts)
    return { pattern };
  },

  // No fill method - fieldset is a container, its children handle filling
};
