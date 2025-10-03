import { getDocumentFieldData } from './extract.js';
import {
  type ParsedPdf,
  parsePdf as parsePdfNew,
  fetchPdfApiResponse,
  processApiResponse,
} from './parsing-api.js';
import type { DocumentFieldMap } from '../types.js';

// Re-export new clean architecture API
export { parsePdf as parsePdfToPatterns } from './parsing-api.js';
export { createBedrockParser } from './infrastructure/parsers/bedrock-parser.js';
export { createExternalParser } from './infrastructure/parsers/external-parser.js';
export { FakePdfParser, createSimpleFakeParser } from './infrastructure/parsers/fake-parser.js';
export type { PdfParser } from './application/parser-interface.js';
export type { PdfParsingContext } from './application/context.js';
export type { ParsedPdf } from './domain/pattern-mapper.js';
export type {
  ExtractedObject,
  FieldMetadata,
  ParseError,
} from './domain/types.js';

export * from './generate.js';
export { generateDummyPDF } from './generate-dummy.js';

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

// Legacy API - kept for backward compatibility
export type ParsePdf = (
  pdf: Uint8Array
) => Promise<{ parsedPdf: ParsedPdf; fields: DocumentFieldMap }>;

export const parsePdf: ParsePdf = async (pdfBytes: Uint8Array) => {
  const fields = await getDocumentFieldData(pdfBytes);
  const parsedPdf = await parsePdfNew(pdfBytes);
  return { parsedPdf, fields };
};
