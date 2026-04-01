import { NextResponse } from "next/server";
import { PRODUCTS } from "../../../lib/products";

type Provider = "decathlon" | "i-run" | "other";
type PriceConfidence = "high" | "medium" | "low";

type PriceResult = {
  price: number;
  source: string;
  confidence: PriceConfidence;
  fetchedAt: string;
};

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

  try {
    const url = `${baseUrl}?url=${encodeURIComponent(productUrl)}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { price?: number; source?: string; confidence?: PriceConfidence };
    if (typeof data.price !== "number" || Number.isNaN(data.price)) return null;
    return {
      price: data.price,
      source: data.source || `${provider}-api`,
      confidence: data.confidence || "high",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").map((v) => v.trim()).filter(Boolean) : [];

  if (ids.length === 0) {
    return NextResponse.json({ prices: {}, metadata: {} });
  }

  const prices: Record<string, number> = {};
  const metadata: Record<string, Omit<PriceResult, "price">> = {};

  for (const id of ids) {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) continue;

    const provider = detectProvider(product.productUrl);
    const remotePrice = await fetchProviderPrice(provider, product.productUrl);
    if (remotePrice) {
      prices[id] = remotePrice.price;
      metadata[id] = {
        source: remotePrice.source,
        confidence: remotePrice.confidence,
        fetchedAt: remotePrice.fetchedAt,
      };
      continue;
    }

    prices[id] = product.price_per_unit;
    metadata[id] = {
      source: provider === "other" ? "catalog-static" : `${provider}-fallback`,
      confidence: "low",
      fetchedAt: new Date().toISOString(),
    };
  }

  return NextResponse.json({ prices, metadata });
}
