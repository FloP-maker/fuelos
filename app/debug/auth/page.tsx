import Link from "next/link";
import { getAuthEnvDiagnostics } from "@/lib/authEnvDiagnostics";

/** La page doit lire l’env au runtime (Vercel), pas au moment du `next build`. */
export const dynamic = "force-dynamic";

function Row({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid var(--color-border)",
        fontSize: 14,
      }}
    >
      <span>{label}</span>
      <strong style={{ color: ok ? "var(--color-accent)" : "#f87171" }}>{ok ? "oui" : "non"}</strong>
    </div>
  );
}

export default function AuthDebugPage() {
  const d = getAuthEnvDiagnostics();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "system-ui, sans-serif",
        padding: "24px 20px 48px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <p style={{ marginBottom: 16 }}>
          <Link href="/" style={{ color: "var(--color-accent)" }}>
            ← Accueil
          </Link>
        </p>
        <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>Diagnostic authentification</h1>
        <p style={{ margin: "0 0 20px", color: "var(--color-text-muted)", fontSize: 14, lineHeight: 1.5 }}>
          Indique si le <strong>serveur</strong> voit les variables (oui / non), sans afficher de secrets. Si une ligne est
          « non » alors que votre <code style={{ fontSize: 13 }}>.env</code> est rempli en local, redémarrez{' '}
          <code style={{ fontSize: 13 }}>npm run dev</code>. Sur Vercel, configurez les mêmes noms dans Environment
          Variables puis redeployez.
        </p>

        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "8px 16px 16px",
            background: "var(--color-bg-card)",
          }}
        >
          <Row label="AUTH_SECRET ou NEXTAUTH_SECRET" ok={d.hasAuthSecret} />
          <Row label="DATABASE_URL" ok={d.hasDatabaseUrl} />
          <Row label="Google : identifiant client (ID)" ok={d.hasGoogleId} />
          <Row label="Google : secret client" ok={d.hasGoogleSecret} />
          <Row label="Resend : AUTH_RESEND_KEY ou RESEND_API_KEY" ok={d.hasResendKey} />
        </div>

        <p style={{ marginTop: 20, fontSize: 14 }}>
          <strong>Fournisseurs de connexion actifs :</strong> {d.providerCount}
          {d.providerCount === 0 && (
            <span style={{ color: "#f87171" }}>
              {' — '}
              c’est pour cela que l’interface affiche « Connexion indisponible ». Ajoutez au moins la paire Google (ID +
              secret) ou une clé Resend.
            </span>
          )}
        </p>

        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 16, lineHeight: 1.5 }}>
          Environnement : {d.nodeEnv}
          {d.vercel ? " · Vercel" : ""}
          <br />
          JSON :{" "}
          <Link href="/api/debug/auth" style={{ color: "var(--color-accent)" }}>
            /api/debug/auth
          </Link>
        </p>
      </div>
    </div>
  );
}
