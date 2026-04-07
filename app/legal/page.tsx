import { Header } from '../components/Header';
import { SectionBreadcrumb } from '../components/SectionBreadcrumb';

export default function LegalPage() {
  return (
    <div className="fuel-page">
      <Header sticky />
      <main className="fuel-main" style={{ paddingTop: 24 }}>
        <SectionBreadcrumb />
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
          Mentions legales
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 760 }}>
          Cette page sert de base pour les mentions legales de l'application FuelOS. Completer avec les informations
          editeur, hebergement, contact et responsabilites.
        </p>
      </main>
    </div>
  );
}
