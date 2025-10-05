import type { RichTextPattern } from '../../../patterns/rich-text.js';
import type { RichTextComponent } from '../domain/schema.js';
import type {
  PatternFieldHandler,
  MappingContext,
  MappingResult,
} from './types.js';

/**
 * Handler for rich text patterns.
 * Maps rich_text components from Bedrock to RichTextPattern.
 * Rich text is display-only and has no corresponding PDF field to fill.
 */
export const richTextPatternHandler: PatternFieldHandler<
  RichTextPattern,
  RichTextComponent
> = {
  patternType: 'rich-text',

  parse(
    richText: RichTextComponent,
    context: MappingContext
  ): MappingResult<RichTextPattern> {
    const pattern = context.processPattern<RichTextPattern>('rich-text', {
      text: richText.text,
    });

    return pattern ? { pattern } : {};
  },

  // No fill method - rich text is display-only
};
