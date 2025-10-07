// Primary PDF parsing API (Node.js only - uses bedrock)
export { parsePdf } from './parsing-api.js';
export type { ParsePdf } from './parsing-api.js';

// Re-export types and utilities
export type { ParsedPdf } from './domain/pattern-mapper.js';
export type { FieldMetadata, ParseError } from './domain/types.js';
export type { ExtractedForm } from './domain/schema.js';
export type { PdfParser } from './services/parser-interface.js';
export type { PdfParsingContext } from './services/context.js';

// Parser implementations (Node.js only)
// NOTE: createBedrockParser is not exported here to avoid pulling in Node.js-only
// AWS SDK code into browser bundles. Import directly from './adapters/bedrock-parser.js' if needed.
// export { createBedrockParser } from './adapters/bedrock-parser.js';
export {
  FakePdfParser,
  createSimpleFakeParser,
} from './adapters/fake-parser.js';

// Parser factory functions (Node.js only - createProductionPdfParser uses bedrock)
// NOTE: These are not exported to avoid pulling Node.js-only code into browser bundles.
// Import directly from './context.js' if needed in Node.js environments.
// export {
//   createProductionPdfParser,
//   createTestPdfParser,
//   createNoopPdfParser,
// } from './context.js';

// PDF generation (browser-safe)
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
