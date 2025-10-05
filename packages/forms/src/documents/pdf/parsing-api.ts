import { parsePdfToPatterns } from './services/parse-pdf-to-patterns.js';
import type { PdfParsingContext } from './services/context.js';
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
  context: PdfParsingContext,
  pdf: Uint8Array
) => Promise<{ parsedPdf: ParsedPdf; fields: DocumentFieldMap }>;

/**
 * Parses a PDF into patterns and extracts field data.
 * This is the primary API for PDF parsing.
 *
 * @param context - PDF parsing context with LLM services, parser, and form config
 * @param pdfBytes - Raw PDF bytes
 * @returns Object containing:
 *   - parsedPdf: Pattern structure for building form UI
 *   - fields: Raw PDF field data for filling PDF with user responses
 */
export const parsePdf: ParsePdf = async (
  context: PdfParsingContext,
  pdfBytes: Uint8Array
) => {
  // Extract raw field data (needed for filling PDF later)
  const fields = await getDocumentFieldData(pdfBytes);

  // Parse PDF to patterns using injected context
  const result = await parsePdfToPatterns(context, pdfBytes);

  if (!result.success) {
    throw new Error(`PDF parsing failed: ${result.error.message}`);
  }

  return { parsedPdf: result.data, fields };
};
