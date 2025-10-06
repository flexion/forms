import { type DatabaseContext } from '@flexion/forms-database';
import { createInMemoryDatabaseContext } from '@flexion/forms-database/context';

import type { InternalFormServiceContext } from './context';
import type { PdfParser } from './documents/pdf/services/parser-interface';
import { createTestPdfParser, parsePdf as parsePdfCore } from './documents/pdf';
import { defaultFormConfig } from './patterns';
import { createFormsRepository } from './repository';

type Options = {
  isUserLoggedIn: () => boolean;
  parser: PdfParser;
};

export const createTestFormServiceContext = async (
  opts?: Partial<Options>
): Promise<InternalFormServiceContext> => {
  const db: DatabaseContext = await createInMemoryDatabaseContext();
  const repository = createFormsRepository({
    db,
    formConfig: defaultFormConfig,
  });
  const parser = opts?.parser || createTestPdfParser();
  const parsePdf = (pdfBytes: Uint8Array) =>
    parsePdfCore({ parser, formConfig: defaultFormConfig }, pdfBytes);

  return {
    repository,
    config: defaultFormConfig,
    isUserLoggedIn: opts?.isUserLoggedIn || (() => true),
    parser,
    parsePdf,
  };
};

export type TestFormServiceContext = Awaited<
  ReturnType<typeof createTestFormServiceContext>
>;
