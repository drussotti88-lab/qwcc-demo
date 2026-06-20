import { test } from 'node:test';
import assert from 'node:assert/strict';
import { walmartAdapter } from './walmart.js';
import { pokemonCenterAdapter } from './pokemonCenter.js';
import type { AdapterContext } from './types.js';

// These adapters' resolve() are pure URL parsing (no network), so we can pass a
// throwaway context. Smoke test that they extract the right product ids.
const ctx = {} as AdapterContext;

test('walmart resolve extracts item id from /ip/ url', async () => {
  const r = await walmartAdapter.resolve(
    'https://www.walmart.com/ip/Pokemon-TCG-Booster/123456789',
    ctx,
  );
  assert.equal(r.productId, '123456789');
});

test('walmart resolve rejects a non-product url', async () => {
  await assert.rejects(() => walmartAdapter.resolve('https://www.walmart.com/cp/123', ctx));
});

test('pokemon center resolve extracts slug from /product/ url', async () => {
  const r = await pokemonCenterAdapter.resolve(
    'https://www.pokemoncenter.com/product/100-10001/elite-trainer-box',
    ctx,
  );
  assert.equal(r.productId, '100-10001');
});

test('pokemon center resolve rejects a non-product url', async () => {
  await assert.rejects(() =>
    pokemonCenterAdapter.resolve('https://www.pokemoncenter.com/category/tcg', ctx),
  );
});
