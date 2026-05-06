// Surface 6: History · 7: Profile · 8: Integrations — combined, 4 variations each.

function S_History({ tweaks }) {
  const showAnno = tweaks.annotations;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>

      {/* V1 — Timeline */}
      <WFArtboard label="V1 — Timeline" hypothesis="Vertical scroll · year/season buckets · narrative continuity" width={1280} height={720}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100%' }}>
          <div style={{ padding: 24, borderRight: `1px solid ${WF_LINE}`, background: WF_BG_FILL }}>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>filters</WFText>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['All sports', 'Run', 'Bike', 'Tri'].map((s, i) => (
                <div key={s} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, border: `1px solid ${WF_LINE}`, background: i === 0 ? WF_INK : '#fff' }} />
                  <span style={{ color: i === 0 ? WF_INK : WF_INK_MUTED }}>{s}</span>
                </div>
              ))}
            </div>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }} mt={20}>distance</WFText>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
              {['Short (<1h)', 'Medium (1–3h)', 'Long (3–6h)', 'Ultra (6h+)'].map(s => <span key={s} style={{ color: WF_INK_MUTED }}>○ {s}</span>)}
            </div>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }} mt={20}>tags</WFText>
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['felt great', 'GI hit', 'PB', 'rainy', 'hot'].map(t => <WFPill key={t}>{t}</WFPill>)}
            </div>
          </div>

          <div style={{ padding: 32, overflow: 'auto' }}>
            <WFH title="Race history" sub="22 races logged · 5 plans evolved from this data" mb={20} />
            {[
              { year: '2026', races: [
                { date: '4 May', name: 'Marathon de Nantes', t: '3h 41m', tag: 'felt great', good: true },
                { date: '12 Apr', name: 'Semi de Nantes', t: '1h 32m', tag: 'PB', good: true },
              ]},
              { year: '2025', races: [
                { date: '14 Sep', name: 'Trail des Sources', t: '5h 12m', tag: 'GI hit', good: false },
                { date: '23 Jun', name: '10K Nantes', t: '40m 9s', tag: '', good: true },
                { date: '15 Mar', name: 'Marathon Paris', t: '3h 48m', tag: 'hot', good: true },
              ]},
            ].map(bucket => (
              <div key={bucket.year} style={{ marginBottom: 24 }}>
                <WFText size={28} weight={600} color={WF_INK_FAINT} style={{ fontFamily: 'serif' }}>{bucket.year}</WFText>
                <div style={{ marginTop: 12, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 1, background: WF_LINE }} />
                  {bucket.races.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 16, position: 'relative' }}>
                      <div style={{ width: 17, marginTop: 4, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 17, height: 17, borderRadius: 999, background: r.good ? WF_ACCENT : '#fff', border: `2px solid ${r.good ? WF_ACCENT : WF_LINE}` }} />
                      </div>
                      <WFBox padding={14} style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <WFText size={10} color={WF_INK_MUTED}>{r.date}</WFText>
                            <WFText size={14} weight={600} mt={2}>{r.name}</WFText>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {r.tag && <WFPill>{r.tag}</WFPill>}
                            <WFText size={14} weight={600} color={WF_INK} style={{ fontVariantNumeric: 'tabular-nums' }}>{r.t}</WFText>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: WF_INK_MUTED, marginTop: 8 }}>
                          <span>78 g/h</span>
                          <span>1500ml</span>
                          <span>200mg caf</span>
                          <span style={{ color: WF_ACCENT }}>open debrief →</span>
                        </div>
                      </WFBox>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {showAnno && <WFArrowNote text="orange = good race" x={300} y={400} dir="upright" />}
      </WFArtboard>

      {/* V2 — Heatmap grid */}
      <WFArtboard label="V2 — Heatmap" hypothesis="Pattern-find · rows=years · cols=months · color = how it felt" width={1280} height={680}>
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
          <WFH title="Your fueling history" sub="Each cell = 1 race · color = how it felt · click to drill in" mb={0} />

          <WFBox padding={24}>
            <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(12, 1fr)', gap: 4, fontSize: 9, color: WF_INK_MUTED }}>
              <span />
              {['J','F','M','A','M','J','J','A','S','O','N','D'].map(m => <span key={m} style={{ textAlign: 'center', textTransform: 'uppercase' }}>{m}</span>)}
              {['2026','2025','2024','2023'].map((y, ri) => (
                <React.Fragment key={y}>
                  <span style={{ fontWeight: 500, alignSelf: 'center' }}>{y}</span>
                  {Array.from({length: 12}).map((_, ci) => {
                    const seed = (ri * 13 + ci * 7) % 11;
                    const has = seed < 5 && !(ri === 0 && ci > 4);
                    const score = (seed % 5);
                    const colors = ['#e7e5e4', '#fbd5b6', '#f5b67a', '#ed8a3c', WF_ACCENT];
                    return <div key={ci} style={{ aspectRatio: '1', borderRadius: 3, background: has ? colors[score] : WF_BG_FILL, border: has ? `1px solid ${WF_LINE}` : 'none' }} />;
                  })}
                </React.Fragment>
              ))}
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 10, color: WF_INK_MUTED }}>
                <span>felt</span>
                {[0,1,2,3,4].map(i => <div key={i} style={{ width: 14, height: 14, borderRadius: 2, background: ['#e7e5e4', '#fbd5b6', '#f5b67a', '#ed8a3c', WF_ACCENT][i] }} />)}
                <span>great</span>
              </div>
              <div style={{ fontSize: 11, color: WF_INK_MUTED }}>22 races · 4 PRs · 3 GI events · 1 DNF</div>
            </div>
          </WFBox>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, flex: 1 }}>
            <WFBox padding={16}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>your sweet spot</WFText>
              <WFText size={20} weight={600} mt={6}>78–88 g/h</WFText>
              <WFText size={11} color={WF_INK_MUTED}>felt great in 14 of 22 races at this rate</WFText>
            </WFBox>
            <WFBox padding={16}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>danger zone</WFText>
              <WFText size={20} weight={600} mt={6}>fructose &gt; 30g/h</WFText>
              <WFText size={11} color={WF_INK_MUTED}>3 of 3 GI events involved high fructose</WFText>
            </WFBox>
            <WFBox padding={16}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>your worst month</WFText>
              <WFText size={20} weight={600} mt={6}>August</WFText>
              <WFText size={11} color={WF_INK_MUTED}>heat + under-fueling pattern</WFText>
            </WFBox>
          </div>
        </div>
        {showAnno && <WFArrowNote text="patterns over time" x={580} y={120} dir="up" />}
      </WFArtboard>

      {/* V3 — Compare two races */}
      <WFArtboard label="V3 — Compare" hypothesis="Pick any 2 races · diff fuel + outcome side-by-side" width={1280} height={680}>
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <WFH title="Compare races" sub="Find what made the difference" mb={0} />
            <WFBtn>+ Pick race</WFBtn>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
            {[
              { name: 'Semi de Nantes 2025', t: '1h 32m', good: true, items: [['Carbs/h', '78 g'], ['Fluids/h', '500 ml'], ['Sodium/h', '500 mg'], ['Caffeine', '100 mg'], ['Conditions', '12° dry'], ['Stomach', 'Bulletproof'], ['Energy', 'Strong throughout']] },
              { name: 'Semi Toulouse 2025', t: '1h 38m', good: false, items: [['Carbs/h', '92 g'], ['Fluids/h', '450 ml'], ['Sodium/h', '400 mg'], ['Caffeine', '200 mg'], ['Conditions', '24° hot'], ['Stomach', 'Cramps km 12'], ['Energy', 'Dropped at km 14']] },
            ].map((r, i) => (
              <WFBox key={i} padding={20} style={{ borderColor: r.good ? WF_ACCENT : WF_LINE }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <WFText size={11} color={WF_INK_MUTED}>{r.good ? 'race A · benchmark' : 'race B · compare'}</WFText>
                    <WFText size={16} weight={600} mt={4}>{r.name}</WFText>
                  </div>
                  <WFText size={20} weight={600}>{r.t}</WFText>
                </div>
                <div style={{ marginTop: 14 }}>
                  {r.items.map((row, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: j > 0 ? `1px solid ${WF_BG_FILL}` : `1px solid ${WF_LINE}`, fontSize: 12 }}>
                      <span style={{ color: WF_INK_MUTED }}>{row[0]}</span>
                      <span style={{ fontWeight: 500 }}>{row[1]}</span>
                    </div>
                  ))}
                </div>
              </WFBox>
            ))}
          </div>

          <WFBox padding={16} style={{ background: WF_BG_FILL, border: 'none' }}>
            <WFText size={11} weight={600} color={WF_ACCENT} style={{ textTransform: 'uppercase' }}>system noticed</WFText>
            <WFText size={13} mt={6}>+18% carbs · -10% sodium · 12° hotter — likely culprit: heat + low sodium + over-carbing.</WFText>
          </WFBox>
        </div>
        {showAnno && <WFArrowNote text="diff teaches more than averages" x={620} y={400} dir="down" />}
      </WFArtboard>

      {/* V4 — Search list (mobile) */}
      <WFArtboard label="V4 — Search list (mobile)" hypothesis="Phone · simple list · find by name or tag" width={760} height={720}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <WFPhone>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
              <WFText size={20} weight={600}>History</WFText>
              <div style={{ height: 36, padding: '0 12px', borderRadius: 8, background: WF_BG_FILL, display: 'flex', alignItems: 'center', fontSize: 12, color: WF_INK_MUTED }}>🔍 Search races, tags, products…</div>
              <div style={{ display: 'flex', gap: 6, overflow: 'auto' }}>
                {['All', 'Felt great', 'GI', 'Marathon', 'Trail', 'Hot', 'Wet'].map((c, i) => (
                  <div key={c} style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 999, fontSize: 11, background: i === 0 ? WF_INK : '#fff', color: i === 0 ? '#fff' : WF_INK, border: `1px solid ${i === 0 ? WF_INK : WF_LINE}` }}>{c}</div>
                ))}
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                {[
                  ['4 May', 'Marathon de Nantes', '3h 41m', '🟢'],
                  ['12 Apr', 'Semi de Nantes', '1h 32m', '🟢'],
                  ['14 Sep', 'Trail des Sources', '5h 12m', '🔴'],
                  ['23 Jun', '10K Nantes', '40m 9s', '🟢'],
                  ['15 Mar', 'Marathon Paris', '3h 48m', '🟡'],
                  ['10 Nov', 'Semi Toulouse', '1h 38m', '🔴'],
                  ['12 Oct', 'Cross Atlantique', '32m 11s', '🟢'],
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: `1px solid ${WF_BG_FILL}`, alignItems: 'center' }}>
                    <span style={{ fontSize: 14 }}>{r[3]}</span>
                    <div style={{ flex: 1 }}>
                      <WFText size={13} weight={500}>{r[1]}</WFText>
                      <WFText size={10} color={WF_INK_MUTED}>{r[0]} · {r[2]}</WFText>
                    </div>
                    <span style={{ fontSize: 14, color: WF_INK_FAINT }}>›</span>
                  </div>
                ))}
              </div>
            </div>
          </WFPhone>
        </div>
        {showAnno && <WFArrowNote text="search & glance" x={520} y={120} dir="left" />}
      </WFArtboard>
    </div>
  );
}

function S_Profile({ tweaks }) {
  const showAnno = tweaks.annotations;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>

      {/* V1 — Athlete card */}
      <WFArtboard label="V1 — Athlete card" hypothesis="At-a-glance · who you are as a fueling athlete" width={1280} height={680}>
        <div style={{ padding: 40, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, height: '100%' }}>
          <WFBox padding={24} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <WFPlaceholder height={140} label="avatar" />
            <div>
              <WFText size={20} weight={600}>Florent Poussin</WFText>
              <WFText size={11} color={WF_INK_MUTED}>Nantes · 34 · runner & cyclist</WFText>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <WFPill accent>strong stomach</WFPill>
              <WFPill>caffeine sensitive</WFPill>
              <WFPill>hot-weather rookie</WFPill>
            </div>
            <div style={{ borderTop: `1px solid ${WF_BG_FILL}`, paddingTop: 12 }}>
              <WFText size={11} color={WF_INK_MUTED}>22 races · 12 plans · 8 debriefs</WFText>
            </div>
          </WFBox>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>fueling profile</WFText>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Body weight', '68 kg', 'tracked weekly'],
                ['Sweat rate', '0.9 L/h', 'tested may 2025'],
                ['Max tested g/h', '92 g', 'last race · ✕'],
                ['Sustainable g/h', '78–88 g', '14 races avg'],
                ['Caffeine response', 'Strong', 'limit 200 mg/race'],
                ['GI flags', 'Avoid fructose-only', '3 events on file'],
                ['Preferred form', 'Gel + drink mix', '78% of races'],
                ['Flavor fatigue', 'After 2:30', 'switch flavor'],
              ].map(f => (
                <WFBox key={f[0]} padding={14}>
                  <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>{f[0]}</WFText>
                  <WFText size={14} weight={600} mt={4}>{f[1]}</WFText>
                  <WFText size={9} color={WF_INK_FAINT} mt={2}>{f[2]}</WFText>
                </WFBox>
              ))}
            </div>
          </div>
        </div>
        {showAnno && <WFArrowNote text="not a settings page · an identity card" x={420} y={70} dir="downright" />}
      </WFArtboard>

      {/* V2 — Long form / settings list */}
      <WFArtboard label="V2 — Settings list" hypothesis="Boring · functional · everything tweakable" width={1280} height={720}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100%' }}>
          <div style={{ padding: 24, borderRight: `1px solid ${WF_LINE}`, background: WF_BG_FILL }}>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>profile</WFText>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
              {['Account', 'Body & metrics', 'Fueling', 'GI & allergies', 'Caffeine', 'Preferred products', 'Units & language', 'Reminders', 'Privacy'].map((s, i) => (
                <div key={s} style={{ padding: '8px 12px', borderRadius: 4, fontSize: 12, color: i === 2 ? WF_INK : WF_INK_MUTED, fontWeight: i === 2 ? 600 : 400, background: i === 2 ? WF_BG_CARD : 'transparent' }}>{s}</div>
              ))}
            </div>
          </div>
          <div style={{ padding: 32, overflow: 'auto' }}>
            <WFH title="Fueling" sub="Defaults applied to every new plan" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                ['Default carbs/h', '88 g', 'slider · 30–120 g'],
                ['Default fluids/h', '600 ml', 'slider'],
                ['Default sodium/h', '700 mg', 'slider'],
                ['Cadence', 'every 20 min', 'segmented'],
                ['Stomach trained to', '85 g/h', 'updated from races'],
                ['Allow caffeine', 'on', 'toggle'],
                ['Caffeine limit / race', '200 mg', 'stepper'],
                ['Auto-build from history', 'on', 'toggle'],
              ].map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px 80px', gap: 12, padding: '14px 0', borderTop: i > 0 ? `1px solid ${WF_BG_FILL}` : `1px solid ${WF_LINE}`, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{row[0]}</span>
                  <div style={{ height: 8, background: WF_BG_FILL, borderRadius: 4, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${30 + i * 7}%`, background: WF_ACCENT, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{row[1]}</span>
                  <span style={{ fontSize: 10, color: WF_INK_FAINT }}>{row[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </WFArtboard>

      {/* V3 — Onboarding flow (mobile, 2 screens) */}
      <WFArtboard label="V3 — Onboarding" hypothesis="First-run · smart defaults · skip-first · learn as you go" width={760} height={720}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32, gap: 24 }}>
          <WFPhone>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>step 2 of 5</WFText>
              <div style={{ height: 3, background: WF_BG_FILL, borderRadius: 2 }}>
                <div style={{ height: '100%', width: '40%', background: WF_ACCENT, borderRadius: 2 }} />
              </div>
              <WFText size={22} weight={600} mt={10} style={{ lineHeight: 1.2 }}>What's your weight?</WFText>
              <WFText size={12} color={WF_INK_MUTED}>So we can scale fueling targets to your body.</WFText>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 64, fontWeight: 700 }}>68</span>
                  <span style={{ fontSize: 18, color: WF_INK_MUTED }}>kg</span>
                </div>
              </div>
              <div style={{ height: 4, background: WF_BG_FILL, borderRadius: 2, position: 'relative' }}>
                <div style={{ height: '100%', width: '52%', background: WF_ACCENT, borderRadius: 2 }} />
                <div style={{ position: 'absolute', left: '52%', top: -6, width: 16, height: 16, borderRadius: 999, background: '#fff', border: `2px solid ${WF_ACCENT}`, transform: 'translateX(-50%)' }} />
              </div>
              <WFBtn primary full>Continue →</WFBtn>
              <WFBtn ghost full>Skip · use 70 kg default</WFBtn>
            </div>
          </WFPhone>

          <WFPhone>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>step 4 of 5 · stomach</WFText>
              <WFText size={22} weight={600} mt={4} style={{ lineHeight: 1.2 }}>Have you trained your gut?</WFText>
              <WFText size={12} color={WF_INK_MUTED}>Honest answer — we'll start where you are.</WFText>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Never thought about it', '~ 50 g/h target'],
                  ['Sometimes train it', '~ 70 g/h target'],
                  ['Yes, regularly', '~ 90 g/h target'],
                  ['I\'m a high-carb specialist', '~ 110+ g/h'],
                ].map((opt, i) => (
                  <div key={i} style={{ padding: 14, border: `1px solid ${i === 1 ? WF_ACCENT : WF_LINE}`, borderRadius: 8, background: i === 1 ? '#fff7f3' : '#fff' }}>
                    <WFText size={13} weight={600}>{opt[0]}</WFText>
                    <WFText size={10} color={WF_INK_MUTED} mt={2}>{opt[1]}</WFText>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <WFBtn primary full>Continue →</WFBtn>
            </div>
          </WFPhone>
        </div>
        {showAnno && <WFArrowNote text="skippable, never blocking" x={300} y={70} dir="down" />}
      </WFArtboard>

      {/* V4 — Athlete graph */}
      <WFArtboard label="V4 — Athlete graph" hypothesis="Visual radar · how you've evolved over time" width={1280} height={680}>
        <div style={{ padding: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: '100%' }}>
          <WFBox padding={24}>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>your fueling shape</WFText>
            <WFText size={11} color={WF_INK_FAINT} mt={2}>now (orange) vs. 12 months ago (grey)</WFText>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="-150 -150 300 300" width="320" height="320">
                {[1, 0.75, 0.5, 0.25].map(r => (
                  <polygon key={r} points={Array.from({length: 6}, (_, i) => {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    return `${Math.cos(a) * 120 * r},${Math.sin(a) * 120 * r}`;
                  }).join(' ')} fill="none" stroke={WF_LINE} strokeWidth="0.5" />
                ))}
                {Array.from({length: 6}, (_, i) => {
                  const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                  return <line key={i} x1="0" y1="0" x2={Math.cos(a) * 120} y2={Math.sin(a) * 120} stroke={WF_LINE} strokeWidth="0.5" />;
                })}
                <polygon points={[0.5, 0.45, 0.6, 0.4, 0.55, 0.5].map((r, i) => {
                  const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                  return `${Math.cos(a) * 120 * r},${Math.sin(a) * 120 * r}`;
                }).join(' ')} fill={WF_INK_FAINT} fillOpacity="0.2" stroke={WF_INK_FAINT} strokeWidth="1.5" />
                <polygon points={[0.85, 0.7, 0.8, 0.75, 0.65, 0.85].map((r, i) => {
                  const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                  return `${Math.cos(a) * 120 * r},${Math.sin(a) * 120 * r}`;
                }).join(' ')} fill={WF_ACCENT} fillOpacity="0.3" stroke={WF_ACCENT} strokeWidth="1.5" />
                {['Carbs','Fluids','Stomach','Caffeine','Heat tol.','Variety'].map((label, i) => {
                  const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                  return <text key={label} x={Math.cos(a) * 140} y={Math.sin(a) * 140} fontSize="10" textAnchor="middle" fill={WF_INK_MUTED}>{label}</text>;
                })}
              </svg>
            </div>
          </WFBox>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <WFBox padding={20}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>biggest jump</WFText>
              <WFText size={18} weight={600} mt={4}>Stomach: 60 → 85 g/h</WFText>
              <WFText size={11} color={WF_INK_MUTED}>+42% in 12 months · 14 training tests logged</WFText>
            </WFBox>
            <WFBox padding={20}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>biggest gap</WFText>
              <WFText size={18} weight={600} mt={4}>Heat tolerance</WFText>
              <WFText size={11} color={WF_INK_MUTED}>2 of last 3 hot races below par · plan for it</WFText>
            </WFBox>
            <WFBox padding={20}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>quiet wins</WFText>
              <WFText size={13} weight={500} mt={4}>"You stopped over-relying on caffeine — finishes are stronger."</WFText>
            </WFBox>
          </div>
        </div>
        {showAnno && <WFArrowNote text="you, as a shape" x={400} y={300} dir="up" />}
      </WFArtboard>
    </div>
  );
}

function S_Integrations({ tweaks }) {
  const showAnno = tweaks.annotations;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>

      {/* V1 — Connect cards */}
      <WFArtboard label="V1 — Cards" hypothesis="Standard pattern · status + one button per provider" width={1280} height={620}>
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <WFH title="Connections" sub="Pull race data, push activities back. Optional but powerful." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { n: 'Strava', s: 'Connected · 1,822 activities', accent: true, last: 'last sync 2 min ago', perms: ['read activities', 'webhook on new ride'] },
              { n: 'Garmin', s: 'Connected · watch 945', accent: true, last: 'last sync 14 min ago', perms: ['read activities', 'fuelos data field installed'] },
              { n: 'Wahoo', s: 'Not connected', accent: false, last: '—', perms: ['read activities'] },
              { n: 'Apple Health', s: 'Not connected', accent: false, last: '—', perms: ['weight', 'sleep', 'workouts'] },
            ].map(c => (
              <WFBox key={c.n} padding={20} style={{ borderColor: c.accent ? WF_ACCENT : WF_LINE }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: WF_BG_FILL, border: `1px solid ${WF_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>{c.n[0]}</div>
                    <div>
                      <WFText size={14} weight={600}>{c.n}</WFText>
                      <WFText size={10} color={WF_INK_MUTED}>{c.s}</WFText>
                    </div>
                  </div>
                  {c.accent ? <WFBtn sm>Disconnect</WFBtn> : <WFBtn sm primary>Connect</WFBtn>}
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${WF_BG_FILL}` }}>
                  <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>permissions</WFText>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {c.perms.map(p => <WFPill key={p}>{p}</WFPill>)}
                  </div>
                  <WFText size={9} color={WF_INK_FAINT} mt={6}>{c.last}</WFText>
                </div>
              </WFBox>
            ))}
          </div>
        </div>
      </WFArtboard>

      {/* V2 — Pipeline diagram */}
      <WFArtboard label="V2 — Pipeline" hypothesis="Visual flow · what comes in, what flows out · trust through transparency" width={1280} height={520}>
        <div style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <WFH title="How your data flows" sub="No black box. You can see and pause every connection." />
          <WFBox padding={24} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 80px 1fr', alignItems: 'center', gap: 16, width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <WFText size={10} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>sources</WFText>
                {['Strava ●', 'Garmin ●', 'Wahoo ○', 'Apple Health ○'].map(s => (
                  <WFBox key={s} padding={12}><WFText size={12}>{s}</WFText></WFBox>
                ))}
              </div>
              <div style={{ textAlign: 'center', color: WF_ACCENT, fontSize: 24 }}>→</div>
              <WFBox padding={20} style={{ borderColor: WF_ACCENT, textAlign: 'center' }}>
                <WFText size={10} color={WF_ACCENT} style={{ textTransform: 'uppercase' }} weight={600}>fuelos · brain</WFText>
                <WFText size={16} weight={600} mt={6}>Build · Plan · Learn</WFText>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, color: WF_INK_MUTED }}>
                  <span>+ activity → race library</span>
                  <span>+ HR / cadence → fatigue model</span>
                  <span>+ sleep → readiness</span>
                </div>
              </WFBox>
              <div style={{ textAlign: 'center', color: WF_ACCENT, fontSize: 24 }}>→</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <WFText size={10} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>destinations</WFText>
                {['Garmin · race data field', 'Wahoo · structured workout', 'Strava · activity description'].map(s => (
                  <WFBox key={s} padding={12}><WFText size={12}>{s}</WFText></WFBox>
                ))}
              </div>
            </div>
          </WFBox>
        </div>
      </WFArtboard>

      {/* V3 — Onboarding-driven, "import a race" */}
      <WFArtboard label="V3 — Import a race" hypothesis="Connection is goal-driven · 'I want to plan THIS race'" width={1280} height={580}>
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 880 }}>
          <WFH title="Import your next race" sub="Pick from your apps — we'll grab the route, weather, and any past attempts" />
          <div style={{ display: 'flex', gap: 8 }}>
            {['Strava', 'Garmin', 'Wahoo', 'Paste GPX'].map((s, i) => (
              <div key={s} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, border: `1px solid ${i === 0 ? WF_ACCENT : WF_LINE}`, background: i === 0 ? '#fff7f3' : '#fff', color: i === 0 ? WF_ACCENT : WF_INK }}>{s}</div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              ['Marathon de Nantes', '21 May · 42.2 km · 14° forecast', 'route ready'],
              ['Trail des Calanques', '17 Aug · 38 km · 1240m D+', 'route ready · hot'],
              ['Gran Fondo Ventoux', '14 Sep · 120 km · 2400m D+', 'no past data'],
              ['10K Saint-Nazaire', '28 Jun · 10 km · flat', 'route ready'],
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: i > 0 ? `1px solid ${WF_BG_FILL}` : `1px solid ${WF_LINE}`, alignItems: 'center' }}>
                <div style={{ width: 16, height: 16, border: `1px solid ${WF_LINE}`, borderRadius: 3, background: i === 0 ? WF_INK : '#fff' }} />
                <div style={{ flex: 1 }}>
                  <WFText size={13} weight={500}>{r[0]}</WFText>
                  <WFText size={10} color={WF_INK_MUTED}>{r[1]}</WFText>
                </div>
                <WFPill>{r[2]}</WFPill>
              </div>
            ))}
          </div>
          <WFBtn primary>Import 1 race & build plan →</WFBtn>
        </div>
        {showAnno && <WFArrowNote text="connect to do · not for fun" x={620} y={80} dir="down" />}
      </WFArtboard>

      {/* V4 — Privacy-first */}
      <WFArtboard label="V4 — What you share" hypothesis="Granular toggles · trust by transparency · GDPR-friendly EU vibe" width={1280} height={620}>
        <div style={{ padding: 40 }}>
          <WFH title="What you share with FuelOS" sub="Each switch shows exactly what it gives us, and what it lets us do." />
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column' }}>
            {[
              ['Activity history', 'Past runs/rides', 'Auto-suggest fueling targets', true],
              ['Heart rate', 'During activities', 'Detect under-fueling patterns', true],
              ['Cadence & power', 'Bike & run', 'Load model for race-day', true],
              ['Sleep data', 'From watch', 'Race-day readiness score', false],
              ['Body weight', 'From scale sync', 'Auto-scale fueling targets', true],
              ['Location during race', 'Real-time GPS', 'Map fuel stops on route', true],
              ['Anonymized aggregate', 'Helps the model', 'Makes plans smarter for everyone', false],
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 60px', gap: 16, padding: '14px 0', borderTop: i > 0 ? `1px solid ${WF_BG_FILL}` : `1px solid ${WF_LINE}`, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{row[0]}</span>
                <span style={{ fontSize: 11, color: WF_INK_MUTED }}>{row[1]}</span>
                <span style={{ fontSize: 11, color: WF_INK }}>↳ {row[2]}</span>
                <div style={{ width: 36, height: 20, borderRadius: 999, background: row[3] ? WF_ACCENT : WF_LINE, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 2, left: row[3] ? 18 : 2, width: 16, height: 16, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {showAnno && <WFArrowNote text="every switch shows the why" x={780} y={140} dir="down" />}
      </WFArtboard>
    </div>
  );
}

window.S_History = S_History;
window.S_Profile = S_Profile;
window.S_Integrations = S_Integrations;
