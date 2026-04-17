import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { Header } from "./components/Header";
import { LandingAuthPanel } from "./components/LandingAuthPanel";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/mes-plans-courses");
  }

  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={{ paddingTop: 28 }}>
        <section className="fuel-card" style={{ padding: 18, marginBottom: 14 }} aria-label="Présentation FuelOS">
          <h1
            className="font-display"
            style={{
              margin: 0,
              marginBottom: 6,
              fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)",
              fontWeight: 900,
              lineHeight: 1.08,
            }}
          >
            FuelOS
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
            Planifie ta saison, pilote ta nutrition en course et retrouve les meilleurs produits en un seul endroit.
          </p>
        </section>

        <section
          className="fuel-card"
          style={{ padding: 18, marginBottom: 14 }}
          aria-label="Modules FuelOS"
        >
          <h2 className="font-display" style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
            Les 4 menus de l&apos;app
          </h2>
          <p style={{ margin: "6px 0 14px", color: "var(--color-text-muted)" }}>
            Découvre les modules clés avant de te connecter.
          </p>

          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            }}
          >
            {[
              {
                href: "/profil",
                title: "Profil",
                emoji: "👤",
                description:
                  "Objectif à venir, analyses nutrition, connexions Garmin/Strava/Nolio et données morpho + perf.",
              },
              {
                href: "/mes-plans-courses",
                title: "Mes plans courses",
                emoji: "🗓️",
                description:
                  "Calendrier de saison, événements cliquables, détail course, GPX et shopping list selon la stratégie.",
              },
              {
                href: "/race",
                title: "Mode course",
                emoji: "🏁",
                description:
                  "Suivi nutritif en direct basé sur le GPX, la topographie, la vitesse et les données physiologiques.",
              },
              {
                href: "/produits",
                title: "Produits",
                emoji: "🧃",
                description:
                  "Catalogue des produits utiles avec image et lien vers les sites des marques.",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="fuel-card"
                style={{
                  padding: 12,
                  textDecoration: "none",
                  color: "inherit",
                  borderColor: "var(--color-border)",
                  transition: "transform .16s ease, box-shadow .16s ease",
                }}
              >
                <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
                  {item.emoji} {item.title}
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <LandingAuthPanel
          title="Connexion a FuelOS"
          subtitle="Connecte-toi pour activer tes donnees, ta saison et le mode course."
          callbackPath="/mes-plans-courses"
        />
      </main>
    </div>
  );
}
