import test from 'node:test';
import assert from 'node:assert';
process.env.MANGADEX_BASE = 'mock';
import { searchManga } from '../services/mangadexService';

test('searchManga returns data', async () => {
  const data = await searchManga('demo');
  assert.ok(Array.isArray(data));
});
