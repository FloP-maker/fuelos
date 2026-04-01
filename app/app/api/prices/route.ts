import { NextResponse } from "next/server";
import { PRODUCTS } from "../../../lib/products";

type Provider = "decathlon" | "i-run" | "other";

function detectProvider(url?: string): Provider {
  if (!url) return "other";
  const lower = url.toLowerCase();
  if (lower.includes("decathlon.")) return "decathlon";
  if (lower.includes("i-run.")) return "i-run";
  return "other";
}

async function fetchProviderPrice(provider: Provider, productUrl?: string): Promise<number | null> {
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
    const data = (await response.json()) as { price?: number };
    if (typeof data.price !== "number" || Number.isNaN(data.price)) return null;
    return data.price;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").map((v) => v.trim()).filter(Boolean) : [];

  if (ids.length === 0) {
    return NextResponse.json({ prices: {} });
  }

  const prices: Record<string, number> = {};

  for (const id of ids) {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) continue;

    const provider = detectProvider(product.productUrl);
    const remotePrice = await fetchProviderPrice(provider, product.productUrl);
    prices[id] = remotePrice ?? product.price_per_unit;
  }

  return NextResponse.json({ prices });
}
