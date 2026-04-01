'use client';

import Link from 'next/link';
import usePageTitle from '../lib/hooks/usePageTitle';

type LearnItem = {
  id: string;
  category: 'Repere' | 'Conseil';
  title: string;
  subtitle: string;
  value: string;
  why: string;
  details: string[];
  imageUrl: string;
  imageAlt: string;
  sourceLabel: string;
  sourceUrl: string;
};

const keyNumbers: LearnItem[] = [
  {
    id: 'cho-endurance',
    category: 'Repere',
    title: 'Apport glucidique en endurance',
    subtitle: 'Carburant principal sur efforts longs',
    value: '30-60 g/h (jusqu a 90 g/h si intestin entraine)',
    why: 'Aide a maintenir la performance et limiter la baisse d energie sur efforts prolonges.',
    details: [
      'Commencer plutot vers la borne basse puis augmenter progressivement.',
      'Fractionner les prises toutes les 15-20 minutes pour mieux tolerer.',
      'Tester les produits en conditions proches de la course.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Coureuse en tenue d endurance sur route',
    sourceLabel: 'AIS Sports Supplement Framework',
    sourceUrl: 'https://www.ais.gov.au/nutrition/supplements/group_a',
  },
  {
    id: 'hydration-base',
    category: 'Repere',
    title: 'Hydratation de base a l effort',
    subtitle: 'Volume ajustable selon environnement',
    value: 'Environ 400-800 ml/h selon chaleur, intensite et sudation',
    why: 'Reduit le risque de dehydration sans surconsommation hydrique.',
    details: [
      'Visez une strategie flexible selon meteo et duree.',
      'Le poids avant/apres seance peut aider a mieux calibrer les besoins.',
      'Eviter de boire uniquement a la sensation de soif sur efforts longs.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Athlete qui boit pendant une sortie longue',
    sourceLabel: 'American College of Sports Medicine',
    sourceUrl:
      'https://journals.lww.com/acsm-msse/fulltext/2016/03000/exercise_and_fluid_replacement.22.aspx',
  },
  {
    id: 'sodium-long',
    category: 'Repere',
    title: 'Sodium pendant l effort long',
    subtitle: 'Ajustement selon pertes sudorales',
    value: '300-600 mg/h (ajuster selon perte sudorale)',
    why: 'Peut aider a maintenir l equilibre hydrique chez les athletes qui transpirent beaucoup.',
    details: [
      'Particulierement utile en ambiance chaude et humide.',
      'A integrer via boisson, gels ou capsules selon tolerance.',
      'Les besoins varient fortement d un athlete a l autre.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Boissons et nutrition sportive poses sur une table',
    sourceLabel: 'IOC Consensus Statement (Dietary Supplements and the High-Performance Athlete)',
    sourceUrl: 'https://bjsm.bmj.com/content/52/7/439',
  },
  {
    id: 'caffeine-performance',
    category: 'Repere',
    title: 'Cafeine pour la performance',
    subtitle: 'Effet ergogene dose-dependant',
    value: '3-6 mg/kg, 30-60 min avant',
    why: 'Peut ameliorer vigilance, perception de l effort et performance en endurance.',
    details: [
      'Commencer bas si sensibilite a la cafeine.',
      'Eviter de tester une premiere fois le jour J.',
      'Prendre en compte la qualite du sommeil autour de la course.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Tasse de cafe sur table en bois',
    sourceLabel: 'International Society of Sports Nutrition Position Stand',
    sourceUrl: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-021-00445-4',
  },
];

const practicalTips: LearnItem[] = [
  {
    id: 'test-training',
    category: 'Conseil',
    title: 'Tester en entrainement, pas en jour de course',
    subtitle: 'Securiser la strategie avant l evenement',
    value: 'Repeter la meme strategie sur sorties cles',
    why: 'Permet de valider la tolerance digestive et la praticite logistique.',
    details: [
      'Simuler horaires et intensites de la course.',
      'Noter ce qui passe bien ou non juste apres la seance.',
      'Ajuster un parametre a la fois pour isoler les effets.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Athlete en seance d entrainement exterieur',
    sourceLabel: 'Australian Institute of Sport - Competition nutrition',
    sourceUrl: 'https://www.ais.gov.au/nutrition',
  },
  {
    id: 'glucose-fructose',
    category: 'Conseil',
    title: 'Combiner glucose + fructose',
    subtitle: 'Strategie multi-transportable',
    value: 'Melange multi-transportable pour apports eleves',
    why: 'Peut augmenter l oxydation des glucides exogenes et limiter l inconfort chez certains athletes.',
    details: [
      'Utile quand l objectif est de monter au-dela de 60 g/h.',
      'Verifier la tolerance digestive de la marque choisie.',
      'Associer a une hydratation reguliere pour faciliter l absorption.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Produits nutrition sportive et gels energetiques',
    sourceLabel: 'Jeukendrup - Carbohydrate intake during exercise',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/19478342/',
  },
  {
    id: 'schedule-intake',
    category: 'Conseil',
    title: 'Planifier la prise avant d avoir faim/soif',
    subtitle: 'Regularite plutot que compensation tardive',
    value: 'Rappels toutes les 15-20 minutes',
    why: 'Aide a lisser les apports et eviter les gros ecarts en fin d epreuve.',
    details: [
      'Programmer une alerte montre peut simplifier le suivi.',
      'Adapter les quantites par tranche selon allure et terrain.',
      'Eviter les grosses prises ponctuelles difficiles a tolerer.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Montre de sport affichant un chronometre',
    sourceLabel: 'ACSM hydration and fueling guidance',
    sourceUrl:
      'https://journals.lww.com/acsm-msse/fulltext/2016/03000/exercise_and_fluid_replacement.22.aspx',
  },
  {
    id: 'adjust-context',
    category: 'Conseil',
    title: 'Ajuster selon conditions',
    subtitle: 'Personnalisation en temps reel',
    value: 'Chaleur, altitude, duree, intensite modifient les besoins',
    why: 'La strategie optimale varie selon le contexte et le profil de l athlete.',
    details: [
      'Prevoir une version A (standard) et B (chaleur) du plan.',
      'Revoir les besoins si allure, temperature ou duree changent.',
      'Apprendre de chaque course pour affiner la prochaine.',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Route de montagne avec conditions variables',
    sourceLabel: 'IOC Consensus on Sports Nutrition',
    sourceUrl: 'https://bjsm.bmj.com/content/52/7/439',
  },
];

function Card({ item }: { item: LearnItem }) {
  return (
    <details
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        padding: 0,
        background: 'var(--color-bg-card)',
        overflow: 'hidden',
      }}
    >
      <summary style={{ listStyle: 'none', cursor: 'pointer' }}>
        <img src={item.imageUrl} alt={item.imageAlt} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
        <div style={{ padding: 14 }}>
          <div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 99, fontSize: 11, border: '1px solid var(--color-border)', marginBottom: 8 }}>
            {item.category}
          </div>
          <h3 style={{ margin: 0, fontSize: 16 }}>{item.title}</h3>
          <p style={{ margin: '4px 0 8px', color: 'var(--color-text-muted)', fontSize: 13 }}>{item.subtitle}</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{item.value}</p>
          <p style={{ marginTop: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>Cliquer pour afficher les details</p>
        </div>
      </summary>
      <div style={{ padding: '0 14px 14px' }}>
        <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)' }}>{item.why}</p>
        <ul style={{ margin: '0 0 14px', paddingLeft: 18, display: 'grid', gap: 6 }}>
          {item.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
          Source: {item.sourceLabel}
        </a>
      </div>
    </details>
  );
}

const heroCardStyle = {
  border: '1px solid var(--color-border)',
  borderRadius: 14,
  padding: 16,
  background: 'var(--color-bg-card)',
};

export default function LearnPage() {
  usePageTitle('Learn');
  const firstItem = keyNumbers[0];

  return (
    <div>
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--color-accent)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              color: '#000',
            }}
          >
            F
          </div>
          <span style={{ fontWeight: 700, fontSize: 20 }}>FuelOS</span>
        </div>
        <Link
          href="/"
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'transparent',
            textDecoration: 'none',
            color: 'var(--color-text)',
            fontWeight: 600,
            fontSize: 14,
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
          }}
        >
          Accueil
        </Link>
      </header>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 48px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'center',
          padding: 18,
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          background:
            'linear-gradient(120deg, color-mix(in srgb, var(--color-accent) 18%, transparent) 0%, transparent 45%)',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Learn</h1>
          <p style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
            Bibliotheque educationnelle: articles cliquables, details pratiques et sources verifiables.
          </p>
        </div>
        <div />
      </div>

      <section style={{ marginTop: 24, display: 'grid', gap: 16, gridTemplateColumns: '1.6fr 1fr' }}>
        <article style={{ ...heroCardStyle, overflow: 'hidden', padding: 0 }}>
          <img src={firstItem.imageUrl} alt={firstItem.imageAlt} style={{ width: '100%', height: 220, objectFit: 'cover' }} />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 99, fontSize: 12, border: '1px solid var(--color-border)', marginBottom: 10 }}>
              Mise en avant
            </div>
            <h2 style={{ margin: '0 0 6px' }}>{firstItem.title}</h2>
            <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)' }}>{firstItem.subtitle}</p>
            <p style={{ margin: 0, fontWeight: 700 }}>{firstItem.value}</p>
          </div>
        </article>

        <aside style={heroCardStyle}>
          <h3 style={{ marginTop: 0 }}>Comment utiliser cette page</h3>
          <p style={{ marginTop: 0, color: 'var(--color-text-muted)' }}>
            Ouvre les cartes pour lire les details actionnables et garder une trace des recommandations utiles pour tes prochaines courses.
          </p>
          <p style={{ marginBottom: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>
            Chaque article inclut une source cliquable afin de verifier facilement la reference.
          </p>
        </aside>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 style={{ marginBottom: 10 }}>Reperes utiles</h2>
        <p style={{ marginTop: 0, color: 'var(--color-text-muted)' }}>
          Ces chiffres servent de base, puis se personnalisent selon votre reponse individuelle.
        </p>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {keyNumbers.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ marginBottom: 10 }}>Conseils pratiques</h2>
        <p style={{ marginTop: 0, color: 'var(--color-text-muted)' }}>
          Objectif: rendre la strategie executable en entrainement puis en competition.
        </p>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {practicalTips.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
      </section>
      </main>
    </div>
  );
}
