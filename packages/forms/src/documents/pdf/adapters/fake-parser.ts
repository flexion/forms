import { success, type Result } from '@flexion/forms-common';
import type { PdfParser } from '../services/parser-interface.js';
import type { FieldMetadata, ParseError } from '../domain/types.js';
import type { BedrockExtractedObject } from '../parsers/bedrock/schema.js';

/**
 * Fake PDF parser for testing.
 * Returns a pre-configured response without making any external calls.
 */
export class FakePdfParser implements PdfParser {
  private readonly mockResponse: BedrockExtractedObject;

  constructor(mockResponse: BedrockExtractedObject) {
    this.mockResponse = mockResponse;
  }

  async parse(
    _pdfBytes: Uint8Array,
    _metadata: FieldMetadata[]
  ): Promise<Result<BedrockExtractedObject, ParseError>> {
    // Simulate async operation
    return Promise.resolve(success(this.mockResponse));
  }
}

/**
 * Factory function to create a simple fake parser with minimal data
 */
export const createSimpleFakeParser = (): FakePdfParser => {
  return new FakePdfParser({
    form_summary: {
      title: 'Test Form',
      description: 'Test form description',
    },
    pages: [
      {
        title: 'Page 1',
        elements: [
          {
            component_type: 'paragraph',
            text: 'Welcome to the test form',
          },
        ],
      },
    ],
  });
};
