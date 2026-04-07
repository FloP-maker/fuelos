import { Header } from '../components/Header';
import { SectionBreadcrumb } from '../components/SectionBreadcrumb';

export default function PrivacyPage() {
  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={{ paddingTop: 24 }}>
        <SectionBreadcrumb />
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
          Confidentialite
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 760 }}>
          Cette page sert de base pour la politique de confidentialite: donnees collectees, finalites, retention,
          droits utilisateurs et contact RGPD.
        </p>
      </main>
    </div>
  );
}
