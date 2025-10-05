import type { PDFForm } from 'pdf-lib';
import type { Pattern, FormConfig, PatternId } from '../../../pattern.js';
import type { DocumentFieldValue } from '../../types.js';

/**
 * Context passed to pattern parsing functions.
 * Contains the form config and helper to process nested patterns.
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
 * Result of parsing a component into a pattern.
 * Includes the created pattern and optional PDF field mapping.
 */
export type MappingResult<P extends Pattern> = {
  pattern?: P;
  output?: [PatternId, DocumentFieldValue];
};

/**
 * Generic handler for a pattern type.
 * Encapsulates both parsing (Bedrock → Pattern) and filling (Pattern → PDF).
 */
export interface PatternFieldHandler<
  P extends Pattern = Pattern,
  BedrockComponent = any
> {
  /** Pattern type identifier */
  patternType: P['type'];

  /**
   * Parse a Bedrock component into a Pattern and optional PDF field mapping.
   * This is called during PDF ingestion to build the form structure.
   */
  parse(
    component: BedrockComponent,
    context: MappingContext
  ): MappingResult<P>;

  /**
   * Fill a PDF form field with a user response value.
   * Optional - some patterns (like paragraph, rich-text) don't have corresponding PDF fields.
   */
  fill?(form: PDFForm, fieldName: string, value: any): void;
}
