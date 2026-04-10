'use client';

import type { LearnedNutritionProfile } from '@/lib/nutrition-profile';
import { stomachEmojiFromRoundedScore } from '@/lib/nutrition-profile';
import { InsightCard } from './InsightCard';
import { NextRaceReco } from './NextRaceReco';

function metricAccent(choTrend: LearnedNutritionProfile['choTrend']): string {
  if (choTrend === 'under') return '#ea580c';
  if (choTrend === 'on_target') return '#16a34a';
  if (choTrend === 'over') return '#2563eb';
  return 'var(--color-border)';
}

function energyEmoji(avg: number | null): string {
  if (avg == null) return '—';
  if (avg < 1.5) return '🪫';
  if (avg <= 2.5) return '⚡';
  return '🔋';
}

function stomachTrendArrow(trend: LearnedNutritionProfile['stomachTrend']): { char: string; color: string } {
  if (trend === 'improving') return { char: '↗️', color: '#16a34a' };
  if (trend === 'declining') return { char: '↘️', color: '#ea580c' };
  return { char: '→', color: '#9ca3af' };
}

export function NutritionProfileSkeleton() {
  const pulse = {
    animation: 'fuelos-np-pulse 1.1s ease-in-out infinite',
    borderRadius: 12,
    background: 'color-mix(in srgb, var(--color-text-muted) 16%, var(--color-bg-card))',
  } as const;

  return (
    <>
      <style>{`
        @keyframes fuelos-np-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 6,
          marginBottom: 8,
          scrollSnapType: 'x mandatory',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              ...pulse,
              flex: '0 0 min(200px, 72vw)',
              scrollSnapAlign: 'start',
              height: 96,
            }}
          />
        ))}
      </div>
    </>
  );
}

export function NutritionProfileCard({ profile }: { profile: LearnedNutritionProfile }) {
  const n = profile.debriefCount;
  const choColor = metricAccent(profile.choTrend);
  const trendArrow = stomachTrendArrow(profile.stomachTrend);
  const stomachEmoji =
    profile.avgStomachScore != null ? stomachEmojiFromRoundedScore(profile.avgStomachScore) : '—';

  const showInsightsCol = profile.insights.length > 0 || profile.nextRaceRecommendation != null;

  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: '1fr',
        }}
        className={`nutrition-profile-grid${showInsightsCol ? ' has-side' : ''}`}
      >
        <style>{`
          @media (min-width: 900px) {
            .nutrition-profile-grid.has-side {
              grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(280px, 1fr);
              align-items: start;
            }
            .nutrition-profile-metrics {
              display: contents;
            }
            .nutrition-profile-metric-cell {
              min-width: 0;
            }
            .nutrition-profile-insights-col {
              grid-column: 4;
              grid-row: 1 / span 999;
            }
          }
        `}</style>

        <div
          className="nutrition-profile-metrics"
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 6,
            scrollSnapType: 'x mandatory',
          }}
        >
          <div
            className="nutrition-profile-metric-cell"
            style={{
              flex: '0 0 min(200px, 80vw)',
              scrollSnapAlign: 'start',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: '12px 14px',
              background: 'var(--color-bg-card)',
              borderLeft: `4px solid ${choColor}`,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>⚡</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: choColor }}>
              {profile.avgActualChoPerHour != null
                ? `${Math.round(profile.avgActualChoPerHour)}g/h réel`
                : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              planifié :{' '}
              {profile.avgPlanChoPerHour != null ? `${Math.round(profile.avgPlanChoPerHour)}g/h` : '—'}
            </div>
          </div>

          <div
            className="nutrition-profile-metric-cell"
            style={{
              flex: '0 0 min(200px, 80vw)',
              scrollSnapAlign: 'start',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: '12px 14px',
              background: 'var(--color-bg-card)',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>🫃</div>
            <div style={{ fontSize: 22, lineHeight: 1.2 }}>
              {stomachEmoji}{' '}
              <span style={{ fontSize: 16, color: trendArrow.color }} aria-hidden>
                {trendArrow.char}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {profile.avgStomachScore != null
                ? `${profile.avgStomachScore.toFixed(1)}/5 sur ${n} course${n > 1 ? 's' : ''}`
                : `— sur ${n} course${n > 1 ? 's' : ''}`}
            </div>
          </div>

          <div
            className="nutrition-profile-metric-cell"
            style={{
              flex: '0 0 min(200px, 80vw)',
              scrollSnapAlign: 'start',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: '12px 14px',
              background: 'var(--color-bg-card)',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>🔋</div>
            <div style={{ fontSize: 22 }}>{energyEmoji(profile.avgEnergyScore)}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              sur {n} course{n > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {showInsightsCol ? (
          <div className="nutrition-profile-insights-col" style={{ minWidth: 0 }}>
            {profile.insights.length > 0 ? (
              <>
                <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800 }}>Tes insights personnels</h3>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Basé sur {profile.debriefCount} course{profile.debriefCount > 1 ? 's' : ''} — mis à jour après
                  chaque débrief
                </p>
                <div style={{ display: 'grid', gap: 10 }}>
                  {profile.insights.map((insight) => (
                    <InsightCard key={insight.id + insight.generatedAt} insight={insight} />
                  ))}
                </div>
              </>
            ) : null}
            {profile.nextRaceRecommendation ? <NextRaceReco reco={profile.nextRaceRecommendation} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
