"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useLocalStorage from '../../lib/hooks/useLocalStorage';
import { calculateFuelPlan } from "../lib/fuelCalculator";
import { PRODUCTS } from "../lib/products";
import type { AthleteProfile, EventDetails, FuelPlan } from "../lib/types";

const SPORTS = ["Course à pied", "Trail", "Cyclisme", "Triathlon", "Ultra-trail"];
const WEATHER = ["Froid (<10°C)", "Tempéré (10-20°C)", "Chaud (20-30°C)", "Très chaud (>30°C)"];
const ELEVATION = ["Plat (0-500m D+)", "Vallonné (500-1500m D+)", "Montagneux (1500-3000m D+)", "Alpin (>3000m D+)"];

const S = {
  page: { minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "system-ui, sans-serif" } as React.CSSProperties,
  header: { borderBottom: "1px solid var(--color-border)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,
  logo: { display: "flex", alignItems: "center", gap: 10 } as React.CSSProperties,
  logoIcon: { width: 32, height: 32, background: "var(--color-accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: "#000" } as React.CSSProperties,
  main: { maxWidth: 960, margin: "0 auto", padding: "40px 24px" } as React.CSSProperties,
  card: { background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 24, marginBottom: 20 } as React.CSSProperties,
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6, letterSpacing: "0.5px" } as React.CSSProperties,
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, background: "#1e1e1e", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 14, outline: "none", boxSizing: "border-box" } as React.CSSProperties,
  select: { width: "100%", padding: "10px 14px", borderRadius: 8, background: "#1e1e1e", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 14, outline: "none", boxSizing: "border-box" } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } as React.CSSProperties,
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 } as React.CSSProperties,
  sectionTitle: { fontWeight: 700, fontSize: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 } as React.CSSProperties,
  btn: { padding: "14px 28px", borderRadius: 10, background: "var(--color-accent)", color: "#000", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer", width: "100%" } as React.CSSProperties,
  btnOutline: { padding: "10px 20px", borderRadius: 8, background: "transparent", color: "var(--color-text)", fontWeight: 600, fontSize: 14, border: "1px solid var(--color-border)", cursor: "pointer" } as React.CSSProperties,
  badge: { display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px" } as React.CSSProperties,
};

export default function PlanPage() {
  // Charger/sauvegarder le profil athlète
  const [athleteProfile, setAthleteProfile] = useLocalStorage<AthleteProfile | null>('athlete-profile', null);
  
  const [step, setStep] = useState<"profile" | "event" | "result">("profile");
  const [profile, setProfile] = useState<AthleteProfile>({
    weight: athleteProfile?.weight || 70, 
    age: athleteProfile?.age || 35, 
    gender: athleteProfile?.gender || "M", 
    sweatRate: athleteProfile?.sweatRate || 1.0, 
    giTolerance: athleteProfile?.giTolerance || "normal", 
    allergies: athleteProfile?.allergies || [],
  });
  const [event, setEvent] = useState<EventDetails>({
    sport: "Trail", 
    distance: 50, 
    elevationGain: 2000, 
    targetTime: 6, 
    weather: "Tempéré (10-20°C)", 
    elevation: "Montagneux (1500-3000m D+)",
  });
  const [plan, setPlan] = useState<FuelPlan | null>(null);

  // Sauvegarder automatiquement le profil quand il change
  useEffect(() => {
    const timer = setTimeout(() => {
      setAthleteProfile(profile);
    }, 500); // Sauvegarde après 500ms d'inactivité

    return () => clearTimeout(timer);
  }, [profile, setAthleteProfile]);

  function handleCalculate() {
    const result = calculateFuelPlan(profile, event);
    setPlan(result);
    localStorage.setItem('fuelos_active_plan', JSON.stringify({ fuelPlan: result, profile, event }));
    setStep("result");
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.logo}>
          <div style={S.logoIcon}>F</div>
          <span style={{ fontWeight: 700, fontSize: 20 }}>FuelOS</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {["profile", "event", "result"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ ...S.badge, background: step === s ? "var(--color-accent)" : "var(--color-bg-card)", color: step === s ? "#000" : "var(--color-text-muted)", border: step === s ? "none" : "1px solid var(--color-border)" }}>
                {i + 1}. {s === "profile" ? "Profil" : s === "event" ? "Course" : "Plan"}
              </div>
              {i < 2 && <span style={{ color: "var(--color-border)" }}>→</span>}
            </div>
          ))}
        </div>
        <Link href="/" style={{ ...S.btnOutline, textDecoration: "none" }}>← Accueil</Link>
      </header>

      <div style={S.main}>
        {step === "profile" && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>Ton profil athlète</h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 32, fontSize: 14 }}>Ces données permettent de personnaliser tes besoins nutritionnels.</p>
            
            {athleteProfile && (
              <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid var(--color-accent)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <span style={{ fontSize: 13, color: "var(--color-accent)", fontWeight: 600 }}>Profil sauvegardé automatiquement</span>
              </div>
            )}

            <div style={S.card}>
              <div style={S.sectionTitle}><span>🏃</span> Données physiques</div>
              <div style={S.grid3}>
                <div>
                  <label style={S.label}>POIDS (kg)</label>
                  <input style={S.input} type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: +e.target.value})} min={40} max={120} />
                </div>
                <div>
                  <label style={S.label}>ÂGE</label>
                  <input style={S.input} type="number" value={profile.age} onChange={e => setProfile({...profile, age: +e.target.value})} min={16} max={80} />
                </div>
                <div>
                  <label style={S.label}>GENRE</label>
                  <select style={S.select} value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value as "M"|"F"})}>
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.sectionTitle}><span>💧</span> Hydratation & tolérance</div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>TAUX DE SUDATION (L/h)</label>
                  <select style={S.select} value={profile.sweatRate} onChange={e => setProfile({...profile, sweatRate: +e.target.value})}>
                    <option value={0.5}>Faible (0.5 L/h)</option>
                    <option value={0.8}>Modéré (0.8 L/h)</option>
                    <option value={1.0}>Normal (1.0 L/h)</option>
                    <option value={1.3}>Élevé (1.3 L/h)</option>
                    <option value={1.6}>Très élevé (1.6 L/h)</option>
                  </select>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>Effectuez un test sudation pour plus de précision</p>
                </div>
                <div>
                  <label style={S.label}>TOLÉRANCE GI</label>
                  <select style={S.select} value={profile.giTolerance} onChange={e => setProfile({...profile, giTolerance: e.target.value as "sensitive"|"normal"|"robust"})}>
                    <option value="sensitive">Sensible (≤45g CHO/h)</option>
                    <option value="normal">Normal (≤60g CHO/h)</option>
                    <option value="robust">Robuste (≤90g CHO/h)</option>
                  </select>
                </div>
              </div>
            </div>
            <button style={S.btn} onClick={() => setStep("event")}>Continuer → Paramètres course</button>
          </div>
        )}

        {step === "event" && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>Ta course</h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 32, fontSize: 14 }}>Décris ton événement pour calculer le plan optimal.</p>
            <div style={S.card}>
              <div style={S.sectionTitle}><span>🏔</span> Détails course</div>
              <div style={S.grid3}>
                <div>
                  <label style={S.label}>SPORT</label>
                  <select style={S.select} value={event.sport} onChange={e => setEvent({...event, sport: e.target.value})}>
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>DISTANCE (km)</label>
                  <input style={S.input} type="number" value={event.distance} onChange={e => setEvent({...event, distance: +e.target.value})} min={5} max={500} />
                </div>
                <div>
                  <label style={S.label}>TEMPS CIBLE (h)</label>
                  <input style={S.input} type="number" value={event.targetTime} onChange={e => setEvent({...event, targetTime: +e.target.value})} min={0.5} max={72} step={0.5} />
                </div>
              </div>
              <div style={{ ...S.grid2, marginTop: 16 }}>
                <div>
                  <label style={S.label}>DÉNIVELÉ POSITIF (m)</label>
                  <input style={S.input} type="number" value={event.elevationGain} onChange={e => setEvent({...event, elevationGain: +e.target.value})} min={0} max={15000} />
                </div>
                <div>
                  <label style={S.label}>TYPE DE TERRAIN</label>
                  <select style={S.select} value={event.elevation} onChange={e => setEvent({...event, elevation: e.target.value})}>
                    {ELEVATION.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.sectionTitle}><span>🌡</span> Météo prévue</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {WEATHER.map(w => (
                  <button key={w} onClick={() => setEvent({...event, weather: w})}
                    style={{ padding: "12px 8px", borderRadius: 8, border: `2px solid ${event.weather === w ? "var(--color-accent)" : "var(--color-border)"}`, background: event.weather === w ? "rgba(34,197,94,0.1)" : "var(--color-bg-card)", color: event.weather === w ? "var(--color-accent)" : "var(--color-text-muted)", fontSize: 12, cursor: "pointer", textAlign: "center", fontWeight: 600 }}>
                    {w.split(" ")[0]}<br/><span style={{ fontSize: 10, fontWeight: 400 }}>{w.split(" ").slice(1).join(" ")}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={{...S.btnOutline, flex: 1}} onClick={() => setStep("profile")}>← Profil</button>
              <button style={{...S.btn, flex: 2}} onClick={handleCalculate}>Calculer mon plan →</button>
            </div>
          </div>
        )}

        {step === "result" && plan && (
          <PlanResult plan={plan} profile={profile} event={event} onBack={() => setStep("event")} />
        )}
      </div>
    </div>
  );
}

function PlanResult({ plan, profile, event, onBack }: { plan: FuelPlan; profile: AthleteProfile; event: EventDetails; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"plan"|"shop"|"export">("plan");
  
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>Ton plan nutritionnel</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>{event.sport} · {event.distance}km · {event.targetTime}h · {event.weather}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/race?plan=${encodeURIComponent(JSON.stringify({plan, profile, event}))}`}
            style={{ padding: "12px 20px", borderRadius: 10, background: "var(--color-accent)", color: "#000", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            ⏱ Lancer Race Mode
          </Link>
          <button style={S.btnOutline} onClick={onBack}>Modifier</button>
        </div>
      </div>

      {/* Macro targets */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "CHO/h", value: `${plan.choPerHour}g`, color: "var(--color-accent)", sub: "Glucides/heure" },
          { label: "Eau/h", value: `${plan.waterPerHour}ml`, color: "#60a5fa", sub: "Hydratation/heure" },
          { label: "Na+/h", value: `${plan.sodiumPerHour}mg`, color: "#f59e0b", sub: "Sodium/heure" },
          { label: "Total kcal", value: `${plan.totalCalories}`, color: "#a78bfa", sub: "Calories totales" },
        ].map(item => (
          <div key={item.label} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: item.color, marginBottom: 4 }}>{item.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: "var(--color-text-muted)" }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--color-border)", paddingBottom: 0 }}>
        {(["plan", "shop", "export"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: "10px 20px", border: "none", background: "none", color: activeTab === tab ? "var(--color-accent)" : "var(--color-text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer", borderBottom: `2px solid ${activeTab === tab ? "var(--color-accent)" : "transparent"}`, marginBottom: -1 }}>
            {tab === "plan" ? "📋 Timeline" : tab === "shop" ? "🛒 Shopping" : "📤 Export"}
          </button>
        ))}
      </div>

      {activeTab === "plan" && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Timeline in-race</h3>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Durée totale: {event.targetTime}h</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.timeline.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 8, background: i === 0 ? "rgba(34,197,94,0.05)" : "var(--color-bg)", border: `1px solid ${i === 0 ? "var(--color-accent)" : "var(--color-border)"}` }}>
                <div style={{ minWidth: 60, fontWeight: 700, color: "var(--color-accent)", fontSize: 14 }}>
                  {Math.floor(item.timeMin / 60)}h{String(item.timeMin % 60).padStart(2, "0")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.product}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{item.quantity} · {item.cho}g CHO{item.water ? ` · ${item.water}ml eau` : ""}{item.sodium ? ` · ${item.sodium}mg Na+` : ""}</div>
                </div>
                <div style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: item.type === "gel" ? "rgba(34,197,94,0.15)" : item.type === "drink" ? "rgba(96,165,250,0.15)" : "rgba(245,158,11,0.15)", color: item.type === "gel" ? "var(--color-accent)" : item.type === "drink" ? "#60a5fa" : "#f59e0b", fontWeight: 600 }}>
                  {item.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "shop" && (
        <div>
          <div style={S.card}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Liste de courses</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {plan.shoppingList.map((item, i) => {
                const prod = PRODUCTS.find(p => p.id === item.productId);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 8, background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{prod?.name || item.productId}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{prod?.brand} · {prod?.cho_per_unit}g CHO/unité</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "var(--color-accent)" }}>x{item.quantity}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>~{((prod?.price_per_unit || 0) * item.quantity).toFixed(2)}€</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 8, background: "rgba(34,197,94,0.08)", border: "1px solid var(--color-accent)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>Coût total estimé</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: "var(--color-accent)" }}>
                ~{plan.shoppingList.reduce((sum, item) => {
                  const prod = PRODUCTS.find(p => p.id === item.productId);
                  return sum + (prod?.price_per_unit || 0) * item.quantity;
                }, 0).toFixed(2)}€
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "export" && (
        <div style={S.card}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Exporter le plan</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: "📱", label: "Sauvegarder (local)", desc: "Sauvegarde dans le navigateur pour Race Mode", action: () => {
                localStorage.setItem("fuelos_active_plan", JSON.stringify({ plan, profile, event, savedAt: new Date().toISOString() }));
                alert("Plan sauvegardé ! Accédez à Race Mode pour l'utiliser.");
              }},
              { icon: "📋", label: "Copier JSON", desc: "Pour développeurs / backup", action: () => {
                navigator.clipboard.writeText(JSON.stringify({ plan, profile, event }, null, 2));
                alert("Plan copié dans le presse-papier !");
              }},
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ padding: 20, borderRadius: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", cursor: "pointer", textAlign: "left", color: "var(--color-text)" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}