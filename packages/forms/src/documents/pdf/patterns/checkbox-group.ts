import type { PatternId } from '../../../pattern.js';
import type { FieldsetPattern } from '../../../patterns/fieldset/config.js';
import type { CheckboxGroupComponent } from '../parsers/bedrock/schema.js';
import type { DocumentFieldValue } from '../../types.js';
import type {
  PatternFieldHandler,
  MappingContext,
  MappingResult,
} from './types.js';
import { checkboxPatternHandler } from './checkbox.js';

/**
 * Handler for checkbox group components.
 * Maps checkbox_group components from Bedrock to FieldsetPattern with nested checkboxes.
 * Note: This maps to FieldsetPattern, not a separate checkbox-group pattern.
 */
export const checkboxGroupPatternHandler: PatternFieldHandler<
  FieldsetPattern,
  CheckboxGroupComponent
> = {
  patternType: 'fieldset', // checkbox_group maps to fieldset pattern

  parse(
    group: CheckboxGroupComponent,
    context: MappingContext
  ): MappingResult<FieldsetPattern> {
    const checkboxPatternIds: PatternId[] = [];
    const outputs: Array<[PatternId, DocumentFieldValue]> = [];

    for (const option of group.options) {
      const result = checkboxPatternHandler.parse(
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

    // Note: We can't return multiple outputs in MappingResult,
    // so outputs are handled separately in pattern-mapper.ts
    return { pattern: fieldset };
  },

  // No fill method - checkbox group is a container, its children handle filling
};
