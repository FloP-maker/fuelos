import { NextResponse } from "next/server";
import { PRODUCTS } from "../../lib/products";

type Provider = "decathlon" | "i-run" | "other";
type PriceConfidence = "high" | "medium" | "low";

type PriceResult = {
  price: number;
  source: string;
  confidence: PriceConfidence;
  fetchedAt: string;
};

type CachedEntry = PriceResult & { expiresAt: number };
const PRICE_CACHE = new Map<string, CachedEntry>();
const TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;

function detectProvider(url?: string): Provider {
  if (!url) return "other";
  const lower = url.toLowerCase();
  if (lower.includes("decathlon.")) return "decathlon";
  if (lower.includes("i-run.")) return "i-run";
  return "other";
}

async function fetchProviderPrice(provider: Provider, productUrl?: string): Promise<PriceResult | null> {
  if (!productUrl) return null;
  const baseUrl =
    provider === "decathlon"
      ? process.env.DECATHLON_PRICE_API_BASE
      : provider === "i-run"
      ? process.env.IRUN_PRICE_API_BASE
      : undefined;

  if (!baseUrl) return null;

  const cacheKey = `${provider}:${productUrl}`;
  const now = Date.now();
  const cached = PRICE_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return {
      price: cached.price,
      source: `${cached.source}-cache`,
      confidence: cached.confidence,
      fetchedAt: cached.fetchedAt,
    };
  }

  const url = `${baseUrl}?url=${encodeURIComponent(productUrl)}`;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const data = (await response.json()) as { price?: number; source?: string; confidence?: PriceConfidence };
      if (typeof data.price !== "number" || Number.isNaN(data.price)) continue;

      const result: PriceResult = {
        price: data.price,
        source: data.source || `${provider}-api`,
        confidence: data.confidence || "high",
        fetchedAt: new Date().toISOString(),
      };
      PRICE_CACHE.set(cacheKey, { ...result, expiresAt: Date.now() + TTL_MS });
      return result;
    } catch {
      // retry
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").map((v) => v.trim()).filter(Boolean) : [];
  return NextResponse.json(await resolvePrices(ids));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[] };
    const ids = Array.isArray(body.ids) ? body.ids.map((v) => v.trim()).filter(Boolean) : [];
    return NextResponse.json(await resolvePrices(ids));
  } catch {
    return NextResponse.json({ prices: {}, metadata: {} }, { status: 400 });
  }
}

async function resolvePrices(ids: string[]) {
  if (ids.length === 0) {
    return { prices: {}, metadata: {} };
  }

  const prices: Record<string, number> = {};
  const metadata: Record<string, Omit<PriceResult, "price">> = {};
  const products = ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is (typeof PRODUCTS)[number] => Boolean(p));
  const grouped = new Map<Provider, (typeof products)>();
  for (const product of products) {
    const provider = detectProvider(product.productUrl);
    const list = grouped.get(provider) || [];
    list.push(product);
    grouped.set(provider, list);
  }

  for (const [provider, providerProducts] of grouped.entries()) {
    const results = await Promise.all(
      providerProducts.map(async (product) => {
        const remotePrice = await fetchProviderPrice(provider, product.productUrl);
        return { product, remotePrice };
      })
    );

    for (const { product, remotePrice } of results) {
      if (remotePrice) {
        prices[product.id] = remotePrice.price;
        metadata[product.id] = {
          source: remotePrice.source,
          confidence: remotePrice.confidence,
          fetchedAt: remotePrice.fetchedAt,
        };
      } else {
        prices[product.id] = product.price_per_unit;
        metadata[product.id] = {
          source: provider === "other" ? "catalog-static" : `${provider}-fallback`,
          confidence: "low",
          fetchedAt: new Date().toISOString(),
        };
      }
    }
  }

  return { prices, metadata };
}
