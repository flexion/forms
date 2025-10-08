import fs from 'fs/promises';
import path from 'path';
import type { AiRequestCache } from '../types.js';

/**
 * Options for configuring filesystem cache behavior.
 */
export type FilesystemCacheOptions = {
  /**
   * Pretty-print JSON files for human readability.
   * Useful for debugging and version control.
   */
  pretty?: boolean;
};

/**
 * Filesystem-backed cache for testing (VCR pattern).
 * Stores responses as JSON files, keyed by request hash.
 * Enables "record once, replay forever" testing workflow.
 *
 * Files are organized into subdirectories based on the first 2 characters
 * of the cache key for better filesystem performance with many entries.
 */
export class FilesystemCache implements AiRequestCache {
  constructor(
    private basePath: string,
    private options: FilesystemCacheOptions = {}
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const filePath = this.getFilePath(key);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const filePath = this.getFilePath(key);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write with optional pretty formatting for readability
    const json = this.options.pretty
      ? JSON.stringify(value, null, 2)
      : JSON.stringify(value);

    await fs.writeFile(filePath, json, 'utf-8');
  }

  async clear(): Promise<void> {
    try {
      await fs.rm(this.basePath, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Generates file path for a cache key.
   * Organizes by first 2 chars for better filesystem performance.
   */
  private getFilePath(key: string): string {
    const prefix = key.slice(0, 2);
    return path.join(this.basePath, prefix, `${key}.json`);
  }
}
