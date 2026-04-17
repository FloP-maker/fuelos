import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "./components/Header";
import { LandingAuthPanel } from "./components/LandingAuthPanel";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/races");
  }

  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={{ paddingTop: 28 }}>
        <section className="fuel-card" style={{ padding: 18, marginBottom: 14 }} aria-label="Connexion">
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
            Connecte-toi pour acceder a l&apos;application.
          </p>
        </section>

        <LandingAuthPanel
          title="Connexion"
          subtitle="L'acces au site est reserve aux utilisateurs connectes."
          callbackPath="/races"
        />
      </main>
    </div>
  );
}
