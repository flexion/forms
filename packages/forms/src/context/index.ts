import type { FormConfig } from '../pattern.js';
import type { FormRepository } from '../repository/types.js';
import type { PdfParser } from '../documents/pdf/services/parser-interface.js';
import type { ParsedPdf } from '../documents/pdf/domain/pattern-mapper.js';
import type { DocumentFieldMap } from '../documents/types.js';

export { BrowserFormRepository } from './browser/form-repo.js';
export { createTestBrowserFormService } from './test/index.js';

/**
 * Function type for parsing PDFs.
 * Parser and config are pre-configured, only requires PDF bytes.
 */
export type ParsePdfFn = (
  pdf: Uint8Array
) => Promise<{ parsedPdf: ParsedPdf; fields: DocumentFieldMap }>;

/**
 * Context for form service operations.
 * The parsePdf function is created by createFormService from parser + config.
 */
export type FormServiceContext = {
  repository: FormRepository;
  config: FormConfig;
  isUserLoggedIn: () => boolean;
  getUserId?: () => string;
  parser: PdfParser;
};

/**
 * Internal context used within service methods.
 * Includes parsePdf wrapper created by createFormService.
 */
export type InternalFormServiceContext = FormServiceContext & {
  parsePdf: ParsePdfFn;
};
