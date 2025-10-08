import type { DatabaseContext } from '@flexion/forms-database';
import type { AiRequestCache } from '../cache/types.js';
import { DatabaseCache } from '../cache/backends/database.js';
import { FilesystemCache } from '../cache/backends/filesystem.js';
import { NoOpCache } from '../cache/backends/noop.js';

/**
 * Context for LLM operations.
 * Provides cache and configuration for all LLM service calls.
 */
export type LlmContext = {
  /**
   * Cache implementation for storing and retrieving LLM responses.
   */
  cache: AiRequestCache;
};

/**
 * Creates a production LLM context with database-backed caching.
 *
 * @param dbContext - Database context for persistent storage
 * @returns LlmContext configured for production use
 *
 * @example
 * ```typescript
 * const dbContext = await createPostgresDatabaseContext(config);
 * const llmContext = createProductionLlmContext(dbContext);
 * ```
 */
export const createProductionLlmContext = (
  dbContext: DatabaseContext
): LlmContext => ({
  cache: new DatabaseCache(dbContext),
});

/**
 * Creates a test LLM context with filesystem-backed caching (VCR pattern).
 * Enables "record once, replay forever" testing workflow.
 *
 * @param cachePath - Directory path for storing cached responses
 * @param pretty - Whether to pretty-print JSON files (default: true)
 * @returns LlmContext configured for testing
 *
 * @example
 * ```typescript
 * const llmContext = createTestLlmContext('__fixtures__/ai-cache');
 * // First run: records live API response to disk
 * // Subsequent runs: replays from disk, no API calls
 * ```
 */
export const createTestLlmContext = (
  cachePath: string = '__fixtures__/ai-cache',
  pretty: boolean = true
): LlmContext => ({
  cache: new FilesystemCache(cachePath, { pretty }),
});

/**
 * Creates an LLM context with caching disabled.
 * Useful for scenarios where caching is undesirable.
 *
 * @returns LlmContext with no-op cache
 *
 * @example
 * ```typescript
 * const llmContext = createNoopLlmContext();
 * // Every call results in a live API request
 * ```
 */
export const createNoopLlmContext = (): LlmContext => ({
  cache: new NoOpCache(),
});
