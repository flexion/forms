import type { FieldMetadata, ParseResult } from '../domain/types.js';

/**
 * Interface for PDF parsers.
 * Implementations can use LLMs (Bedrock, OpenAI), external services, or local models.
 */
export interface PdfParser {
  /**
   * Parse a PDF with form fields into a structured guided interview format.
   *
   * @param pdfBytes - Raw PDF file bytes
   * @param metadata - Field metadata extracted from the PDF
   * @returns Result containing structured form data or error
   */
  parse(pdfBytes: Uint8Array, metadata: FieldMetadata[]): Promise<ParseResult>;
}
