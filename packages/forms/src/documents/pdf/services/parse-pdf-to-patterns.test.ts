import { describe, it, expect, vi } from 'vitest';
import { defaultFormConfig } from '../../../patterns/index.js';
import { parsePdfToPatterns } from './parse-pdf-to-patterns.js';
import { FakePdfParser } from '../adapters/fake-parser.js';
import type { ExtractedForm } from '../domain/schema.js';
import { success } from '@flexion/forms-common';

// Mock the field extractor to avoid needing a real PDF
vi.mock('../domain/field-extractor.js', () => ({
  extractFieldMetadata: async () =>
    success([
      {
        id: 'firstName',
        type: 'TextField',
        label: 'First Name',
        page: 0,
      },
      {
        id: 'lastName',
        type: 'TextField',
        label: 'Last Name',
        page: 0,
      },
      {
        id: 'email',
        type: 'TextField',
        label: 'Email',
        page: 0,
      },
      {
        id: 'newsletter',
        type: 'CheckBox',
        label: 'Newsletter',
        page: 0,
      },
    ]),
}));

describe('parsePdfToPatterns', () => {
  it('should parse PDF using injected fake parser', async () => {
    // Arrange: Create a simple test form structure
    const mockExtracted: ExtractedForm = {
      form_summary: {
        title: 'Test Application Form',
        description: 'A simple test form for unit testing',
      },
      pages: [
        {
          title: 'Personal Information',
          elements: [
            {
              component_type: 'paragraph',
              text: 'Please provide your personal information',
            },
            {
              component_type: 'fieldset',
              legend: 'Name',
              fields: [
                {
                  component_type: 'text_input',
                  id: 'firstName',
                  label: 'First Name',
                  required: true,
                },
                {
                  component_type: 'text_input',
                  id: 'lastName',
                  label: 'Last Name',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          title: 'Contact Details',
          elements: [
            {
              component_type: 'text_input',
              id: 'email',
              label: 'Email Address',
              required: true,
            },
            {
              component_type: 'checkbox',
              id: 'newsletter',
              label: 'Subscribe to newsletter',
              default_checked: false,
            },
          ],
        },
      ],
    };

    // Create fake parser with mock response
    const fakeParser = new FakePdfParser(mockExtracted);

    // Create context with fake parser
    const context = {
      parser: fakeParser,
      formConfig: defaultFormConfig,
    };

    // Act: Parse PDF (no real API calls!)
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // Fake PDF header
    const result = await parsePdfToPatterns(context, pdfBytes);

    // Assert: Verify the result
    expect(result.success).toBe(true);

    if (result.success) {
      const parsedPdf = result.data;

      // Check basic structure
      expect(parsedPdf.title).toBe('Test Application Form');
      expect(parsedPdf.description).toBe('A simple test form for unit testing');

      // Check patterns were created
      expect(parsedPdf.patterns).toBeDefined();
      expect(Object.keys(parsedPdf.patterns).length).toBeGreaterThan(0);

      // Check root pattern exists
      expect(parsedPdf.patterns['root']).toBeDefined();
      expect(parsedPdf.patterns['root'].type).toBe('page-set');

      // Check outputs were created
      expect(parsedPdf.outputs).toBeDefined();
      expect(Object.keys(parsedPdf.outputs).length).toBeGreaterThan(0);

      // No errors should be present
      expect(parsedPdf.errors).toHaveLength(0);
    }
  });

  it('should handle parser errors gracefully', async () => {
    // Arrange: Create a fake parser that returns an error
    const errorParser: any = {
      parse: async () => ({
        success: false,
        error: {
          code: 'PARSER_ERROR',
          message: 'Simulated parser error',
        },
      }),
    };

    const context = {
      parser: errorParser,
      formConfig: defaultFormConfig,
    };

    // Act
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const result = await parsePdfToPatterns(context, pdfBytes);

    // Assert: Error is propagated correctly
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('PARSER_ERROR');
      expect(result.error.message).toBe('Simulated parser error');
    }
  });
});
