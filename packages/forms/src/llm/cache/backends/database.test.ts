import { expect, it } from 'vitest';
import {
  type DbTestContext,
  describeDatabase,
} from '@flexion/forms-database/testing';
import { DatabaseCache } from './database.js';
import { testCacheSpecification } from '../cache-spec.js';

describeDatabase('DatabaseCache', () => {
  it<DbTestContext>('passes shared cache specification', async ({ db }) => {
    const cache = new DatabaseCache(db.ctx);
    await testCacheSpecification(cache);
  });

  it<DbTestContext>('tracks access statistics on cache hits', async ({
    db,
  }) => {
    const cache = new DatabaseCache(db.ctx);
    await cache.set('key', 'value');

    const kysely = await db.ctx.getKysely();
    const initial = await kysely
      .selectFrom('llm_request_cache')
      .select('access_count')
      .where('cache_key', '=', 'key')
      .executeTakeFirst();

    expect(initial?.access_count).toBe(1);

    // Trigger cache hit (stats update is async)
    await cache.get('key');
    await new Promise(resolve => setTimeout(resolve, 100));

    const updated = await kysely
      .selectFrom('llm_request_cache')
      .select('access_count')
      .where('cache_key', '=', 'key')
      .executeTakeFirst();

    expect(updated?.access_count).toBe(2);
  }, 10000);

  it<DbTestContext>('handles concurrent writes to same key', async ({ db }) => {
    const cache = new DatabaseCache(db.ctx);
    const key = 'concurrent';

    // SQLite: sequential writes; Postgres: concurrent writes
    if (db.engine === 'sqlite') {
      for (let i = 0; i < 5; i++) {
        await cache.set(key, `v${i}`);
      }
    } else {
      await Promise.all(
        Array.from({ length: 5 }, (_, i) => cache.set(key, `v${i}`))
      );
    }

    // Should have exactly one entry
    const kysely = await db.ctx.getKysely();
    const count = await kysely
      .selectFrom('llm_request_cache')
      .select(kysely.fn.count('id').as('count'))
      .where('cache_key', '=', key)
      .executeTakeFirst();

    expect(Number(count?.count)).toBe(1);
    expect(await cache.get<string>(key)).toMatch(/^v[0-4]$/);
  }, 10000);
});
