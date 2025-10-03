import { success, type Result } from '@flexion/forms-common';
import type { PdfParser } from '../../application/parser-interface.js';
import type {
  ExtractedObject,
  FieldMetadata,
  ParseError,
} from '../../domain/types.js';

/**
 * Fake PDF parser for testing.
 * Returns a pre-configured response without making any external calls.
 */
export class FakePdfParser implements PdfParser {
  private readonly mockResponse: ExtractedObject;

  constructor(mockResponse: ExtractedObject) {
    this.mockResponse = mockResponse;
  }

  async parse(
    _pdfBytes: Uint8Array,
    _metadata: FieldMetadata[]
  ): Promise<Result<ExtractedObject, ParseError>> {
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
