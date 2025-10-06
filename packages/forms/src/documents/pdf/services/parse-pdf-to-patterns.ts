import { type Result } from '@flexion/forms-common';
import { extractFieldMetadata } from '../domain/field-extractor.js';
import {
  mapExtractedObjectToPatterns,
  type ParsedPdf,
} from '../domain/pattern-mapper.js';
import type { ParseError } from '../domain/types.js';
import type { PdfParsingContext } from './context.js';

/**
 * Main service function for parsing PDFs into pattern-based forms.
 * Orchestrates the three-step process:
 * 1. Extract field metadata from PDF (domain)
 * 2. Parse PDF using injected parser (infrastructure)
 * 3. Map to internal pattern representation (domain)
 *
 * @param context - Injected dependencies (parser, config)
 * @param pdfBytes - Raw PDF file bytes
 * @returns Result containing ParsedPdf or error
 */
export const parsePdfToPatterns = async (
  context: PdfParsingContext,
  pdfBytes: Uint8Array
): Promise<Result<ParsedPdf, ParseError>> => {
  // Step 1: Extract field metadata
  const metadataResult = await extractFieldMetadata(pdfBytes);
  if (!metadataResult.success) {
    return metadataResult;
  }

  // Step 2: Parse PDF using injected parser
  const parseResult = await context.parser.parse(pdfBytes, metadataResult.data);
  if (!parseResult.success) {
    return parseResult;
  }

  // Step 3: Map to patterns
  return mapExtractedObjectToPatterns(context.formConfig, parseResult.data);
};
