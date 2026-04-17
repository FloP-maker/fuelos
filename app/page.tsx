import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { LandingAuthPanel } from "./components/LandingAuthPanel";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/mes-plans-courses");
  }

  return (
    <div
      className="fuel-landing-v2"
      style={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateRows: "56px minmax(0,1fr) auto",
        background: "var(--color-bg)",
      }}
    >
      <header
        className="fuel-landing-v2__header"
        style={{
          height: 56,
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <Link href="/" className="font-display" style={{ fontWeight: 900, fontSize: 24, color: "#1B4332", textDecoration: "none" }}>
            FUELOS
          </Link>
          <nav className="fuel-landing-v2__nav" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }} aria-label="Menus principaux">
            {[
              { href: "/profil", label: "Profil" },
              { href: "/mes-plans-courses", label: "Mes plans courses" },
              { href: "/race", label: "Mode course" },
              { href: "/produits", label: "Produits" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="fuel-landing-v2__nav-link"
                style={{ fontSize: 13, textDecoration: "none", color: "var(--color-text-muted)", fontWeight: 700 }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link
          href="/api/auth/signin"
          className="fuel-landing-v2__login-btn"
          style={{
            textDecoration: "none",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 800,
            color: "var(--color-text)",
            whiteSpace: "nowrap",
          }}
        >
          Connexion
        </Link>
      </header>

      <main
        className="fuel-landing-v2__main"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr minmax(360px, 430px) 1fr",
          minHeight: 0,
        }}
      >
        <section
          className="fuel-landing-v2__visual fuel-landing-v2__visual--left"
          aria-label="Visualisation saison"
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundImage:
              "linear-gradient(180deg, rgba(15,23,42,.25), rgba(15,23,42,.45)), url('https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="fuel-landing-v2__overlay-card fuel-landing-v2__overlay-card--left"
            style={{
              position: "absolute",
              inset: "auto 20px 24px 20px",
              borderRadius: 14,
              border: "1px solid color-mix(in srgb, white 35%, transparent)",
              background: "color-mix(in srgb, #0f172a 26%, transparent)",
              backdropFilter: "blur(2px)",
              color: "white",
              padding: 14,
            }}
          >
            <p style={{ margin: 0, fontSize: 11, letterSpacing: ".08em", fontWeight: 900, opacity: 0.8 }}>MES PLANS COURSES</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5 }}>
              Construis ta saison, clique chaque event et prépare ton nutrition training autour du GPX.
            </p>
          </div>
        </section>

        <section
          className="fuel-landing-v2__center"
          style={{
            background: "var(--color-bg-card)",
            borderLeft: "1px solid var(--color-border)",
            borderRight: "1px solid var(--color-border)",
            padding: "22px 20px",
            display: "grid",
            alignContent: "center",
            gap: 14,
          }}
          aria-label="Connexion FuelOS"
        >
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <h1 className="font-display" style={{ margin: 0, fontSize: "clamp(1.7rem, 4vw, 2.3rem)", lineHeight: 1.05, fontWeight: 900 }}>
              FuelOS, prêt pour
              <br />
              ton prochain objectif
            </h1>
            <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)", fontSize: 13, lineHeight: 1.5 }}>
              Profil, plans courses, mode race et catalogue produits dans une seule plateforme.
            </p>
          </div>

          <LandingAuthPanel
            title="Créer ton compte FuelOS"
            subtitle="Synchronise tes données et active tes 4 modules sur tous tes appareils."
            callbackPath="/mes-plans-courses"
          />
        </section>

        <section
          className="fuel-landing-v2__visual fuel-landing-v2__visual--right"
          aria-label="Visualisation mode course"
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundImage:
              "linear-gradient(180deg, rgba(15,23,42,.18), rgba(15,23,42,.42)), url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1600&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <svg
            viewBox="0 0 1000 220"
            aria-hidden
            className="fuel-landing-v2__pulse-line"
            style={{ position: "absolute", right: -20, bottom: 80, width: "92%", opacity: 0.95 }}
          >
            <path
              className="fuel-landing-v2__pulse-line-path"
              d="M0 160 C 120 40, 190 210, 300 130 C 395 60, 470 200, 560 120 C 665 30, 760 220, 860 130 C 920 80, 970 150, 1000 125"
              fill="none"
              stroke="#f97316"
              strokeWidth="12"
              strokeLinecap="round"
            />
          </svg>
          <div
            className="fuel-landing-v2__overlay-card fuel-landing-v2__overlay-card--right"
            style={{
              position: "absolute",
              left: 22,
              bottom: 24,
              borderRadius: 14,
              border: "1px solid color-mix(in srgb, white 38%, transparent)",
              background: "color-mix(in srgb, #111827 30%, transparent)",
              color: "white",
              padding: 14,
              maxWidth: 320,
            }}
          >
            <p style={{ margin: 0, fontSize: 11, letterSpacing: ".08em", fontWeight: 900, opacity: 0.8 }}>MODE COURSE</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5 }}>
              Pilote tes prises nutrition avec topographie, allure, physiologie et historique.
            </p>
          </div>
        </section>
      </main>

      <footer
        className="fuel-landing-v2__footer"
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-bg-card)",
          padding: "12px 16px 14px",
          display: "grid",
          gap: 10,
          gridTemplateColumns: "minmax(140px, 220px) repeat(4, minmax(120px, 1fr))",
          alignItems: "start",
        }}
      >
        <div>
          <p className="font-display" style={{ margin: 0, fontWeight: 900, color: "#1B4332", fontSize: 26 }}>
            FUELOS
          </p>
          <p style={{ margin: "5px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
            Athlete nutrition OS
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "var(--color-text-muted)" }}>Modules</p>
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>Profil</p>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>Mes plans courses</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "var(--color-text-muted)" }}>Performance</p>
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>Mode course</p>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>Nutrition training</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "var(--color-text-muted)" }}>Produits</p>
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>Catalogue FuelOS</p>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>Marques partenaires</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "var(--color-text-muted)" }}>Legal</p>
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>
            <Link href="/legal" className="fuel-landing-v2__footer-link" style={{ color: "inherit", textDecoration: "none" }}>
              Mentions légales
            </Link>
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>
            <Link href="/privacy" className="fuel-landing-v2__footer-link" style={{ color: "inherit", textDecoration: "none" }}>
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
