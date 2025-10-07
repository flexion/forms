import type { ServiceMethod } from '@flexion/forms-common';

import type { AddDocument } from './add-document.js';
import type { AddForm } from './add-form.js';
import type { DeleteForm } from './delete-form.js';
import type { GetDocument } from './get-document.js';
import type { GetForm } from './get-form.js';
import type { GetFormList } from './get-form-list.js';
import type { GetFormSession } from './get-form-session.js';
import type { SaveForm } from './save-form.js';
import type { UpsertFormSession } from './upsert-form-session.js';
import type { CreateFormJob } from './jobs/create-form-job.js';
import type { CompleteFormJob } from './jobs/complete-form-job.js';
import type { FailFormJob } from './jobs/fail-form-job.js';
import type { GetLatestFormJob } from './jobs/get-latest-form-job.js';
import type { GetFormJobs } from './jobs/get-form-jobs.js';

/**
 * Interface for the forms repository.
 * Contains methods for persisting and retrieving forms, documents, and sessions.
 */
export interface FormRepository {
  addDocument: ServiceMethod<AddDocument>;
  addForm: ServiceMethod<AddForm>;
  deleteForm: ServiceMethod<DeleteForm>;
  getDocument: ServiceMethod<GetDocument>;
  getForm: ServiceMethod<GetForm>;
  getFormSession: ServiceMethod<GetFormSession>;
  getFormList: ServiceMethod<GetFormList>;
  saveForm: ServiceMethod<SaveForm>;
  upsertFormSession: ServiceMethod<UpsertFormSession>;
  createFormJob: ServiceMethod<CreateFormJob>;
  completeFormJob: ServiceMethod<CompleteFormJob>;
  failFormJob: ServiceMethod<FailFormJob>;
  getLatestFormJob: ServiceMethod<GetLatestFormJob>;
  getFormJobs: ServiceMethod<GetFormJobs>;
}
