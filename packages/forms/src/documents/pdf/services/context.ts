import type { FormConfig } from '../../../pattern.js';
import type { PdfParser } from './parser-interface.js';

/**
 * Context for PDF parsing operations.
 * Parser implementations encapsulate their own LLM context internally.
 */
export type PdfParsingContext = {
  /** Parser implementation (Bedrock, fake, etc.) */
  parser: PdfParser;
  /** Form configuration with pattern definitions */
  formConfig: FormConfig;
};
