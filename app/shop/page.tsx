"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PRODUCTS } from "../lib/products";
import type { Product } from "../lib/types";
import usePageTitle from "../lib/hooks/usePageTitle";
import { ThemeToggle } from "../app/components/ThemeToggle";

const CUSTOM_PRODUCTS_STORAGE_KEY = "fuelos_custom_products";

const CATEGORIES = [
  { id: "all", label: "Tout" },
  { id: "gel", label: "Gels" },
  { id: "drink", label: "Boissons" },
  { id: "bar", label: "Barres" },
  { id: "chew", label: "Chews" },
  { id: "electrolyte", label: "Électrolytes" },
  { id: "real-food", label: "Vraie nourriture" },
];

const DIET_FILTERS = [
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Sans gluten" },
  { id: "real-food", label: "Vraie nourriture" },
];

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  gel: { bg: "rgba(239,68,68,0.12)", color: "#f87171" },
  drink: { bg: "rgba(59,130,246,0.12)", color: "#60a5fa" },
  bar: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24" },
  chew: { bg: "rgba(168,85,247,0.12)", color: "#c084fc" },
  electrolyte: { bg: "rgba(20,184,166,0.12)", color: "#2dd4bf" },
  "real-food": { bg: "rgba(34,197,94,0.12)", color: "#4ade80" },
};

export default function ShopPage() {
  usePageTitle("Shop");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("Tous");
  const [search, setSearch] = useState("");
  const [dietFilters, setDietFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "cho" | "price">("name");
  const [customProducts, setCustomProducts] = useState<Product[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(CUSTOM_PRODUCTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as Product[];
    } catch {
      // ignore invalid local data
    }
    return [];
  });
  const [newCustomProduct, setNewCustomProduct] = useState({
    name: "",
    brand: "",
    imageUrl: "",
    productUrl: "",
    category: "gel" as Product["category"],
    cho_per_unit: 25,
    water_per_unit: 0,
    sodium_per_unit: 0,
    calories_per_unit: 100,
    price_per_unit: 2,
    weight_g: 40,
  });

  useEffect(() => {
    localStorage.setItem(CUSTOM_PRODUCTS_STORAGE_KEY, JSON.stringify(customProducts));
  }, [customProducts]);

  const allProducts = useMemo(() => [...customProducts, ...PRODUCTS], [customProducts]);
  const availableBrands = useMemo(
    () => ["Tous", ...Array.from(new Set(allProducts.map((p) => p.brand))).sort((a, b) => a.localeCompare(b))],
    [allProducts]
  );

  const toggleDiet = (id: string) => {
    setDietFilters(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const filtered = useMemo(() => {
    return allProducts
      .filter(p => category === "all" || p.category === category)
      .filter(p => brand === "Tous" || p.brand === brand)
      .filter(p => {
        const q = search.toLowerCase();
        return !q
          || p.name.toLowerCase().includes(q)
          || p.brand.toLowerCase().includes(q)
          || (p.description || "").toLowerCase().includes(q);
      })
      .filter(p => dietFilters.every(d => p.diet_tags.includes(d)))
      .sort((a, b) => {
        if (sortBy === "cho") return b.cho_per_unit - a.cho_per_unit;
        if (sortBy === "price") return a.price_per_unit - b.price_per_unit;
        return a.name.localeCompare(b.name);
      });
  }, [allProducts, category, brand, search, dietFilters, sortBy]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid var(--color-border)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 32, height: 32, background: "var(--color-accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: "#000" }}>F</div>
          <span style={{ fontWeight: 700, fontSize: 20 }}>FuelOS</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[{ href: "/plan", label: "Plan" }, { href: "/shop", label: "Shop" }, { href: "/race", label: "Race" }, { href: "/learn", label: "Learn" }].map(item => (
            <Link key={item.href} href={item.href}
              style={item.href === "/shop"
                ? { padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "var(--color-accent)", border: "1px solid var(--color-accent)", background: "rgba(34,197,94,0.08)" }
                : { padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)", border: "1px solid transparent" }}>
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", color: "var(--color-text)", fontWeight: 600, fontSize: 14, border: "1px solid var(--color-border)", cursor: "pointer", textDecoration: "none" }}
          >
            Accueil
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Catalogue produits</div>
        <div style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 24 }}>
          {allProducts.length} produits ({customProducts.length} perso) · Maurten, SiS, Tailwind, Näak, GU Energy…
        </div>

        <section style={{ marginBottom: 18, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Ajouter un produit personnalisé</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: 8 }}>
            <input style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Nom" value={newCustomProduct.name} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, name: e.target.value })} />
            <input style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Marque" value={newCustomProduct.brand} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, brand: e.target.value })} />
            <select style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} value={newCustomProduct.category} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, category: e.target.value as Product["category"] })}>
              {(["gel", "drink", "bar", "chew", "real-food", "electrolyte"] as const).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="URL photo https://…" value={newCustomProduct.imageUrl} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, imageUrl: e.target.value })} />
            <input style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="URL produit (optionnel)" value={newCustomProduct.productUrl} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, productUrl: e.target.value })} />
            <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="CHO (g)" value={newCustomProduct.cho_per_unit} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, cho_per_unit: +e.target.value })} />
            <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Prix EUR" value={newCustomProduct.price_per_unit} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, price_per_unit: +e.target.value })} />
            <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="kcal" value={newCustomProduct.calories_per_unit} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, calories_per_unit: +e.target.value })} />
            <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Eau ml (optionnel)" value={newCustomProduct.water_per_unit} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, water_per_unit: +e.target.value })} />
            <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Na mg (optionnel)" value={newCustomProduct.sodium_per_unit} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, sodium_per_unit: +e.target.value })} />
            <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Poids g" value={newCustomProduct.weight_g} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, weight_g: +e.target.value })} />
          </div>
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={() => {
                if (!newCustomProduct.name.trim()) {
                  alert("Nom requis");
                  return;
                }
                const custom: Product = {
                  id: `custom-${Date.now()}`,
                  name: newCustomProduct.name.trim(),
                  brand: newCustomProduct.brand.trim() || "Perso",
                  category: newCustomProduct.category,
                  cho_per_unit: newCustomProduct.cho_per_unit,
                  water_per_unit: newCustomProduct.water_per_unit || undefined,
                  sodium_per_unit: newCustomProduct.sodium_per_unit || undefined,
                  calories_per_unit: newCustomProduct.calories_per_unit,
                  price_per_unit: newCustomProduct.price_per_unit,
                  weight_g: newCustomProduct.weight_g,
                  allergens: [],
                  diet_tags: [],
                  description: "Produit personnalisé",
                  imageUrl: newCustomProduct.imageUrl.trim() || undefined,
                  productUrl: newCustomProduct.productUrl.trim() || undefined,
                };
                setCustomProducts((prev) => [custom, ...prev]);
                setNewCustomProduct({
                  name: "",
                  brand: "",
                  imageUrl: "",
                  productUrl: "",
                  category: "gel",
                  cho_per_unit: 25,
                  water_per_unit: 0,
                  sodium_per_unit: 0,
                  calories_per_unit: 100,
                  price_per_unit: 2,
                  weight_g: 40,
                });
              }}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}
            >
              + Ajouter au catalogue
            </button>
          </div>
        </section>

        {/* Search + Sort */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <input
            style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 14, outline: "none" }}
            placeholder="Rechercher un produit, une marque…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            style={{ padding: "8px 12px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 13, outline: "none" }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as "name" | "cho" | "price")}
          >
            <option value="name">Trier : Nom</option>
            <option value="cho">Trier : CHO</option>
            <option value="price">Trier : Prix</option>
          </select>
          <select
            style={{ padding: "8px 12px", borderRadius: 8, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 13, outline: "none" }}
            value={brand}
            onChange={e => setBrand(e.target.value)}
          >
            {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Category chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: category === cat.id ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                background: category === cat.id ? "rgba(34,197,94,0.12)" : "transparent",
                color: category === cat.id ? "var(--color-accent)" : "var(--color-text-muted)",
              }}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Diet filters */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", paddingBottom: 20 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>Régime :</span>
          {DIET_FILTERS.map(d => (
            <button
              key={d.id}
              onClick={() => toggleDiet(d.id)}
              style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: dietFilters.includes(d.id) ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                background: dietFilters.includes(d.id) ? "rgba(34,197,94,0.12)" : "transparent",
                color: dietFilters.includes(d.id) ? "var(--color-accent)" : "var(--color-text-muted)",
              }}>
              {d.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16 }}>
          {filtered.length} produit{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun produit trouvé</div>
            <div style={{ fontSize: 13 }}>Essayez de modifier vos filtres</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onDelete={p.id.startsWith("custom-") ? () => setCustomProducts((prev) => prev.filter((x) => x.id !== p.id)) : undefined}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProductCard({ product: p, onDelete }: { product: Product; onDelete?: () => void }) {
  const catColor =
    CAT_COLORS[p.category] || { bg: "color-mix(in srgb, var(--color-bg) 88%, transparent)", color: "var(--color-text-muted)" };
  const showImg = p.imageUrl && /^https?:\/\//.test(p.imageUrl);
  return (
    <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", minWidth: 0 }}>
          {showImg ? (
            <img src={p.imageUrl} alt={p.name} style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-bg)", flexShrink: 0 }} />
          ) : null}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-accent)", letterSpacing: "0.8px", textTransform: "uppercase" }}>{p.brand}</div>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{p.price_per_unit.toFixed(2)} €</div>
          <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700, background: catColor.bg, color: catColor.color, marginTop: 4, display: "inline-block" }}>
            {p.category}
          </div>
        </div>
      </div>
      {p.description && (
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{p.description}</div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--color-accent)", fontWeight: 700 }}>
          ⚡ {p.cho_per_unit}g CHO
        </div>
        {p.sodium_per_unit !== undefined && p.sodium_per_unit > 0 && (
          <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>
            🧂 {p.sodium_per_unit}mg Na
          </div>
        )}
        {p.water_per_unit !== undefined && p.water_per_unit > 0 && (
          <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>
            💧 {p.water_per_unit}ml
          </div>
        )}
        <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>
          {p.calories_per_unit} kcal
        </div>
        <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>
          {p.weight_g}g
        </div>
      </div>
      {p.diet_tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {p.diet_tags.map(tag => (
            <span key={tag} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "var(--color-bg)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", fontWeight: 700 }}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {p.productUrl && /^https?:\/\//.test(p.productUrl) && (
        <a href={p.productUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>
          Voir le produit
        </a>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          style={{ marginTop: 4, padding: "6px 10px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}
        >
          Supprimer (perso)
        </button>
      )}
    </div>
  );
}
