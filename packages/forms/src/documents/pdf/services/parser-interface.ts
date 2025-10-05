import type { Result } from '@flexion/forms-common';
import type { FieldMetadata, ParseError } from '../domain/types.js';
import type { ExtractedForm } from '../domain/schema.js';

/**
 * Interface for PDF parsers.
 * All parsers must output the ExtractedForm schema format, regardless of the underlying LLM.
 */
export interface PdfParser {
  /**
   * Parse a PDF with form fields into a structured guided interview format.
   *
   * @param pdfBytes - Raw PDF file bytes
   * @param metadata - Field metadata extracted from the PDF
   * @returns Result containing structured form data or error
   */
  parse(
    pdfBytes: Uint8Array,
    metadata: FieldMetadata[]
  ): Promise<Result<ExtractedForm, ParseError>>;
}
