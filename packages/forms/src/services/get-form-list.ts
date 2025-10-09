import { type Result, failure, success } from '@flexion/forms-common';

import { type FormServiceContext } from '../context/index.js';
import type { FormListItem as RepositoryFormListItem } from '../repository/get-form-list.js';

export type FormListItem = RepositoryFormListItem;

type FormListError = {
  status: number;
  message: string;
};

export type GetFormList = (
  ctx: FormServiceContext
) => Promise<Result<FormListItem[], FormListError>>;

/**
 * This is meant to sit in front of the form repository and manage the HTTP status codes
 * and message returned in the response when a list of forms is fetched from the repository.
 */
export const getFormList: GetFormList = async ctx => {
  if (!ctx.isUserLoggedIn()) {
    return failure({
      status: 401,
      message: 'You must be logged in to get form list',
    });
  }
  const forms = await ctx.repository.getFormList();
  if (forms === null) {
    return failure({
      status: 500,
      message: 'error getting form list',
    });
  }
  return success(forms);
};
