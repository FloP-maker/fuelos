"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PRODUCTS } from "../lib/products";
import type { Product } from "../lib/types";

const CATEGORIES = [
  { id: "all", label: "Tout" },
  { id: "gel", label: "Gels" },
  { id: "drink", label: "Boissons" },
  { id: "bar", label: "Barres" },
  { id: "chew", label: "Chews" },
  { id: "electrolyte", label: "Électrolytes" },
  { id: "real-food", label: "Vraie nourriture" },
];

const BRANDS = ["Tous", "Maurten", "Science in Sport", "Tailwind", "Näak", "GU Energy", "Spring Energy", "Clif Bar", "Skratch Labs", "Precision Hydration", "Nature"];

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
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("Tous");
  const [search, setSearch] = useState("");
  const [dietFilters, setDietFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "cho" | "price">("name");

  const toggleDiet = (id: string) => {
    setDietFilters(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const filtered = useMemo(() => {
    return PRODUCTS
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
  }, [category, brand, search, dietFilters, sortBy]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid var(--color-border)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 32, height: 32, background: "var(--color-accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: "#000" }}>F</div>
          <span style={{ fontWeight: 700, fontSize: 20 }}>FuelOS</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ href: "/plan", label: "Plan" }, { href: "/shop", label: "Shop" }, { href: "/race", label: "Race" }].map(item => (
            <Link key={item.href} href={item.href}
              style={item.href === "/shop"
                ? { padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "var(--color-accent)", border: "1px solid var(--color-accent)", background: "rgba(34,197,94,0.08)" }
                : { padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)", border: "1px solid transparent" }}>
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Catalogue produits</div>
        <div style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 24 }}>
          {PRODUCTS.length} produits · Maurten, SiS, Tailwind, Näak, GU Energy, Clif Bar, Spring Energy…
        </div>

        {/* Search + Sort */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <input
            style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, background: "#1a1a1a", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 14, outline: "none" }}
            placeholder="Rechercher un produit, une marque…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            style={{ padding: "8px 12px", borderRadius: 8, background: "#1a1a1a", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 13, outline: "none" }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as "name" | "cho" | "price")}
          >
            <option value="name">Trier : Nom</option>
            <option value="cho">Trier : CHO</option>
            <option value="price">Trier : Prix</option>
          </select>
          <select
            style={{ padding: "8px 12px", borderRadius: 8, background: "#1a1a1a", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 13, outline: "none" }}
            value={brand}
            onChange={e => setBrand(e.target.value)}
          >
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
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
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const catColor = CAT_COLORS[p.category] || { bg: "#1a1a1a", color: "#888" };
  return (
    <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-accent)", letterSpacing: "0.8px", textTransform: "uppercase" }}>{p.brand}</div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</div>
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
          <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#1e1e1e", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>
            🧂 {p.sodium_per_unit}mg Na
          </div>
        )}
        {p.water_per_unit !== undefined && p.water_per_unit > 0 && (
          <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#1e1e1e", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>
            💧 {p.water_per_unit}ml
          </div>
        )}
        <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#1e1e1e", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>
          {p.calories_per_unit} kcal
        </div>
        <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#1e1e1e", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 600 }}>
          {p.weight_g}g
        </div>
      </div>
      {p.diet_tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {p.diet_tags.map(tag => (
            <span key={tag} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "#232323", color: "#888", fontWeight: 600 }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

>>>>>>> f869e669e240ddb3afafe9c9d4f408d811da5e5c