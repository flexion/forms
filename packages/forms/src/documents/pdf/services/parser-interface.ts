import type { Result } from '@flexion/forms-common';
import type { FieldMetadata, ParseError } from '../domain/types.js';
import type { BedrockExtractedObject } from '../parsers/bedrock/schema.js';

/**
 * Interface for PDF parsers.
 * Currently uses BedrockExtractedObject as the output format.
 * Future: Could be made generic to support different parser output schemas.
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
  ): Promise<Result<BedrockExtractedObject, ParseError>>;
}
