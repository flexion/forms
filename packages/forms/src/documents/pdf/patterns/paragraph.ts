import type { ParagraphPattern } from '../../../patterns/paragraph.js';
import type { ParagraphComponent } from '../domain/schema.js';
import type {
  PatternFieldHandler,
  MappingContext,
  MappingResult,
} from './types.js';

/**
 * Handler for paragraph patterns.
 * Maps paragraph components from Bedrock to ParagraphPattern.
 * Paragraphs are display-only and have no corresponding PDF field to fill.
 */
export const paragraphPatternHandler: PatternFieldHandler<
  ParagraphPattern,
  ParagraphComponent
> = {
  patternType: 'paragraph',

  parse(
    paragraph: ParagraphComponent,
    context: MappingContext
  ): MappingResult<ParagraphPattern> {
    const pattern = context.processPattern<ParagraphPattern>('paragraph', {
      text: paragraph.text,
    });

    return pattern ? { pattern } : {};
  },

  // No fill method - paragraphs are display-only
};
