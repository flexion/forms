import { sql } from 'kysely';

import { type DatabaseContext } from '@flexion/forms-database';
import type { AiRequestCache } from './types.js';

/**
 * Database-backed cache for production use.
 * Stores AI responses in Postgres/SQLite with metadata.
 * Tracks access statistics for analytics and cache optimization.
 */
export class DatabaseCache implements AiRequestCache {
  constructor(private db: DatabaseContext) {}

  async get<T>(key: string): Promise<T | null> {
    const kysely = await this.db.getKysely();

    const result = await kysely
      .selectFrom('llm_request_cache')
      .select('response_data')
      .where('cache_key', '=', key)
      .executeTakeFirst();

    if (result) {
      // Update access statistics asynchronously (don't await to avoid blocking)
      this.updateAccessStats(key).catch(error => {
        console.warn('Failed to update cache access stats:', error);
      });

      return JSON.parse(result.response_data) as T;
    }

    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const kysely = await this.db.getKysely();
    const now = new Date();

    await kysely
      .insertInto('llm_request_cache')
      .values({
        cache_key: key,
        response_data: JSON.stringify(value),
        created_at: now,
        accessed_at: now,
        access_count: 1,
      })
      .onConflict(oc =>
        oc.column('cache_key').doUpdateSet({
          response_data: JSON.stringify(value),
          accessed_at: now,
        })
      )
      .execute();
  }

  async clear(): Promise<void> {
    const kysely = await this.db.getKysely();
    await kysely.deleteFrom('llm_request_cache').execute();
  }

  /**
   * Updates access statistics for a cache entry.
   * Called asynchronously when a cache hit occurs.
   */
  private async updateAccessStats(key: string): Promise<void> {
    const kysely = await this.db.getKysely();

    await kysely
      .updateTable('llm_request_cache')
      .set({
        accessed_at: new Date(),
        access_count: sql`access_count + 1`,
      })
      .where('cache_key', '=', key)
      .execute();
  }
}
