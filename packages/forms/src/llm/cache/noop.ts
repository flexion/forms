import type { AiRequestCache } from './types.js';

/**
 * No-operation cache that never stores or retrieves values.
 * Use when caching should be disabled.
 */
export class NoOpCache implements AiRequestCache {
  async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  async set<T>(_key: string, _value: T): Promise<void> {
    // No-op
  }

  async clear(): Promise<void> {
    // No-op
  }
}
