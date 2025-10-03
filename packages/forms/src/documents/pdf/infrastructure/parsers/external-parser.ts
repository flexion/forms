import { success, failure } from '@flexion/forms-common';
import { uint8ArrayToBase64 } from '../../../../util/base64.js';
import type { PdfParser } from '../../application/parser-interface.js';
import {
  ExtractedObject,
  type FieldMetadata,
  type ParseResult,
  type ParseError,
} from '../../domain/types.js';

/**
 * Configuration for external HTTP-based parser service
 */
export type ExternalParserConfig = {
  url: string;
};

/**
 * PDF parser implementation using external HTTP service.
 * This maintains backward compatibility with the Python-based parser.
 */
export class ExternalParser implements PdfParser {
  private readonly url: string;

  constructor(config: ExternalParserConfig) {
    this.url = config.url;
  }

  async parse(
    pdfBytes: Uint8Array,
    _metadata: FieldMetadata[]
  ): Promise<ParseResult> {
    try {
      const base64 = await uint8ArrayToBase64(pdfBytes);

      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf: base64,
        }),
      });

      if (!response.ok) {
        const parseError: ParseError = {
          code: 'PARSER_ERROR',
          message: `External parser returned ${response.status}: ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText },
        };
        return failure(parseError);
      }

      const json = await response.json();

      // Validate response with Zod schema
      const validated = ExtractedObject.parse(json.parsed_pdf);

      return success(validated);
    } catch (error) {
      console.error('External parser error:', error);
      const parseError: ParseError = {
        code: 'PARSER_ERROR',
        message: 'Failed to parse PDF with external service',
        details: error,
      };
      return failure(parseError);
    }
  }
}

/**
 * Factory function to create ExternalParser
 */
export const createExternalParser = (url: string): ExternalParser => {
  return new ExternalParser({ url });
};
