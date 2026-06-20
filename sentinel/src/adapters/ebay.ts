import type { RetailerAdapter, CheckResult, AdapterContext, ResolveResult } from './types.js';
import { errorResult } from './types.js';
import { HttpError } from '../lib/http.js';
import { EbayClient } from './ebayClient.js';
import type { Watch } from '../db/types.js';

/**
 * eBay — reliability: HIGH (PRD §11.2). Official Browse API (Buy APIs):
 * legitimate, keyed, documented. Reads `quantityAvailable` => confidence
 * "exact". No anti-detection needed; quotas are the constraint, not detection.
 *
 * The same client also feeds the market-price subsystem (active listings).
 */

function legacyIdFromUrl(url: string): string | null {
  // https://www.ebay.com/itm/123456789012  or  /itm/<slug>/123456789012
  const m = url.match(/\/itm\/(?:[^/]+\/)?(\d{9,})/);
  return m?.[1] ?? null;
}

// One shared client per process is fine — it owns its own token cache.
let sharedClient: EbayClient | null = null;
function client(ctx: AdapterContext): EbayClient {
  if (!sharedClient) sharedClient = new EbayClient({ logger: ctx.logger });
  return sharedClient;
}

export const ebayAdapter: RetailerAdapter = {
  type: 'ebay',
  capabilities: {
    exactStockQty: true,
    addToCartDeepLink: false,
    requiresProxy: false,
    queueAware: false,
    marketPriceMapping: true,
  },

  async resolve(url: string, ctx: AdapterContext): Promise<ResolveResult> {
    const legacyId = legacyIdFromUrl(url);
    if (!legacyId) throw new Error(`Could not extract an eBay item id from URL: ${url}`);

    await ctx.rateLimiter.acquire();
    const item = await client(ctx).getItemByLegacyId(legacyId);
    const result: ResolveResult = { productId: legacyId, displayName: item.title };
    if (item.image) result.image = item.image;
    return result;
  },

  async check(watch: Watch, ctx: AdapterContext): Promise<CheckResult> {
    const legacyId = watch.product_id;
    await ctx.rateLimiter.acquire();
    try {
      const item = await client(ctx).getItemByLegacyId(legacyId);
      const qty = item.quantityAvailable;
      const inStock =
        item.availabilityStatus === 'IN_STOCK' || (typeof qty === 'number' && qty > 0);
      return {
        inStock,
        confidence: 'exact',
        price: item.price,
        currency: item.currency,
        name: item.title || watch.display_name || '',
        image: item.image ?? watch.image_url ?? null,
        url: item.url,
        addToCartUrl: null,
        stockQty: qty,
        queue: null,
        raw: { availabilityStatus: item.availabilityStatus },
      };
    } catch (err) {
      if (err instanceof HttpError) {
        return errorResult(watch.source_url, `http_${err.status}`, err.message, err.retryable);
      }
      return errorResult(watch.source_url, 'unknown', (err as Error).message, true);
    }
  },
};
