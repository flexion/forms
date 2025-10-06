import { generateObject } from 'ai';
import type { LlmContext } from './context.js';
import { computeObjectCacheKey } from '../cache/hash.js';
import type { ZodType } from 'zod';

/**
 * Cached wrapper around AI SDK's generateObject.
 * Automatically checks cache before making live LLM requests.
 *
 * Cache keys are computed from all request parameters including:
 * - Model ID
 * - System prompt
 * - Messages (with file content hashes)
 * - Schema definition
 * - Generation parameters (temperature, topP, etc.)
 *
 * @param context - LLM context with cache implementation
 * @param params - Parameters to pass to AI SDK's generateObject
 * @returns Generated object result (from cache or live API)
 *
 * @example
 * ```typescript
 * const result = await generateObjectCached(llmContext, {
 *   model: bedrockModel,
 *   schema: MySchema,
 *   messages: [{ role: 'user', content: 'Extract this data...' }],
 * });
 * ```
 */
export const generateObjectCached = async <T extends ZodType>(
  context: LlmContext,
  params: Parameters<typeof generateObject<T>>[0]
): Promise<Awaited<ReturnType<typeof generateObject<T>>>> => {
  // Compute deterministic cache key from all parameters
  const cacheKey = await computeObjectCacheKey(params);

  // Try cache first
  const cached =
    await context.cache.get<Awaited<ReturnType<typeof generateObject<T>>>>(
      cacheKey
    );

  if (cached) {
    console.log('[LLM Cache] Hit:', cacheKey.slice(0, 16));
    return cached;
  }

  // Cache miss - make live request
  console.log('[LLM Cache] Miss:', cacheKey.slice(0, 16));
  const result = await generateObject<T>(params);

  // Store for future requests
  await context.cache.set(cacheKey, result);

  return result;
};
