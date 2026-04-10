import type { FuelPlan, ShoppingItem, TimelineItem } from '@/app/lib/types';
import type { RaceEntry } from '@/lib/types/race';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function parseFuelPlan(raw: unknown): FuelPlan | null {
  if (!isRecord(raw)) return null;
  const timeline = raw.timeline;
  if (!Array.isArray(timeline)) return null;
  const choPerHour = Number(raw.choPerHour);
  const waterPerHour = Number(raw.waterPerHour);
  const sodiumPerHour = Number(raw.sodiumPerHour);
  const totalCalories = Number(raw.totalCalories);
  if (!Number.isFinite(choPerHour)) return null;
  return {
    choPerHour,
    waterPerHour: Number.isFinite(waterPerHour) ? waterPerHour : 0,
    sodiumPerHour: Number.isFinite(sodiumPerHour) ? sodiumPerHour : 0,
    totalCalories: Number.isFinite(totalCalories) ? totalCalories : 0,
    timeline: timeline as TimelineItem[],
    shoppingList: Array.isArray(raw.shoppingList)
      ? (raw.shoppingList.filter((x) => isRecord(x) && typeof x.productId === 'string') as ShoppingItem[])
      : [],
    warnings: Array.isArray(raw.warnings) ? (raw.warnings as string[]) : [],
  };
}

type DebriefSnapshotParsed = {
  compliance: number | null;
  energyLevel: string | null;
  finishedAt: string | null;
  stomachScore: number | null;
  autoInsight: string | null;
  planTimeline: TimelineItem[];
  consumedItems: number[];
  notes: string | null;
};

function parseDebriefSnapshot(raw: unknown): DebriefSnapshotParsed | null {
  if (!isRecord(raw)) return null;
  const compliance = raw.compliance != null ? Number(raw.compliance) : null;
  const energyLevel = typeof raw.energyLevel === 'string' ? raw.energyLevel : null;
  const finishedAt = typeof raw.finishedAt === 'string' ? raw.finishedAt : null;
  const feedback = isRecord(raw.feedback) ? raw.feedback : null;
  const stomachScore =
    feedback?.stomachScore != null && Number.isFinite(Number(feedback.stomachScore))
      ? Number(feedback.stomachScore)
      : null;
  const autoInsight = typeof feedback?.autoInsight === 'string' ? feedback.autoInsight : null;
  const plan = isRecord(raw.plan) ? raw.plan : null;
  const timeline = plan?.timeline;
  const planTimeline = Array.isArray(timeline) ? (timeline as TimelineItem[]) : [];
  const raceState = isRecord(raw.raceState) ? raw.raceState : null;
  const consumed = raceState?.consumedItems;
  const consumedItems = Array.isArray(consumed)
    ? consumed.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
    : [];
  const notes = typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes.trim() : null;

  return {
    compliance: compliance != null && Number.isFinite(compliance) ? compliance : null,
    energyLevel,
    finishedAt,
    stomachScore,
    autoInsight,
    planTimeline,
    consumedItems,
    notes,
  };
}

export function formatTimelineTime(timeMin: number): string {
  if (!Number.isFinite(timeMin) || timeMin < 0) return '—';
  if (timeMin < 60) return `T+${Math.round(timeMin)}min`;
  const h = Math.floor(timeMin / 60);
  const m = Math.round(timeMin % 60);
  return `${h}h${String(m).padStart(2, '0')}`;
}

function timelineProductNameById(timeline: TimelineItem[], productId: string): string {
  const hit = timeline.find((t) => t.productId === productId);
  return hit?.product?.trim() || productId;
}

const TYPE_FR: Record<string, string> = {
  gel: 'Gel',
  drink: 'Boisson',
  bar: 'Barre',
  chew: 'Chewing',
  'real-food': 'Solide',
};

function typeLabel(type: string | undefined): string {
  if (!type) return '—';
  return TYPE_FR[type] ?? type;
}

function stomachEmoji(score: number | null): string {
  if (score === 1) return '🤢';
  if (score === 2) return '😣';
  if (score === 3) return '😐';
  if (score === 4) return '🙂';
  if (score === 5) return '😄';
  return '—';
}

function energyEmoji(level: string | null): string {
  if (level === 'good') return '🔋';
  if (level === 'ok') return '⚡';
  if (level === 'bad') return '🪫';
  return '—';
}

function formatLongDate(dateStr: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return dateStr;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, mo, d));
}

function formatGeneratedAt(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export type RaceExportViewProps = {
  race: RaceEntry;
  /** ISO — affichée en en-tête comme date de génération */
  generatedAtIso: string;
};

export function RaceExportView({ race, generatedAtIso }: RaceExportViewProps) {
  const planSnap = race.planSnapshot;
  const fuelPlan =
    planSnap && typeof planSnap === 'object' && 'fuelPlan' in planSnap
      ? parseFuelPlan((planSnap as { fuelPlan?: unknown }).fuelPlan)
      : null;

  const debrief =
    race.debriefSnapshot != null ? parseDebriefSnapshot(race.debriefSnapshot) : null;

  const elevation =
    race.elevationGain != null && Number.isFinite(race.elevationGain)
      ? `${Math.round(race.elevationGain)} m D+`
      : null;
  const metaBits = [
    race.sport,
    `${race.distance} km`,
    elevation,
    formatLongDate(race.date),
    race.location?.trim() || null,
  ].filter(Boolean);

  return (
    <div
      className="mx-auto max-w-[720px] bg-white px-8 py-8 text-zinc-900 print:max-w-none print:px-6 print:py-4 print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]"
      style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-4 print:break-inside-avoid">
        <span className="text-xl font-extrabold text-[#16a34a]">FuelOS</span>
        <span className="text-right text-sm text-zinc-500">
          Généré le {formatGeneratedAt(generatedAtIso)}
        </span>
      </header>

      <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl print:break-inside-avoid">
        {race.name}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 print:break-inside-avoid">{metaBits.join(' · ')}</p>

      <section className="mt-10 print:break-inside-avoid">
        <h2 className="border-b border-zinc-300 pb-2 font-display text-lg font-bold text-zinc-900">
          Plan nutritionnel
        </h2>
        {!fuelPlan ? (
          <p className="mt-4 text-zinc-600">Plan non disponible pour cette course</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3">
              <div className="text-center text-sm sm:text-left">
                <div className="font-semibold text-zinc-800">⚡ {fuelPlan.choPerHour} g CHO/h</div>
              </div>
              <div className="text-center text-sm sm:text-left">
                <div className="font-semibold text-zinc-800">💧 {fuelPlan.waterPerHour} ml eau/h</div>
              </div>
              <div className="text-center text-sm sm:text-left">
                <div className="font-semibold text-zinc-800">🧂 {fuelPlan.sodiumPerHour} mg Na/h</div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto print:break-inside-avoid">
              <table className="w-full border-collapse text-left text-sm print:text-xs">
                <thead>
                  <tr className="border-b border-zinc-300 bg-zinc-100">
                    <th className="p-2 font-semibold">Heure</th>
                    <th className="p-2 font-semibold">Produit</th>
                    <th className="p-2 font-semibold">Type</th>
                    <th className="p-2 font-semibold">CHO</th>
                    <th className="p-2 font-semibold">Eau</th>
                    <th className="p-2 font-semibold">Na</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelPlan.timeline.map((row, i) => (
                    <tr
                      key={`${row.timeMin}-${i}-${row.productId}`}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}
                    >
                      <td className="p-2 align-top tabular-nums text-zinc-800">
                        {formatTimelineTime(row.timeMin)}
                      </td>
                      <td className="p-2 align-top text-zinc-800">
                        <div>{row.product}</div>
                        {row.alert ? (
                          <div className="mt-0.5 text-xs italic text-zinc-500">{row.alert}</div>
                        ) : null}
                      </td>
                      <td className="p-2 align-top text-zinc-700">{typeLabel(row.type)}</td>
                      <td className="p-2 align-top tabular-nums">{row.cho ?? '—'}</td>
                      <td className="p-2 align-top tabular-nums">
                        {row.water != null ? `${row.water}` : '—'}
                      </td>
                      <td className="p-2 align-top tabular-nums">
                        {row.sodium != null ? `${row.sodium}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {fuelPlan ? (
        <section className="mt-10 print:break-inside-avoid">
          <h2 className="border-b border-zinc-300 pb-2 font-display text-lg font-bold text-zinc-900">
            Liste de courses 🛒
          </h2>
          <ul className="mt-4 list-none space-y-2 text-sm">
            {fuelPlan.shoppingList.map((item, idx) => {
              const name = timelineProductNameById(fuelPlan.timeline, item.productId);
              return (
                <li key={`${item.productId}-${idx}`} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-[#16a34a] print:mt-0"
                    aria-label={`Cocher ${name}`}
                  />
                  <span>
                    {item.quantity}× {name}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <p className="mt-10 text-center text-xs text-zinc-400 print:mt-8">
        Généré par FuelOS — fuelos.app
      </p>

      <section className="mt-10 print:break-inside-avoid">
        <h2 className="border-b border-zinc-300 pb-2 font-display text-lg font-bold text-zinc-900">
          Débrief post-course
        </h2>
        {!debrief ? (
          <p className="mt-4 text-zinc-600">Débrief non encore complété.</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 print:grid-cols-3">
              <div className="text-sm">
                <span className="font-semibold text-zinc-800">
                  {stomachEmoji(debrief.stomachScore)}/5 estomac
                </span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-zinc-800">
                  {debrief.compliance != null ? `${Math.round(debrief.compliance)}` : '—'}% plan suivi
                </span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-zinc-800">
                  {energyEmoji(debrief.energyLevel)} énergie
                </span>
              </div>
            </div>

            {debrief.consumedItems.length > 0 && debrief.planTimeline.length > 0 ? (
              <div className="mt-6">
                <h3 className="mb-2 font-semibold text-zinc-800">Prises effectuées</h3>
                <div className="overflow-x-auto print:break-inside-avoid">
                  <table className="w-full border-collapse text-left text-sm print:text-xs">
                    <thead>
                      <tr className="border-b border-zinc-300 bg-zinc-100">
                        <th className="p-2 font-semibold">Heure</th>
                        <th className="p-2 font-semibold">Produit</th>
                        <th className="p-2 font-semibold">CHO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debrief.consumedItems.map((idx, i) => {
                        const row = debrief.planTimeline[idx];
                        if (!row) return null;
                        return (
                          <tr key={`c-${idx}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                            <td className="p-2 tabular-nums">{formatTimelineTime(row.timeMin)}</td>
                            <td className="p-2">{row.product}</td>
                            <td className="p-2 tabular-nums">{row.cho ?? '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {debrief.autoInsight ? (
              <div className="mt-6 rounded-lg border border-green-200 bg-[#f0fdf4] p-4 print:break-inside-avoid">
                <div className="flex gap-2">
                  <span aria-hidden>💡</span>
                  <div>
                    <div className="font-bold text-zinc-900">Insight FuelOS</div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-700">{debrief.autoInsight}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {debrief.notes ? (
              <div className="mt-6 print:break-inside-avoid">
                <h3 className="mb-1 font-semibold text-zinc-800">Notes</h3>
                <p className="text-sm italic leading-relaxed text-zinc-600">{debrief.notes}</p>
              </div>
            ) : null}
          </>
        )}
      </section>

      <footer className="mt-12 hidden border-t border-zinc-200 pt-4 text-center text-[11px] leading-relaxed text-zinc-500 print:block print:break-inside-avoid">
        <p>
          Fiche générée par FuelOS · fuelos.app · {formatGeneratedAt(generatedAtIso)}
        </p>
        <p className="mt-1">
          Les recommandations nutritionnelles ne remplacent pas un suivi professionnel.
        </p>
      </footer>
    </div>
  );
}
