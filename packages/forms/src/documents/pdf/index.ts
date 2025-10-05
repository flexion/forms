// Primary PDF parsing API
export { parsePdf } from './parsing-api.js';
export type { ParsePdf } from './parsing-api.js';

// Re-export types and utilities
export type { ParsedPdf } from './domain/pattern-mapper.js';
export type { FieldMetadata, ParseError } from './domain/types.js';
export type { ExtractedForm } from './domain/schema.js';
export type { PdfParser } from './services/parser-interface.js';
export type { PdfParsingContext } from './services/context.js';

// Parser implementations
export { createBedrockParser } from './adapters/bedrock-parser.js';
export {
  FakePdfParser,
  createSimpleFakeParser,
} from './adapters/fake-parser.js';

// PDF generation
export * from './generate.js';
export { generateDummyPDF } from './generate-dummy.js';

// Legacy types
export type PDFDocument = {
  type: 'pdf';
  fields: PDFField[];
};
export type PDFField = {
  id: string;
  type: PDFFieldType;
  label: string;
  default?: any;
};
export type PDFFieldType =
  | 'TextField'
  | 'Attachment'
  | 'CheckBox'
  | 'Dropdown'
  | 'OptionList'
  | 'RadioGroup'
  | 'Paragraph'
  | 'RichText';
