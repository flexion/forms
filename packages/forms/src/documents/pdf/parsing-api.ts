import { defaultFormConfig } from '../../patterns/index.js';
import { parsePdfToPatterns } from './services/parse-pdf-to-patterns.js';
import type { PdfParsingContext } from './services/context.js';
import { createBedrockParser } from './adapters/bedrock-parser.js';
import type { ParsedPdf } from './domain/pattern-mapper.js';
import { getDocumentFieldData } from './extract.js';
import type { DocumentFieldMap } from '../types.js';

// Re-export ParsedPdf for backward compatibility
export type { ParsedPdf };

/**
 * Type for the parsePdf function.
 * Returns both the parsed pattern structure and raw field data.
 */
export type ParsePdf = (
  pdf: Uint8Array
) => Promise<{ parsedPdf: ParsedPdf; fields: DocumentFieldMap }>;

/**
 * Parses a PDF into patterns and extracts field data.
 * This is the primary API for PDF parsing.
 *
 * @param pdfBytes - Raw PDF bytes
 * @returns Object containing:
 *   - parsedPdf: Pattern structure for building form UI
 *   - fields: Raw PDF field data for filling PDF with user responses
 */
export const parsePdf: ParsePdf = async (pdfBytes: Uint8Array) => {
  // Extract raw field data (needed for filling PDF later)
  const fields = await getDocumentFieldData(pdfBytes);

  // Create parser using Bedrock
  const parser = createBedrockParser();

  // Create context with parser and form config
  const context: PdfParsingContext = {
    parser,
    formConfig: defaultFormConfig,
  };

  // Parse PDF to patterns
  const result = await parsePdfToPatterns(context, pdfBytes);

  if (!result.success) {
    throw new Error(`PDF parsing failed: ${result.error.message}`);
  }

  return { parsedPdf: result.data, fields };
};
