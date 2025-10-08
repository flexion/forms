/**
 * Generic cache interface for any key-value storage.
 * Implementations handle serialization/storage details.
 */
export interface AiRequestCache {
  /**
   * Retrieves a cached value by key.
   * @param key - Cache key (typically a hash of request parameters)
   * @returns The cached value, or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Stores a value in the cache.
   * @param key - Cache key (typically a hash of request parameters)
   * @param value - Value to cache (will be JSON serialized)
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Clears all cached entries.
   * Primarily intended for testing.
   */
  clear(): Promise<void>;
}

/**
 * Metadata stored alongside cached responses for debugging and analytics.
 */
export type CacheMetadata = {
  modelId: string;
  requestHash: string;
  createdAt: Date;
  accessedAt: Date;
  accessCount: number;
};
