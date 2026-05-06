// Surface 2: Plan builder (desktop) — 4 variations

function S_PlanBuilder({ tweaks }) {
  const showAnno = tweaks.annotations;
  const units = tweaks.units;
  const ml = (v) => units === 'metric' ? `${v} ml` : `${Math.round(v * 0.034)} oz`;
  const km = (v) => units === 'metric' ? `${v} km` : `${(v * 0.621).toFixed(1)} mi`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>

      {/* V1 — Wizard / step flow */}
      <WFArtboard label="V1 — Wizard" hypothesis="Linear · guided · 5 short steps · easy first plan" width={1280} height={720}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: 240, padding: 24, borderRight: `1px solid ${WF_LINE}`, background: WF_BG_FILL }}>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>build a plan</WFText>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['1 · Race', '2 · Conditions', '3 · You', '4 · Targets', '5 · Products'].map((s, i) => (
                <div key={s} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 4, background: i === 2 ? WF_BG_CARD : 'transparent', border: i === 2 ? `1px solid ${WF_LINE}` : '1px solid transparent' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, background: i < 2 ? WF_ACCENT : i === 2 ? '#fff' : WF_BG_CARD, border: `1.5px solid ${i <= 2 ? WF_ACCENT : WF_LINE}`, fontSize: 10, color: i < 2 ? '#fff' : WF_ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{i < 2 ? '✓' : ''}</div>
                  <WFText size={12} weight={i === 2 ? 600 : 400} color={i > 2 ? WF_INK_MUTED : WF_INK}>{s}</WFText>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>step 3 of 5</WFText>
              <WFH title="Tell us about you" sub="So we can scale fueling to your body and history" mt={4} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { l: 'Body weight', v: '68 kg' },
                { l: 'Sex', v: 'Male' },
                { l: 'Sweat rate', v: '0.9 L/h · tested' },
                { l: 'Stomach training', v: 'Up to 75 g/h' },
                { l: 'GI sensitivity', v: 'Mild · avoid fructose' },
                { l: 'Caffeine response', v: 'Strong' },
              ].map(f => (
                <WFBox key={f.l} padding={14}>
                  <WFText size={10} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>{f.l}</WFText>
                  <WFText size={14} weight={500} mt={4}>{f.v}</WFText>
                </WFBox>
              ))}
            </div>

            <WFBox padding={16} style={{ background: WF_BG_FILL, border: 'none' }}>
              <WFText size={11} weight={500}>↳ from your last 6 races + Strava data, we suggest 78–88 g/h.</WFText>
            </WFBox>

            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <WFBtn>← Back</WFBtn>
              <WFBtn primary>Continue →</WFBtn>
            </div>
          </div>
        </div>
        {showAnno && <WFArrowNote text="suggestions auto-fill, never empty" x={300} y={500} dir="upright" />}
      </WFArtboard>

      {/* V2 — Single-canvas tunable */}
      <WFArtboard label="V2 — Live plan" hypothesis="One canvas · drag to tune · plan reflows in real time" width={1280} height={760}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: 280, padding: 20, borderRight: `1px solid ${WF_LINE}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <WFH title="Plan controls" level={2} mb={4} />
            <WFNote>knobs on the left, plan on the right</WFNote>
            {[
              { l: 'Carbs / hour', v: '88 g', range: 0.78 },
              { l: 'Fluids / hour', v: ml(600), range: 0.6 },
              { l: 'Sodium / hour', v: '700 mg', range: 0.7 },
              { l: 'Caffeine total', v: '200 mg', range: 0.5 },
              { l: 'Race duration', v: '3h 45m', range: 0.45 },
              { l: 'Cadence', v: 'every 20 min', range: 0.55 },
            ].map(s => (
              <div key={s.l}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: WF_INK_MUTED }}>{s.l}</span>
                  <span style={{ fontWeight: 600 }}>{s.v}</span>
                </div>
                <div style={{ height: 4, background: WF_BG_FILL, borderRadius: 2, position: 'relative' }}>
                  <div style={{ height: '100%', width: `${s.range * 100}%`, background: WF_ACCENT, borderRadius: 2 }} />
                  <div style={{ position: 'absolute', left: `${s.range * 100}%`, top: -4, width: 12, height: 12, borderRadius: 999, background: '#fff', border: `1.5px solid ${WF_ACCENT}`, transform: 'translateX(-50%)' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <WFH title={`${nextRaceLabel(tweaks)} · plan`} sub="Drag intakes to retime · click to swap product" mb={0} />
              <div style={{ display: 'flex', gap: 6 }}>
                <WFPill>3:45 total</WFPill>
                <WFPill accent>329 g carbs</WFPill>
                <WFBtn sm>Save</WFBtn>
              </div>
            </div>

            <WFBox padding={0} style={{ overflow: 'hidden' }}>
              <div style={{ height: 60, background: WF_BG_FILL, position: 'relative', borderBottom: `1px solid ${WF_LINE}` }}>
                <svg viewBox="0 0 800 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <path d="M 0 50 L 80 30 L 160 35 L 240 15 L 320 25 L 400 8 L 480 22 L 560 12 L 640 28 L 720 38 L 800 45" fill="none" stroke={WF_INK_MUTED} strokeWidth="1.5" />
                  <path d="M 0 60 L 80 30 L 160 35 L 240 15 L 320 25 L 400 8 L 480 22 L 560 12 L 640 28 L 720 38 L 800 45 L 800 60 Z" fill={WF_LINE} opacity="0.5" />
                </svg>
                <div style={{ position: 'absolute', top: 6, left: 10, fontSize: 9, color: WF_INK_MUTED, textTransform: 'uppercase' }}>elevation</div>
              </div>

              {/* timeline */}
              <div style={{ padding: 16, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: WF_INK_FAINT, marginBottom: 8 }}>
                  {['0:00', '0:30', '1:00', '1:30', '2:00', '2:30', '3:00', '3:30'].map(t => <span key={t}>{t}</span>)}
                </div>
                <div style={{ height: 2, background: WF_LINE, position: 'relative' }}>
                  {[
                    { x: 8, t: 'gel', d: 'Maurten 100' },
                    { x: 17, t: 'drink', d: '500ml mix' },
                    { x: 26, t: 'gel', d: 'SiS Beta' },
                    { x: 35, t: 'gel+caf', d: 'Maurten 100 caf' },
                    { x: 44, t: 'drink', d: '500ml mix' },
                    { x: 53, t: 'gel', d: 'Maurten 100' },
                    { x: 62, t: 'gel', d: 'SiS Beta' },
                    { x: 71, t: 'gel+caf', d: 'Maurten 100 caf' },
                    { x: 80, t: 'gel', d: 'Maurten 100' },
                    { x: 89, t: 'finish kick', d: 'caffeine 50mg' },
                  ].map((it, i) => (
                    <div key={i} style={{ position: 'absolute', left: `${it.x}%`, top: -10, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 4, background: it.t.includes('caf') ? WF_INK : WF_ACCENT, color: '#fff', fontSize: 9, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.t.includes('drink') ? '◐' : it.t.includes('caf') ? '◆' : '●'}</div>
                      <div style={{ fontSize: 8, color: WF_INK_MUTED, textAlign: 'center', whiteSpace: 'nowrap', maxWidth: 80, transform: i % 2 ? 'translateY(20px)' : 'none' }}>{it.d}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 80, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: WF_INK_MUTED, paddingTop: 12, borderTop: `1px solid ${WF_BG_FILL}` }}>
                  <span>10 intakes · 6 gels · 3 bottles · 1 finish kick</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}><b style={{ color: WF_ACCENT }}>329 g</b> · target met</span>
                </div>
              </div>
            </WFBox>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { l: 'avg g/h', v: '87.7' },
                { l: 'fluid', v: '1500 ml' },
                { l: 'sodium', v: '2.6 g' },
                { l: 'caffeine', v: '200 mg' },
              ].map(s => (
                <WFBox key={s.l} padding={10}>
                  <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>{s.l}</WFText>
                  <WFText size={14} weight={600} mt={2}>{s.v}</WFText>
                </WFBox>
              ))}
            </div>
          </div>
        </div>
        {showAnno && <WFArrowNote text="targets reflow live as you drag" x={680} y={400} dir="up" />}
      </WFArtboard>

      {/* V3 — Recipe / list builder */}
      <WFArtboard label="V3 — Recipe" hypothesis="Cooking metaphor · ingredients & method · feels approachable" width={1280} height={720}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
          <div style={{ padding: 40, borderRight: `1px solid ${WF_LINE}` }}>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>plan recipe</WFText>
            <WFText size={28} weight={600} mt={6} style={{ fontFamily: 'serif' }}>{nextRaceLabel(tweaks)}</WFText>
            <WFText size={12} color={WF_INK_MUTED} mt={4}>Serves 1 · prep 14 days · "race fuel for {km(42)}"</WFText>

            <div style={{ marginTop: 24 }}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>ingredients</WFText>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
                {[
                  ['6', 'Maurten Gel 100', '600 g · 240 cal/ea'],
                  ['2', 'Maurten 100 caf', '50mg caffeine each'],
                  ['1', 'SiS Beta gel', 'tested ✓'],
                  ['3', 'Bottle · 500ml drink mix', '40g carbs/bottle'],
                  ['1', 'Salt cap · 500mg', 'h+2:00 only'],
                  ['1', 'Backup bar (drop bag)', 'flavor change'],
                ].map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 120px', gap: 8, padding: '8px 0', borderTop: i > 0 ? `1px solid ${WF_BG_FILL}` : `1px solid ${WF_LINE}`, fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>{row[0]}×</span>
                    <span>{row[1]}</span>
                    <span style={{ color: WF_INK_MUTED, fontSize: 10 }}>{row[2]}</span>
                  </div>
                ))}
              </div>
              <WFBtn ghost sm style={{ marginTop: 12 }}>+ Add ingredient</WFBtn>
            </div>
          </div>

          <div style={{ padding: 40, background: WF_BG_FILL }}>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>method</WFText>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { t: '0:00 · start', d: 'Sip from bottle 1. Don\'t take a gel yet — let HR settle.' },
                { t: '0:20', d: 'First gel (Maurten 100). Begin 20-min cadence.' },
                { t: '1:00', d: 'Drop bottle 1. Pick up bottle 2 at aid station 1.' },
                { t: '1:40', d: 'Caffeine kicks in (gel #4 · caf).' },
                { t: '2:30', d: 'Switch to SiS for flavor change. Salt cap if hot.' },
                { t: '3:20', d: 'Last gel — Maurten caf. Push.' },
                { t: '3:45 · finish', d: 'Recovery shake within 30 min.' },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 999, background: '#fff', border: `1px solid ${WF_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <WFText size={11} weight={600} color={WF_ACCENT}>{step.t}</WFText>
                    <WFText size={12} mt={2}>{step.d}</WFText>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {showAnno && <WFArrowNote text="reads like a cookbook" x={580} y={60} dir="left" />}
      </WFArtboard>

      {/* V4 — From a past race */}
      <WFArtboard label="V4 — From history" hypothesis="Start from a race that worked · diff & tweak · low-effort" width={1280} height={720}>
        <div style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <WFH title="Build from a past race" sub="Pick a race that felt good — we'll diff it against the new race and adjust" mb={0} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 16, alignItems: 'stretch', flex: 1 }}>
            <WFBox padding={20}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>source race</WFText>
                <WFPill>change</WFPill>
              </div>
              <WFText size={18} weight={600} mt={6}>Semi de Nantes 2025</WFText>
              <WFText size={11} color={WF_INK_MUTED}>21.1 km · 1h 32m · "felt great"</WFText>

              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Duration', '1h 32m'],
                  ['Carbs / h', '78 g'],
                  ['Fluids / h', '500 ml'],
                  ['Sodium / h', '500 mg'],
                  ['Caffeine', '100 mg'],
                  ['Conditions', '12° · dry'],
                ].map(r => (
                  <div key={r[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${WF_BG_FILL}` }}>
                    <span style={{ color: WF_INK_MUTED }}>{r[0]}</span>
                    <span style={{ fontWeight: 500 }}>{r[1]}</span>
                  </div>
                ))}
              </div>
            </WFBox>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 28, color: WF_ACCENT }}>→</div>
            </div>

            <WFBox padding={20} style={{ borderColor: WF_ACCENT }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <WFText size={11} color={WF_ACCENT} style={{ textTransform: 'uppercase' }}>new plan · adjusted</WFText>
                <WFPill accent>auto</WFPill>
              </div>
              <WFText size={18} weight={600} mt={6}>{nextRaceLabel(tweaks)}</WFText>
              <WFText size={11} color={WF_INK_MUTED}>{km(42)} · est. 3h 45m · 14° · partly cloudy</WFText>

              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Duration', '3h 45m', '+2h 13m'],
                  ['Carbs / h', '88 g', '+10 g'],
                  ['Fluids / h', '600 ml', '+100 ml'],
                  ['Sodium / h', '700 mg', '+200 mg'],
                  ['Caffeine', '200 mg', '+100 mg'],
                  ['Conditions', '14° · cloudy', '+2°'],
                ].map(r => (
                  <div key={r[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${WF_BG_FILL}` }}>
                    <span style={{ color: WF_INK_MUTED }}>{r[0]}</span>
                    <span style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontWeight: 500 }}>{r[1]}</span>
                      <span style={{ color: WF_ACCENT, fontSize: 10, fontWeight: 600 }}>{r[2]}</span>
                    </span>
                  </div>
                ))}
              </div>
            </WFBox>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <WFBtn primary>Use this plan →</WFBtn>
            <WFBtn>Open editor</WFBtn>
            <WFBtn ghost>Pick a different race</WFBtn>
          </div>
        </div>
        {showAnno && <WFArrowNote text="diff'd, not blank" x={620} y={420} dir="up" />}
      </WFArtboard>
    </div>
  );
}

function nextRaceLabel(tweaks) {
  return tweaks.sport === 'tri' ? 'Half Ironman · Vichy' : tweaks.sport === 'bike' ? 'Gran Fondo Ventoux' : 'Marathon de Nantes';
}

window.S_PlanBuilder = S_PlanBuilder;
window.nextRaceLabel = nextRaceLabel;
