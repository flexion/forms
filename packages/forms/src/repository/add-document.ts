import { type Result, failure, success } from '@flexion/forms-common';

import type { ParsedPdf } from '../documents/pdf/parsing-api.js';
import type { DocumentFieldMap } from '../documents/types.js';
import type { FormRepositoryContext } from './index.js';

export type AddDocument = (
  ctx: FormRepositoryContext,
  document: {
    fileName: string;
    data: Uint8Array;
    extract?: {
      parsedPdf: ParsedPdf;
      fields: DocumentFieldMap;
    };
  }
) => Promise<Result<{ id: string }>>;

/**
 * Asynchronously adds a document entry to the database.
 */
export const addDocument: AddDocument = async (ctx, document) => {
  const uuid = crypto.randomUUID();
  const db = await ctx.db.getKysely();

  return await db
    .insertInto('form_documents')
    .values({
      id: uuid,
      type: 'pdf',
      file_name: document.fileName,
      data: Buffer.from(document.data),
      extract: document.extract ? JSON.stringify(document.extract) : '',
    })
    .execute()
    .then(() =>
      success({
        id: uuid,
      })
    )
    .catch(err => failure(err.message));
};
