import type { DatabaseContext } from '@flexion/forms-database';
import type { PdfParser } from './services/parser-interface.js';
import { createBedrockParser } from './adapters/bedrock-parser.js';
import {
  createProductionLlmContext,
  createTestLlmContext,
  createNoopLlmContext,
} from '../../llm/services/context.js';

/**
 * Creates a production PDF parser with database-backed LLM caching.
 * Use this in production applications and server-side code.
 *
 * @param db - Database context for persistent LLM response caching
 * @returns PdfParser configured for production use
 *
 * @example
 * ```typescript
 * const db = await createPostgresDatabaseContext(config);
 * const parser = createProductionPdfParser(db);
 * ```
 */
export const createProductionPdfParser = (db: DatabaseContext): PdfParser => {
  const llmContext = createProductionLlmContext(db);
  return createBedrockParser(llmContext);
};

/**
 * Creates a test PDF parser with filesystem-backed LLM caching (VCR pattern).
 * Enables "record once, replay forever" testing workflow.
 *
 * @param cachePath - Directory path for storing cached LLM responses
 * @returns PdfParser configured for testing
 *
 * @example
 * ```typescript
 * const parser = createTestPdfParser('__fixtures__/ai-cache');
 * // First run: records live Bedrock API response to disk
 * // Subsequent runs: replays from disk, no API calls
 * ```
 */
export const createTestPdfParser = (
  cachePath: string = '__fixtures__/ai-cache'
): PdfParser => {
  const llmContext = createTestLlmContext(cachePath);
  return createBedrockParser(llmContext);
};

/**
 * Creates a PDF parser with no LLM caching.
 * Every parse call will make a live API request to Bedrock.
 *
 * Use cases:
 * - Development when you want fresh results every time
 * - Debugging caching issues
 * - Scenarios where caching is explicitly undesirable
 *
 * WARNING: This will make real API calls and incur costs on every invocation.
 * For most use cases, prefer createProductionPdfParser or createTestPdfParser.
 *
 * @returns PdfParser with no-op cache
 *
 * @example
 * ```typescript
 * const parser = createNoopPdfParser();
 * // Every call hits Bedrock API (no caching)
 * ```
 */
export const createNoopPdfParser = (): PdfParser => {
  const llmContext = createNoopLlmContext();
  return createBedrockParser(llmContext);
};
