import { type Result, failure, success } from '@flexion/forms-common';
import { type FormSession, type FormSessionId } from '../session.js';
import type { FormRepositoryContext } from './index.js';

export type GetFormSession = (
  ctx: FormRepositoryContext,
  id: string
) => Promise<
  Result<{
    id: FormSessionId;
    formId: string;
    data: FormSession;
  }>
>;

/**
 * Asynchronously retrieves a form session by its unique identifier from the database.
 */
export const getFormSession: GetFormSession = async (
  ctx: FormRepositoryContext,
  id: FormSessionId
) => {
  const db = await ctx.db.getKysely();
  return await db
    .selectFrom('form_sessions')
    .where('id', '=', id)
    .select(['id', 'form_id', 'data'])
    .executeTakeFirstOrThrow()
    .then((result) => {
      return success({
        id: result.id,
        formId: result.form_id,
        data: JSON.parse(result.data),
      });
    })
    .catch((err: Error) => {
      return failure(err.message);
    });
};
