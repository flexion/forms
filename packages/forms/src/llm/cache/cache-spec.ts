import { expect } from 'vitest';
import type { AiRequestCache } from './types.js';

/**
 * Shared specification for all cache implementations.
 * Tests core functionality: get, set, clear, and basic edge cases.
 */
export async function testCacheSpecification(cache: AiRequestCache) {
  // Non-existent key
  expect(await cache.get('non-existent')).toBeNull();

  // Basic string value
  await cache.set('key1', 'value1');
  expect(await cache.get<string>('key1')).toBe('value1');

  // Complex object (tests JSON serialization)
  const complexValue = {
    text: 'Hello',
    nested: { array: [1, 2, 3], nullValue: null, bool: true },
  };
  await cache.set('complex', complexValue);
  expect(await cache.get<typeof complexValue>('complex')).toEqual(complexValue);

  // Overwriting existing value
  await cache.set('key1', 'updated');
  expect(await cache.get<string>('key1')).toBe('updated');

  // Multiple independent keys
  await cache.set('a', 'value-a');
  await cache.set('b', 'value-b');
  expect(await cache.get<string>('a')).toBe('value-a');
  expect(await cache.get<string>('b')).toBe('value-b');

  // Edge cases: empty string, null, zero, booleans
  await cache.set('empty', '');
  await cache.set('null', null);
  await cache.set('zero', 0);
  await cache.set('true', true);
  await cache.set('false', false);

  expect(await cache.get<string>('empty')).toBe('');
  expect(await cache.get<null>('null')).toBeNull();
  expect(await cache.get<number>('zero')).toBe(0);
  expect(await cache.get<boolean>('true')).toBe(true);
  expect(await cache.get<boolean>('false')).toBe(false);

  // Clear removes all entries
  await cache.clear();
  expect(await cache.get('key1')).toBeNull();
  expect(await cache.get('a')).toBeNull();
  expect(await cache.get('complex')).toBeNull();
}
