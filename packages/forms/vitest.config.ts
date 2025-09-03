import { defineConfig, mergeConfig } from 'vitest/config';

import { getVitestDatabaseContainerGlobalSetupPath } from '@flexion/forms-database';
import sharedTestConfig from '../../vitest.shared';

export default mergeConfig(
  sharedTestConfig,
  defineConfig({
    test: {
      globalSetup: [getVitestDatabaseContainerGlobalSetupPath()],
    },
  })
);
