import { defaultFormConfig } from '../../patterns/index.js';
import { parsePdfToPatterns } from './application/pdf-parsing-service.js';
import type { PdfParsingContext } from './application/context.js';
import { createBedrockParser } from './infrastructure/parsers/bedrock-parser.js';
import { createExternalParser } from './infrastructure/parsers/external-parser.js';
import type { ParsedPdf } from './domain/pattern-mapper.js';
import { ExtractedObject } from './domain/types.js';

// Re-export ParsedPdf for backward compatibility
export type { ParsedPdf };

/**
 * Parses a PDF into a ParsedPdf structure.
 * Uses Bedrock by default, or an external service if URL is provided.
 *
 * @param rawData - Raw PDF bytes
 * @param url - Optional URL for external parser service
 * @returns ParsedPdf structure
 */
export const parsePdf = async (
  rawData: Uint8Array,
  url?: string
): Promise<ParsedPdf> => {
  // Create parser based on configuration
  const parser = url ? createExternalParser(url) : createBedrockParser();

  // Create context with parser and form config
  const context: PdfParsingContext = {
    parser,
    formConfig: defaultFormConfig,
  };

  // Parse PDF to patterns
  const result = await parsePdfToPatterns(context, rawData);

  if (!result.success) {
    throw new Error(`PDF parsing failed: ${result.error.message}`);
  }

  return result.data;
};

// Deprecated: use parsePdf instead
// Kept for backward compatibility
export type FetchPdfApiResponse = (
  rawData: Uint8Array,
  url?: string
) => Promise<any>;

export const fetchPdfApiResponse: FetchPdfApiResponse = async (
  rawData: Uint8Array,
  url?: string
) => {
  const parsedPdf = await parsePdf(rawData, url);

  // Return in legacy format
  return {
    message: 'PDF parsed successfully',
    parsed_pdf: parsedPdf,
    cache_id: url ? 'external-parsed' : 'bedrock-parsed',
  };
};

// Deprecated: This function is kept for backward compatibility
// New code should use parsePdf() directly
export const processApiResponse = async (json: any): Promise<ParsedPdf> => {
  // Validate and parse the extracted object
  const extracted: ExtractedObject = ExtractedObject.parse(json.parsed_pdf);

  // If it's already a ParsedPdf (from new parsePdf function), return it
  if ('patterns' in json.parsed_pdf && 'outputs' in json.parsed_pdf) {
    return json.parsed_pdf as ParsedPdf;
  }

  // Otherwise, map it using the domain mapper
  const { mapExtractedObjectToPatterns } = await import(
    './domain/pattern-mapper.js'
  );
  const result = mapExtractedObjectToPatterns(defaultFormConfig, extracted);

  if (!result.success) {
    throw new Error(`Pattern mapping failed: ${result.error.message}`);
  }

  return result.data;
};
