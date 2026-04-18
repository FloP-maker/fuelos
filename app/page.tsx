import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { FuelBrandWordmark } from "./components/FuelBrandWordmark";
import { Header } from "./components/Header";
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
        gridTemplateRows: "auto minmax(0,1fr) auto",
        background: "var(--color-bg)",
      }}
    >
      <Header sticky />

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
              "linear-gradient(165deg, color-mix(in srgb, var(--color-primary) 32%, rgba(16,42,26,.38)), rgba(15,23,42,.48)), url('/landing-left.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <svg
            viewBox="0 0 1000 260"
            aria-hidden
            className="fuel-landing-v2__brand-line fuel-landing-v2__brand-line--left"
            style={{ left: "-8%", top: "10%", width: "108%", maxWidth: "none" }}
          >
            <path
              className="fuel-landing-v2__brand-line-path"
              d="M-20 200 C 140 30, 260 240, 420 120 S 700 20, 1020 95"
              pathLength={1}
              strokeWidth="11"
            />
            <path
              className="fuel-landing-v2__brand-line-path"
              d="M40 165 C 200 55, 320 195, 520 100 S 780 40, 980 130"
              pathLength={1}
              strokeWidth="6"
              opacity={0.55}
            />
          </svg>
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
              Construis ton calendrier objectif par objectif, avec plan nutrition et check matériel liés à chaque parcours.
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
              FuelOS, la plateforme
              <br />
              nutrition de l&apos;athlète
            </h1>
            <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)", fontSize: 13, lineHeight: 1.5 }}>
              Profil physiologique, plans courses, mode race live et catalogue produits orienté performance.
            </p>
          </div>

          <div
            className="fuel-landing-v2__kpis"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 2,
            }}
            aria-label="Repères FuelOS"
          >
            {[
              { k: "CHO/h", v: "60-90g", t: "ciblage course" },
              { k: "Hydratation", v: "ml/h", t: "ajustée météo" },
              { k: "Sodium", v: "mg/h", t: "pertes perso" },
            ].map((item) => (
              <div
                key={item.k}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  padding: "8px 6px",
                  textAlign: "center",
                  background: "color-mix(in srgb, var(--color-bg-subtle) 45%, var(--color-bg-card))",
                }}
              >
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: ".06em", color: "var(--color-text-muted)" }}>{item.k}</p>
                <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 900, color: "var(--color-text)" }}>{item.v}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--color-text-muted)" }}>{item.t}</p>
              </div>
            ))}
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
              "linear-gradient(160deg, rgba(89,36,7,.22), color-mix(in srgb, var(--color-primary-dark) 18%, rgba(15,23,42,.42))), url('/landing-right.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <svg
            viewBox="0 0 1000 260"
            aria-hidden
            className="fuel-landing-v2__brand-line fuel-landing-v2__brand-line--right"
            style={{ right: "-6%", top: "9%", width: "106%", maxWidth: "none", left: "auto" }}
          >
            <path
              className="fuel-landing-v2__brand-line-path"
              d="M1040 205 C 860 28, 680 245, 440 118 S 140 32, -40 88"
              pathLength={1}
              strokeWidth="11"
            />
            <path
              className="fuel-landing-v2__brand-line-path"
              d="M980 168 C 820 48, 620 200, 400 92 S 180 38, 20 128"
              pathLength={1}
              strokeWidth="6"
              opacity={0.55}
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
              Pilote tes prises en live selon topographie, vitesse, fréquence cardiaque et historique digestif.
            </p>
          </div>
        </section>
      </main>

      <footer
        className="fuel-landing-v2__footer"
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-bg-card)",
          padding: "12px var(--fuel-landing-inline) 14px",
          display: "grid",
          gap: 10,
          gridTemplateColumns: "minmax(140px, 220px) repeat(4, minmax(120px, 1fr))",
          alignItems: "start",
        }}
      >
        <div>
          <FuelBrandWordmark size={26} style={{ display: "block" }} />
          <p style={{ margin: "5px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
            Endurance nutrition system
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
