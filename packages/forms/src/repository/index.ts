import { createService } from '@flexion/forms-common';
import { type DatabaseContext } from '@flexion/forms-database';

import type { FormConfig } from '../pattern.js';
import type { FormRepository } from './types.js';

import { type AddDocument, addDocument } from './add-document.js';
import { type AddForm, addForm } from './add-form.js';
import { type DeleteForm, deleteForm } from './delete-form.js';
import { type GetDocument, getDocument } from './get-document.js';
import { type GetForm, getForm } from './get-form.js';
import { type GetFormList, getFormList } from './get-form-list.js';
import { type GetFormSession, getFormSession } from './get-form-session.js';
import { type SaveForm, saveForm } from './save-form.js';
import {
  type UpsertFormSession,
  upsertFormSession,
} from './upsert-form-session.js';

export type { FormRepository };

export type FormRepositoryContext = {
  db: DatabaseContext;
  formConfig: FormConfig;
};

export const createFormsRepository = (
  ctx: FormRepositoryContext
): FormRepository =>
  createService(ctx, {
    addDocument,
    addForm,
    deleteForm,
    getDocument,
    getFormList,
    getFormSession,
    getForm,
    saveForm,
    upsertFormSession,
  });
