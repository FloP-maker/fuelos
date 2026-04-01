import Link from 'next/link';

type LearnItem = {
  title: string;
  value: string;
  why: string;
  sourceLabel: string;
  sourceUrl: string;
};

const keyNumbers: LearnItem[] = [
  {
    title: 'Apport glucidique en endurance',
    value: '30-60 g/h (jusqu a 90 g/h si intestin entraine)',
    why: 'Aide a maintenir la performance et limiter la baisse d energie sur efforts prolonges.',
    sourceLabel: 'AIS Sports Supplement Framework',
    sourceUrl: 'https://www.ais.gov.au/nutrition/supplements/group_a',
  },
  {
    title: 'Hydratation de base a l effort',
    value: 'Environ 400-800 ml/h selon chaleur, intensite et sudation',
    why: 'Reduit le risque de dehydration sans surconsommation hydrique.',
    sourceLabel: 'American College of Sports Medicine',
    sourceUrl:
      'https://journals.lww.com/acsm-msse/fulltext/2016/03000/exercise_and_fluid_replacement.22.aspx',
  },
  {
    title: 'Sodium pendant l effort long',
    value: '300-600 mg/h (ajuster selon perte sudorale)',
    why: 'Peut aider a maintenir l equilibre hydrique chez les athletes qui transpirent beaucoup.',
    sourceLabel: 'IOC Consensus Statement (Dietary Supplements and the High-Performance Athlete)',
    sourceUrl: 'https://bjsm.bmj.com/content/52/7/439',
  },
  {
    title: 'Cafeine pour la performance',
    value: '3-6 mg/kg, 30-60 min avant',
    why: 'Peut ameliorer vigilance, perception de l effort et performance en endurance.',
    sourceLabel: 'International Society of Sports Nutrition Position Stand',
    sourceUrl: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-021-00445-4',
  },
];

const practicalTips: LearnItem[] = [
  {
    title: 'Tester en entrainement, pas en jour de course',
    value: 'Repeter la meme strategie sur sorties cles',
    why: 'Permet de valider la tolerance digestive et la praticite logistique.',
    sourceLabel: 'Australian Institute of Sport - Competition nutrition',
    sourceUrl: 'https://www.ais.gov.au/nutrition',
  },
  {
    title: 'Combiner glucose + fructose',
    value: 'Melange multi-transportable pour apports eleves',
    why: 'Peut augmenter l oxydation des glucides exogenes et limiter l inconfort chez certains athletes.',
    sourceLabel: 'Jeukendrup - Carbohydrate intake during exercise',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/19478342/',
  },
  {
    title: 'Planifier la prise avant d avoir faim/soif',
    value: 'Rappels toutes les 15-20 minutes',
    why: 'Aide a lisser les apports et eviter les gros ecarts en fin d epreuve.',
    sourceLabel: 'ACSM hydration and fueling guidance',
    sourceUrl:
      'https://journals.lww.com/acsm-msse/fulltext/2016/03000/exercise_and_fluid_replacement.22.aspx',
  },
  {
    title: 'Ajuster selon conditions',
    value: 'Chaleur, altitude, duree, intensite modifient les besoins',
    why: 'La strategie optimale varie selon le contexte et le profil de l athlete.',
    sourceLabel: 'IOC Consensus on Sports Nutrition',
    sourceUrl: 'https://bjsm.bmj.com/content/52/7/439',
  },
];

function Card({ item }: { item: LearnItem }) {
  return (
    <article
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 16,
        background: 'var(--color-bg-card)',
      }}
    >
      <h3 style={{ margin: 0, fontSize: 16 }}>{item.title}</h3>
      <p style={{ margin: '8px 0 6px', fontWeight: 600 }}>{item.value}</p>
      <p style={{ margin: '0 0 10px', color: 'var(--color-text-muted)', fontSize: 14 }}>{item.why}</p>
      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
        Source: {item.sourceLabel}
      </a>
    </article>
  );
}

export default function LearnPage() {
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Learn</h1>
          <p style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
            Ressources educationnelles accessibles meme sans donnees personnelles.
          </p>
        </div>
        <Link
          href="/"
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '8px 12px',
            textDecoration: 'none',
          }}
        >
          Retour accueil
        </Link>
      </div>

      <section style={{ marginTop: 26 }}>
        <h2 style={{ marginBottom: 10 }}>Reperes utiles</h2>
        <p style={{ marginTop: 0, color: 'var(--color-text-muted)' }}>
          Ces chiffres servent de base, puis se personnalisent selon votre reponse individuelle.
        </p>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {keyNumbers.map((item) => (
            <Card key={item.title} item={item} />
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
            <Card key={item.title} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
