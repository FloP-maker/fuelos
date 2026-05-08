import Link from "next/link";

export const dynamic = "force-dynamic";

function hintFromError(error: string): string {
  switch (error) {
    case "Configuration":
      return "Configuration serveur invalide. Vérifiez AUTH_SECRET, DATABASE_URL et les variables Google.";
    case "AccessDenied":
      return "Accès refusé par le fournisseur ou par la logique d'autorisation.";
    case "Verification":
      return "Le lien de connexion e-mail est invalide ou expiré.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
      return "Erreur pendant la connexion OAuth (Google). Vérifiez aussi l'URL de callback autorisée côté Google Cloud.";
    case "Callback":
      return "La réponse de callback n'a pas pu être traitée correctement.";
    case "OAuthAccountNotLinked":
      return "Cet e-mail est déjà lié à un autre mode de connexion. Connectez-vous avec la méthode initiale.";
    default:
      return "Erreur d'authentification. Consultez le diagnostic serveur.";
  }
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : "Unknown";

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
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <p style={{ marginBottom: 16 }}>
          <Link href="/" style={{ color: "var(--color-accent)" }}>
            ← Retour accueil
          </Link>
        </p>

        <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Connexion impossible</h1>
        <p style={{ margin: "0 0 18px", color: "var(--color-text-muted)", fontSize: 14, lineHeight: 1.55 }}>
          {hintFromError(error)}
        </p>

        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: 14,
            background: "var(--color-bg-card)",
            marginBottom: 14,
          }}
        >
          <p style={{ margin: 0, fontSize: 13 }}>
            <strong>Code erreur Auth.js :</strong> <code>{error}</code>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/api/auth/signin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 700,
              color: "white",
              background: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            Réessayer la connexion
          </Link>
          <Link
            href="/debug/auth"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 700,
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
              textDecoration: "none",
            }}
          >
            Ouvrir le diagnostic
          </Link>
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          Pour Google OAuth, l'URL autorisée doit correspondre exactement a{" "}
          <code>/api/auth/callback/google</code> sur votre domaine.
        </p>
      </div>
    </div>
  );
}
