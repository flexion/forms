import { type AuthServiceContext } from '@flexion/forms-auth';
import { type FormConfig, type FormService } from '@flexion/forms-core';

import { type GithubRepository } from '../lib/github.js';

export type AppContext = {
  agencyBranding: boolean;
  auth: AuthServiceContext;
  baseUrl: `${string}/`;
  formConfig: FormConfig;
  formService: FormService;
  github: GithubRepository;
  title: string;
  uswdsRoot: `${string}/`;
};
