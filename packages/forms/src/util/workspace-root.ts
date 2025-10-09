import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Finds the workspace root by looking for pnpm-workspace.yaml.
 * Walks up the directory tree from the current file location.
 *
 * @returns Absolute path to the workspace root
 * @throws Error if workspace root cannot be found
 */
export const findWorkspaceRoot = (): string => {
  // Start from the directory containing this file
  let currentDir = dirname(fileURLToPath(import.meta.url));

  // Walk up the directory tree looking for pnpm-workspace.yaml
  while (currentDir !== dirname(currentDir)) {
    const workspaceFile = join(currentDir, 'pnpm-workspace.yaml');
    if (existsSync(workspaceFile)) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }

  throw new Error('Could not find workspace root (pnpm-workspace.yaml)');
};

/**
 * Gets the default shared cache directory path for the workspace.
 * All tests and CLI tools should use this to ensure caches are shared.
 *
 * @returns Absolute path to __fixtures__/ai-cache at workspace root
 */
export const getDefaultCachePath = (): string => {
  return join(findWorkspaceRoot(), 'packages', 'forms', 'fixtures', 'ai-cache');
};
