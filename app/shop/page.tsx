"use client";
import { useState, useMemo, useEffect } from "react";
import { PRODUCTS } from "../lib/products";
import type { Product } from "../lib/types";
import usePageTitle from "../lib/hooks/usePageTitle";
import { Header } from "../components/Header";

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

const MAX_COMPARE = 3;

const TEXTURE_FR: Record<NonNullable<Product["texture"]>, string> = {
  liquid: "Liquide",
  gel: "Gel",
  chewy: "Mâchable",
  solid: "Solide",
};

function formatGiTolerance(p: Product): string {
  const parts: string[] = [];
  if (p.texture) {
    parts.push(TEXTURE_FR[p.texture] ?? p.texture);
  }
  if (p.recommended_for?.includes("sensitive-stomach")) {
    parts.push("estomac sensible");
  }
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function formatSodiumMg(p: Product): string {
  if (p.sodium_per_unit === undefined || p.sodium_per_unit <= 0) return "—";
  return `${p.sodium_per_unit} mg`;
}

function formatDietTags(p: Product): string {
  return p.diet_tags.length > 0 ? p.diet_tags.join(", ") : "—";
}

export default function ShopPage() {
  usePageTitle("Produits");
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
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [addProductOpen, setAddProductOpen] = useState(false);
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

  useEffect(() => {
    if (!addProductOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAddProductOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addProductOpen]);

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

  const compareProducts = useMemo(() => {
    const byId = new Map(allProducts.map((p) => [p.id, p]));
    return compareIds.map((id) => byId.get(id)).filter((p): p is Product => p != null);
  }, [allProducts, compareIds]);

  const toggleCompareMode = () => {
    setCompareMode((on) => {
      if (on) setCompareIds([]);
      return !on;
    });
  };

  const toggleProductCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const clearCompareSelection = () => setCompareIds([]);

  const showCompareDrawer = compareMode && compareProducts.length >= 2;
  const atCompareLimit = compareIds.length >= MAX_COMPARE;

  const resetNewCustomProductForm = () => {
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
  };

  const submitCustomProduct = () => {
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
    resetNewCustomProductForm();
    setAddProductOpen(false);
  };

  const btnOutlineStyle = {
    padding: "8px 14px" as const,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer" as const,
    border: "1px solid var(--color-border)",
    background: "transparent",
    color: "var(--color-text-muted)",
  };

  return (
    <div className="fuel-page">
      <Header sticky />

      <main
        className="fuel-main"
        style={{ paddingTop: 32, paddingBottom: showCompareDrawer ? 280 : 72 }}
      >
        <div className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          Catalogue produits
        </div>
        <div style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 24 }}>
          {allProducts.length} produits ({customProducts.length} perso) · Maurten, SiS, Tailwind, Näak, GU Energy…
        </div>

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

        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <span>
              {filtered.length} produit{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
            </span>
            {compareMode && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent)" }}>
                Mode comparaison · {compareIds.length}/{MAX_COMPARE} sélectionné{compareIds.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginLeft: "auto" }}>
            <button
              type="button"
              onClick={() => setAddProductOpen(true)}
              style={btnOutlineStyle}
            >
              + Ajouter un produit
            </button>
            <button
              type="button"
              onClick={toggleCompareMode}
              style={{
                ...btnOutlineStyle,
                border: compareMode ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                background: compareMode ? "rgba(34,197,94,0.12)" : "transparent",
                color: compareMode ? "var(--color-accent)" : "var(--color-text-muted)",
              }}
              aria-pressed={compareMode}
            >
              Comparer
            </button>
          </div>
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
                onDelete={p.id.startsWith("custom-") ? () => {
                  setCustomProducts((prev) => prev.filter((x) => x.id !== p.id));
                  setCompareIds((ids) => ids.filter((x) => x !== p.id));
                } : undefined}
                compareMode={compareMode}
                compareChecked={compareIds.includes(p.id)}
                compareDisabled={atCompareLimit && !compareIds.includes(p.id)}
                onCompareToggle={() => toggleProductCompare(p.id)}
              />
            ))}
          </div>
        )}
      </main>

      {addProductOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          role="presentation"
          onClick={() => setAddProductOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-product-dialog-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              maxHeight: "min(90vh, 640px)",
              overflow: "auto",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 14,
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-bg-card)", zIndex: 1 }}>
              <div id="add-product-dialog-title" style={{ fontWeight: 700, fontSize: 17 }}>
                Produit personnalisé
              </div>
              <button
                type="button"
                onClick={() => setAddProductOpen(false)}
                aria-label="Fermer"
                style={{ ...btnOutlineStyle, padding: "6px 12px", fontSize: 18, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                <input style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Nom" value={newCustomProduct.name} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, name: e.target.value })} />
                <input style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Marque" value={newCustomProduct.brand} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, brand: e.target.value })} />
                <select style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} value={newCustomProduct.category} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, category: e.target.value as Product["category"] })}>
                  {(["gel", "drink", "bar", "chew", "real-food", "electrolyte"] as const).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="URL photo https://…" value={newCustomProduct.imageUrl} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, imageUrl: e.target.value })} />
                <input style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)", gridColumn: "1 / -1" }} placeholder="URL produit (optionnel)" value={newCustomProduct.productUrl} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, productUrl: e.target.value })} />
                <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="CHO (g)" value={newCustomProduct.cho_per_unit} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, cho_per_unit: +e.target.value })} />
                <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Prix EUR" value={newCustomProduct.price_per_unit} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, price_per_unit: +e.target.value })} />
                <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="kcal" value={newCustomProduct.calories_per_unit} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, calories_per_unit: +e.target.value })} />
                <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Eau ml (optionnel)" value={newCustomProduct.water_per_unit} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, water_per_unit: +e.target.value })} />
                <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Na mg (optionnel)" value={newCustomProduct.sodium_per_unit} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, sodium_per_unit: +e.target.value })} />
                <input type="number" style={{ padding: "9px 10px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} placeholder="Poids g" value={newCustomProduct.weight_g} onChange={(e) => setNewCustomProduct({ ...newCustomProduct, weight_g: +e.target.value })} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setAddProductOpen(false)} style={btnOutlineStyle}>
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitCustomProduct}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-accent)", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                >
                  Ajouter au catalogue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCompareDrawer && (
        <div
          role="dialog"
          aria-label="Comparaison de produits"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            background: "var(--color-bg-card)",
            borderTop: "1px solid var(--color-border)",
            boxShadow: "0 -12px 40px rgba(0,0,0,0.18)",
            padding: "16px 20px 20px",
            maxHeight: "min(55vh, 480px)",
            overflow: "auto",
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Comparatif ({compareProducts.length} produits)</div>
              <button
                type="button"
                onClick={clearCompareSelection}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg)",
                  color: "var(--color-text)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Vider la sélection
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `minmax(108px, 32%) repeat(${compareProducts.length}, minmax(96px, 1fr))`,
                gap: 0,
                fontSize: 13,
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "10px 12px", fontWeight: 700, background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)" }} />
              {compareProducts.map((p, i) => (
                <div
                  key={p.id}
                  style={{ padding: "10px 12px", fontWeight: 700, background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)", borderRight: i < compareProducts.length - 1 ? "1px solid var(--color-border)" : "none", minWidth: 0, lineHeight: 1.35 }}
                >
                  {p.name}
                </div>
              ))}
              {[
                { label: "Marque", cells: compareProducts.map((p) => p.brand) },
                { label: "CHO", cells: compareProducts.map((p) => `${p.cho_per_unit} g`) },
                { label: "Sodium", cells: compareProducts.map((p) => formatSodiumMg(p)) },
                { label: "Prix", cells: compareProducts.map((p) => `${p.price_per_unit.toFixed(2)} €`) },
                { label: "Poids", cells: compareProducts.map((p) => `${p.weight_g} g`) },
                { label: "Tolérance GI", cells: compareProducts.map((p) => formatGiTolerance(p)) },
                { label: "Tags régime", cells: compareProducts.map((p) => formatDietTags(p)) },
              ].map((row, rowIndex) => (
                <FragmentRow key={row.label} label={row.label} cells={row.cells} isLast={rowIndex === 6} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FragmentRow({ label, cells, isLast }: { label: string; cells: string[]; isLast: boolean }) {
  return (
    <>
      <div
        style={{
          padding: "8px 12px",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          background: "color-mix(in srgb, var(--color-bg-card) 92%, transparent)",
          borderRight: "1px solid var(--color-border)",
          borderBottom: isLast ? "none" : "1px solid var(--color-border)",
          alignSelf: "stretch",
        }}
      >
        {label}
      </div>
      {cells.map((cell, i) => (
        <div
          key={i}
          style={{
            padding: "8px 12px",
            borderRight: i < cells.length - 1 ? "1px solid var(--color-border)" : "none",
            borderBottom: isLast ? "none" : "1px solid var(--color-border)",
            minWidth: 0,
            wordBreak: "break-word",
          }}
        >
          {cell}
        </div>
      ))}
    </>
  );
}

function ProductCard({
  product: p,
  onDelete,
  compareMode = false,
  compareChecked = false,
  compareDisabled = false,
  onCompareToggle,
}: {
  product: Product;
  onDelete?: () => void;
  compareMode?: boolean;
  compareChecked?: boolean;
  compareDisabled?: boolean;
  onCompareToggle?: () => void;
}) {
  const catColor =
    CAT_COLORS[p.category] || { bg: "color-mix(in srgb, var(--color-bg) 88%, transparent)", color: "var(--color-text-muted)" };
  const showImg = p.imageUrl && /^https?:\/\//.test(p.imageUrl);
  return (
    <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      {compareMode && (
        <label style={{ display: "flex", alignItems: "center", cursor: compareDisabled ? "not-allowed" : "pointer" }}>
          <input
            type="checkbox"
            checked={compareChecked}
            disabled={compareDisabled}
            onChange={() => onCompareToggle?.()}
            aria-label={`Inclure ${p.name} dans le comparatif (max. ${MAX_COMPARE})`}
            style={{ width: 18, height: 18, accentColor: "var(--color-accent)" }}
          />
        </label>
      )}
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
