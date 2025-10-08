import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FilesystemCache } from './filesystem.js';
import { testCacheSpecification } from '../cache-spec.js';

describe('FilesystemCache', () => {
  let tempDir: string;
  let cache: FilesystemCache;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-test-'));
    cache = new FilesystemCache(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('passes shared cache specification', async () => {
    await testCacheSpecification(cache);
  });

  it('organizes cache files by prefix', async () => {
    await cache.set('abcdef123', 'test-value');

    const filePath = path.join(tempDir, 'ab', 'abcdef123.json');
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);
  });

  it('stores JSON in minified format by default', async () => {
    const key = 'minified';
    const value = { foo: 'bar', nested: { value: 123 } };

    await cache.set(key, value);

    const filePath = path.join(tempDir, key.slice(0, 2), `${key}.json`);
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).not.toContain('\n  ');
    expect(JSON.parse(content)).toEqual(value);
  });

  it('stores JSON in pretty format when enabled', async () => {
    const prettyCache = new FilesystemCache(tempDir, { pretty: true });
    const key = 'pretty';
    const value = { foo: 'bar' };

    await prettyCache.set(key, value);

    const filePath = path.join(tempDir, key.slice(0, 2), `${key}.json`);
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toContain('\n  ');
    expect(JSON.parse(content)).toEqual(value);
  });

  it('clear succeeds even if directory does not exist', async () => {
    const nonExistentCache = new FilesystemCache(
      path.join(tempDir, 'non-existent')
    );

    await expect(nonExistentCache.clear()).resolves.toBeUndefined();
  });

  it('throws error for corrupt cache files', async () => {
    const key = 'corrupt';
    const filePath = path.join(tempDir, key.slice(0, 2), `${key}.json`);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, 'invalid json', 'utf-8');

    await expect(cache.get(key)).rejects.toThrow(SyntaxError);
  });
});
