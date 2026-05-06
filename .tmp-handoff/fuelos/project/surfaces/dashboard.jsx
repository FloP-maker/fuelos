// Surface 1: Dashboard / home (desktop)
// 4 variations exploring layout structure and information density.

function S_Dashboard({ tweaks }) {
  const sport = tweaks.sport;
  const length = tweaks.length;
  const showAnno = tweaks.annotations;
  const units = tweaks.units;

  const nextRace = sport === 'tri' ? 'Half Ironman · Vichy' : sport === 'bike' ? 'Gran Fondo Ventoux' : 'Marathon de Nantes';
  const dist = units === 'metric' ? (sport === 'tri' ? '1.9k / 90k / 21k' : sport === 'bike' ? '120 km' : '42.2 km') : (sport === 'tri' ? '1.2mi / 56mi / 13.1mi' : sport === 'bike' ? '74.5 mi' : '26.2 mi');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>

      {/* V1 — Countdown-first dashboard */}
      <WFArtboard label="V1 — Countdown" hypothesis="One race in focus · big countdown · journey strip" width={1280} height={720}>
        <div style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* topbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${WF_LINE}`, paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <WFIcon ch="F" size={24} accent />
              <WFText size={14} weight={600}>FuelOS</WFText>
              <div style={{ display: 'flex', gap: 16, marginLeft: 24 }}>
                {['Dashboard', 'Plans', 'History', 'Profile'].map((t, i) => (
                  <WFText key={t} size={12} color={i === 0 ? WF_INK : WF_INK_MUTED}>{t}</WFText>
                ))}
              </div>
            </div>
            <WFPill>connected · strava ✓ garmin ✓</WFPill>
          </div>

          {/* hero */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, flex: 1 }}>
            <WFBox padding={32} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <WFNote>biggest unit on the page = the next race</WFNote>
                <div style={{ fontSize: 11, color: WF_INK_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>next race</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{nextRace}</div>
                <div style={{ fontSize: 13, color: WF_INK_MUTED, marginTop: 4 }}>{dist} · 7am start · weather: 14° partly cloudy</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 96, fontWeight: 700, color: WF_ACCENT, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>17</span>
                <span style={{ fontSize: 18, color: WF_INK_MUTED }}>days · 4 hours</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <WFBtn primary>Open plan →</WFBtn>
                <WFBtn>Edit</WFBtn>
                <WFBtn ghost>Share</WFBtn>
              </div>
            </WFBox>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <WFBox label="plan health">
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {['carb target', 'fluid', 'sodium', 'caffeine'].map((l, i) => (
                    <div key={l} style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: WF_INK_MUTED, textTransform: 'uppercase' }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{['90g/h', '600ml/h', '700mg/h', '2x100mg'][i]}</div>
                      <div style={{ height: 4, background: WF_BG_FILL, borderRadius: 2, marginTop: 6 }}>
                        <div style={{ height: '100%', width: ['90%', '70%', '85%', '60%'][i], background: WF_ACCENT, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </WFBox>

              <WFBox label="checklist · 8 of 14 done">
                {['Buy gels', 'Test sodium', 'Sleep protocol', 'Pack drop bag'].map((it, i) => (
                  <div key={it} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${WF_BG_FILL}` : 'none' }}>
                    <div style={{ width: 14, height: 14, border: `1px solid ${WF_LINE}`, borderRadius: 3, background: i < 2 ? WF_INK : '#fff' }} />
                    <span style={{ fontSize: 12, color: i < 2 ? WF_INK_FAINT : WF_INK, textDecoration: i < 2 ? 'line-through' : 'none' }}>{it}</span>
                  </div>
                ))}
              </WFBox>
            </div>
          </div>

          {/* journey strip */}
          <WFBox padding={20}>
            <div style={{ fontSize: 11, color: WF_INK_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>your fueling journey</div>
            <div style={{ display: 'flex', gap: 0, alignItems: 'center', position: 'relative' }}>
              {['Profile set', 'Plan built', 'Prep · 8/14', 'Race day', 'Debrief'].map((s, i) => (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 999, background: i <= 2 ? WF_ACCENT : '#fff', border: `1.5px solid ${i <= 2 ? WF_ACCENT : WF_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: i <= 2 ? '#fff' : WF_INK_MUTED }}>{i + 1}</div>
                    <div style={{ fontSize: 11, color: i <= 2 ? WF_INK : WF_INK_MUTED, fontWeight: i === 2 ? 600 : 400 }}>{s}</div>
                  </div>
                  {i < 4 && <div style={{ flex: 0.4, height: 1, background: i < 2 ? WF_ACCENT : WF_LINE }} />}
                </React.Fragment>
              ))}
            </div>
          </WFBox>
        </div>
        {showAnno && <WFArrowNote text="status, not metrics" x={780} y={140} dir="left" />}
      </WFArtboard>

      {/* V2 — Cards grid */}
      <WFArtboard label="V2 — Card grid" hypothesis="Equal-weight tiles · scan & jump · multi-race" width={1280} height={720}>
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <WFH title="Dashboard" sub="3 upcoming races · 12 plans saved" mb={0} />
            <div style={{ display: 'flex', gap: 8 }}>
              <WFBtn>+ New plan</WFBtn>
              <WFBtn primary>Race mode</WFBtn>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, flex: 1 }}>
            {/* race cards */}
            {[
              { name: nextRace, when: 'in 17 days', status: 'plan ready', pct: 90, hot: true },
              { name: '10K Saint-Nazaire', when: 'in 6 weeks', status: 'planning', pct: 40 },
              { name: 'Trail des Calanques', when: 'in 11 weeks', status: 'profile only', pct: 10 },
            ].map((r, i) => (
              <WFBox key={i} padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 10, borderColor: r.hot ? WF_ACCENT : WF_LINE }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.when}</WFText>
                    <WFText size={15} weight={600} mt={2}>{r.name}</WFText>
                  </div>
                  {r.hot && <WFPill accent>NEXT</WFPill>}
                </div>
                <WFPlaceholder height={80} label="elevation profile" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: WF_INK_MUTED }}>
                  <span>{r.status}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.pct}% ready</span>
                </div>
                <div style={{ height: 3, background: WF_BG_FILL, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: WF_ACCENT, borderRadius: 2 }} />
                </div>
              </WFBox>
            ))}

            {/* secondary tiles */}
            <WFBox padding={20}>
              <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>this week</WFText>
              <WFText size={15} weight={600} mt={2}>3 prep tasks due</WFText>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {['Test new gels (long run)', 'Order race nutrition', 'Pack drop bag'].map(t => (
                  <div key={t} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
                    <div style={{ width: 10, height: 10, border: `1px solid ${WF_LINE}`, borderRadius: 2 }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </WFBox>

            <WFBox padding={20}>
              <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>last race</WFText>
              <WFText size={15} weight={600} mt={2}>Semi de Nantes</WFText>
              <WFText size={11} color={WF_INK_MUTED}>3 weeks ago · 1h 32m</WFText>
              <div style={{ marginTop: 10, padding: 10, background: WF_BG_FILL, borderRadius: 4 }}>
                <WFText size={11} weight={500}>"Stomach OK, slightly under-fueled km 16+"</WFText>
              </div>
              <WFBtn ghost sm style={{ marginTop: 8 }}>View debrief →</WFBtn>
            </WFBox>

            <WFBox padding={20}>
              <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>insights</WFText>
              <WFText size={15} weight={600} mt={2}>Your sweet spot</WFText>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>carbs that worked</span><span style={{ fontWeight: 600 }}>78–88 g/h</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>preferred form</span><span style={{ fontWeight: 600 }}>gel + drink mix</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>flavor fatigue at</span><span style={{ fontWeight: 600 }}>~h 2:30</span></div>
              </div>
            </WFBox>
          </div>
        </div>
        {showAnno && <WFArrowNote text="all races equal · pick your focus" x={420} y={70} dir="downright" />}
      </WFArtboard>

      {/* V3 — Coach digest (text-led, journal vibe) */}
      <WFArtboard label="V3 — Coach digest" hypothesis="Conversational · narrative · low data density" width={1280} height={720}>
        <div style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 24, height: '100%', maxWidth: 900 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <WFIcon ch="F" size={28} accent />
            <WFText size={11} color={WF_INK_MUTED}>monday · 4 may</WFText>
          </div>

          <div>
            <WFText size={36} weight={400} style={{ lineHeight: 1.15, fontFamily: 'serif' }}>
              Florent, you're <span style={{ color: WF_ACCENT }}>17 days</span> from {nextRace}.
            </WFText>
            <WFText size={36} weight={400} color={WF_INK_MUTED} style={{ lineHeight: 1.15, fontFamily: 'serif', marginTop: 8 }}>
              Today's focus: <span style={{ color: WF_INK }}>test your race-day gels</span> on the long run.
            </WFText>
          </div>

          <WFBox padding={24} style={{ background: WF_BG_FILL, border: 'none' }}>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>the brief</WFText>
            <WFText size={14} mt={8} style={{ lineHeight: 1.6 }}>
              Your plan calls for <b>88 g/h</b> over 3:45. Last race you peaked at 72 g/h before stomach pushback — let's bridge the gap. Try the Maurten 100 + SiS Beta in a 2:1 cycle on Saturday. Log how it feels.
            </WFText>
          </WFBox>

          <div style={{ display: 'flex', gap: 16 }}>
            <WFBox padding={16} style={{ flex: 1 }}>
              <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>plan</WFText>
              <WFText size={14} weight={600} mt={4}>3:45 plan · ready</WFText>
            </WFBox>
            <WFBox padding={16} style={{ flex: 1 }}>
              <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>checklist</WFText>
              <WFText size={14} weight={600} mt={4}>8 of 14 done</WFText>
            </WFBox>
            <WFBox padding={16} style={{ flex: 1 }}>
              <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>last debrief</WFText>
              <WFText size={14} weight={600} mt={4}>Semi de Nantes</WFText>
            </WFBox>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <WFBtn primary>Open today's task</WFBtn>
            <WFBtn ghost>Skip · I already did it</WFBtn>
          </div>
        </div>
        {showAnno && <WFArrowNote text="one job per day" x={520} y={210} dir="left" />}
      </WFArtboard>

      {/* V4 — Athlete cockpit (dense data) */}
      <WFArtboard label="V4 — Cockpit" hypothesis="Power-user · everything visible · spreadsheet density" width={1280} height={720}>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <WFText size={16} weight={600}>Cockpit</WFText>
              <WFText size={11} color={WF_INK_MUTED}>Florent Poussin · cycle 14 · phase: taper-1</WFText>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <WFPill>strava ●</WFPill>
              <WFPill>garmin ●</WFPill>
              <WFPill>wahoo ○</WFPill>
            </div>
          </div>

          {/* big stats row */}
          <WFStats items={[
            { label: 'next race', value: '17d 4h' },
            { label: 'plan', value: '90% ready' },
            { label: 'target carbs', value: '88 g/h' },
            { label: 'tested ceiling', value: '72 g/h' },
            { label: 'fluids', value: '600 ml/h' },
            { label: 'sodium', value: '700 mg/h' },
            { label: 'caffeine', value: '2 × 100mg' },
            { label: 'weight', value: '68.4 kg' },
          ]} />

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12, flex: 1 }}>
            {/* race timeline */}
            <WFBox padding={16}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>14-day taper plan</WFText>
                <div style={{ display: 'flex', gap: 4 }}>
                  <WFPill>fueling</WFPill>
                  <WFPill>training</WFPill>
                  <WFPill>sleep</WFPill>
                </div>
              </div>
              {/* gantt-ish */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Carb load', 'Salt load', 'Caffeine deload', 'Hydration ramp', 'Long run · gel test', 'Short tune-up', 'Race day'].map((row, i) => (
                  <div key={row} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
                    <WFText size={10} color={WF_INK_MUTED}>{row}</WFText>
                    <div style={{ height: 14, position: 'relative', background: WF_BG_FILL, borderRadius: 2 }}>
                      <div style={{ position: 'absolute', left: `${[60, 75, 65, 30, 25, 80, 95][i]}%`, width: `${[35, 23, 33, 65, 8, 14, 4][i]}%`, top: 0, bottom: 0, background: WF_ACCENT, opacity: 0.5 + (i / 14), borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, marginTop: 4 }}>
                  <span />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: WF_INK_FAINT }}>
                    <span>D-14</span><span>D-7</span><span>D-3</span><span>RACE</span>
                  </div>
                </div>
              </div>
            </WFBox>

            {/* recent tests log */}
            <WFBox padding={16}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>recent fueling tests</WFText>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
                {[
                  { d: '02 May', what: 'Maurten 160 × 3', pace: '4:42/km', g: '78', ok: '✓' },
                  { d: '28 Apr', what: 'SiS Beta + drink', pace: '4:55/km', g: '64', ok: '✓' },
                  { d: '24 Apr', what: 'Gel mix 2:1', pace: '4:50/km', g: '90', ok: '✕' },
                  { d: '20 Apr', what: 'Drink mix only', pace: '5:10/km', g: '55', ok: '✓' },
                  { d: '15 Apr', what: 'Bar + gel', pace: '5:22/km', g: '70', ok: '~' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 50px 30px 16px', gap: 6, padding: '6px 0', borderTop: i > 0 ? `1px solid ${WF_BG_FILL}` : 'none', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: WF_INK_MUTED }}>{row.d}</span>
                    <span>{row.what}</span>
                    <span style={{ color: WF_INK_MUTED }}>{row.pace}</span>
                    <span>{row.g}g</span>
                    <span style={{ color: row.ok === '✓' ? WF_ACCENT : row.ok === '✕' ? '#c43' : WF_INK_MUTED, textAlign: 'right' }}>{row.ok}</span>
                  </div>
                ))}
              </div>
            </WFBox>
          </div>
        </div>
        {showAnno && <WFArrowNote text="for the data nerds" x={1100} y={40} dir="downleft" />}
      </WFArtboard>
    </div>
  );
}

window.S_Dashboard = S_Dashboard;
