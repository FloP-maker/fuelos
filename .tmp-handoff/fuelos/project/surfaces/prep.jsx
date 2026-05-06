// Surface 3: Prep checklist & protocol — 4 variations (mostly mobile-friendly desktop)

function S_Prep({ tweaks }) {
  const showAnno = tweaks.annotations;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>

      {/* V1 — Countdown checklist */}
      <WFArtboard label="V1 — Countdown checklist" hypothesis="Tasks bucketed by D-N · most urgent on top" width={1280} height={720}>
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <WFH title="Race prep" sub={`${nextRaceLabel(tweaks)} · 17 days out`} mb={0} />
            <WFText size={11} color={WF_INK_MUTED}>8 of 14 done · on track</WFText>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flex: 1 }}>
            {[
              { d: 'D-14 → D-7', items: [['Test race-day gels on long run', true], ['Order all nutrition', true], ['Practice 88 g/h', false]] },
              { d: 'D-6 → D-3', items: [['Carb load · day 1', false], ['Reduce caffeine', false], ['Sleep protocol', false]] },
              { d: 'D-2 → D-1', items: [['Pre-pack drop bag', false], ['Hydration ramp', false], ['Pin race number', false]] },
              { d: 'Race day', items: [['Breakfast 3h pre', false], ['Sip 500ml mix', false], ['Caffeine 30min pre', false]] },
            ].map((bucket, i) => (
              <WFBox key={i} padding={16} style={{ borderColor: i === 0 ? WF_ACCENT : WF_LINE }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <WFText size={10} weight={600} color={i === 0 ? WF_ACCENT : WF_INK_MUTED} style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{bucket.d}</WFText>
                  {i === 0 && <WFPill accent>now</WFPill>}
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bucket.items.map((it, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${WF_LINE}`, background: it[1] ? WF_INK : '#fff', marginTop: 1, flexShrink: 0, fontSize: 9, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it[1] && '✓'}</div>
                      <WFText size={11} color={it[1] ? WF_INK_FAINT : WF_INK} style={{ textDecoration: it[1] ? 'line-through' : 'none', lineHeight: 1.35 }}>{it[0]}</WFText>
                    </div>
                  ))}
                </div>
              </WFBox>
            ))}
          </div>

          <WFBox padding={16} style={{ background: WF_BG_FILL, border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <WFText size={12} weight={500}>↳ Next reminder: <b>tonight 21:00</b> — start sleep protocol</WFText>
              <WFBtn ghost sm>Manage reminders</WFBtn>
            </div>
          </WFBox>
        </div>
        {showAnno && <WFArrowNote text="time pressure surfaced" x={120} y={180} dir="upright" />}
      </WFArtboard>

      {/* V2 — Lab protocol */}
      <WFArtboard label="V2 — Protocol" hypothesis="Treat prep like a clinical study · steps, doses, observations" width={1280} height={720}>
        <div style={{ padding: 40, fontFamily: 'ui-monospace, monospace', height: '100%', display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12 }}>
          <div style={{ borderBottom: `2px solid ${WF_INK}`, paddingBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, letterSpacing: '0.04em' }}>FUELOS · PROTOCOL #M-2026-05-21</span>
              <span>{nextRaceLabel(tweaks).toUpperCase()} · D-17</span>
            </div>
            <div style={{ marginTop: 4, color: WF_INK_MUTED, fontSize: 11 }}>subject: F. Poussin · objective: 88 g/h tolerance + race readiness</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 70px', gap: 8, fontSize: 10, color: WF_INK_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${WF_LINE}`, paddingBottom: 6 }}>
            <span>day</span><span>step</span><span>dose / target</span><span>status</span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            {[
              ['D-14', 'Long run · gel test (Maurten 100)', '78 g/h', '✓ done'],
              ['D-12', 'Order race nutrition · 14 gels', '6 caf, 8 reg', '✓ done'],
              ['D-10', 'Long run · push to target', '88 g/h × 2h', '✓ done'],
              ['D-7', 'Caffeine deload begins', '< 200 mg/day', '○ active'],
              ['D-6', 'Carb load day 1', '7 g/kg/day', '○ today'],
              ['D-5', 'Carb load day 2', '8 g/kg/day', '· pending'],
              ['D-4', 'Carb load day 3', '10 g/kg/day', '· pending'],
              ['D-3', 'Hydration ramp · +500 ml/day', '3.5 L total', '· pending'],
              ['D-2', 'Pack drop bag · pin number', '—', '· pending'],
              ['D-1', 'Light shake-out + early dinner', '—', '· pending'],
              ['D-0', 'Breakfast T-3:00 · 130 g carbs', 'oats + banana', '· pending'],
              ['D-0', 'Caffeine T-0:30 · 100 mg', '1 espresso', '· pending'],
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 70px', gap: 8, padding: '8px 0', borderBottom: `1px dashed ${WF_LINE}`, fontSize: 11 }}>
                <span style={{ color: WF_INK_MUTED }}>{row[0]}</span>
                <span>{row[1]}</span>
                <span style={{ color: WF_INK_MUTED }}>{row[2]}</span>
                <span style={{ color: row[3].startsWith('✓') ? WF_ACCENT : row[3].startsWith('○') ? WF_INK : WF_INK_FAINT, fontWeight: row[3].startsWith('○') ? 700 : 400 }}>{row[3]}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `2px solid ${WF_INK}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: WF_INK_MUTED }}>signed: F. Poussin · last update 14:32</span>
            <span>completion: 8/14 · adherence: 92%</span>
          </div>
        </div>
        {showAnno && <WFArrowNote text="serious mode — for nerds" x={140} y={70} dir="upright" />}
      </WFArtboard>

      {/* V3 — Today card (mobile) */}
      <WFArtboard label="V3 — Today (mobile)" hypothesis="One thing on the screen · the next thing to do" width={760} height={720}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32, gap: 32 }}>
          <WFPhone>
            <div style={{ padding: '12px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>monday · D-7</WFText>
                <WFIcon ch="≡" size={20} />
              </div>

              <div>
                <WFText size={11} color={WF_ACCENT} weight={600} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>today's task</WFText>
                <WFText size={22} weight={600} mt={6} style={{ lineHeight: 1.2 }}>Reduce caffeine to under 200 mg/day</WFText>
                <WFText size={12} color={WF_INK_MUTED} mt={8}>Caffeine deload starts now so race-day caffeine has full effect.</WFText>
              </div>

              <WFBox padding={14} style={{ background: WF_BG_FILL, border: 'none' }}>
                <WFText size={10} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>track</WFText>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                  <WFText size={20} weight={600}>120 mg</WFText>
                  <WFText size={11} color={WF_INK_MUTED}>of 200 max</WFText>
                </div>
                <div style={{ height: 4, background: '#fff', borderRadius: 2, marginTop: 8 }}>
                  <div style={{ height: '100%', width: '60%', background: WF_ACCENT, borderRadius: 2 }} />
                </div>
              </WFBox>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['+ Espresso', '60 mg'], ['+ Tea', '40 mg'], ['+ Custom', '— mg']].map(b => (
                  <div key={b[0]} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: WF_BG_CARD, border: `1px solid ${WF_LINE}`, borderRadius: 6, fontSize: 12 }}>
                    <span>{b[0]}</span>
                    <span style={{ color: WF_INK_MUTED }}>{b[1]}</span>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1 }} />

              <WFBtn primary full>Mark today done</WFBtn>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: WF_INK_MUTED }}>
                <span>← yesterday</span>
                <span>● ● ● ● ● ●</span>
                <span>tomorrow →</span>
              </div>
            </div>
          </WFPhone>

          <WFPhone>
            <div style={{ padding: '12px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>shopping list · auto</WFText>
              <WFText size={20} weight={600}>What to buy</WFText>
              {[
                ['Maurten Gel 100', '8×', false],
                ['Maurten Gel 100 caf', '4×', true],
                ['SiS Beta gel', '2×', false],
                ['Drink mix · 40g', '4 sachets', false],
                ['Salt cap 500mg', '4×', false],
              ].map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? `1px solid ${WF_BG_FILL}` : 'none' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${WF_LINE}`, background: it[2] ? WF_INK : '#fff' }} />
                  <div style={{ flex: 1 }}>
                    <WFText size={13}>{it[0]}</WFText>
                    <WFText size={10} color={WF_INK_MUTED}>{it[1]}</WFText>
                  </div>
                  <span style={{ fontSize: 11, color: WF_INK_MUTED }}>›</span>
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <WFBtn full>Send to Decathlon →</WFBtn>
            </div>
          </WFPhone>
        </div>
        {showAnno && <WFArrowNote text="left = today's task · right = shopping" x={300} y={50} dir="downright" />}
      </WFArtboard>

      {/* V4 — Garage / equipment */}
      <WFArtboard label="V4 — Garage" hypothesis="Visual layout of bottles, gels, drop bag · what goes where" width={1280} height={720}>
        <div style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <WFH title="Race-day kit" sub="Drag items to slots · printable layout · pre-pack like a checklist" mb={0} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, flex: 1 }}>
            {[
              { t: 'On you', n: 4, items: ['Gel 1 · M100', 'Gel 2 · M100', 'Gel 3 · M caf', 'Salt cap'] },
              { t: 'Bottle / belt', n: 2, items: ['Bottle A · 500ml mix', 'Bottle B · 500ml mix'] },
              { t: 'Drop bag · KM 30', n: 4, items: ['Gel 4 · M100', 'Gel 5 · SiS Beta', 'Gel 6 · M caf', 'Backup bar'] },
            ].map((slot, i) => (
              <WFBox key={i} padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <WFText size={11} weight={600} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>{slot.t}</WFText>
                  <WFPill>{slot.n} items</WFPill>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 }}>
                  {slot.items.map((it, j) => (
                    <div key={j} style={{ background: WF_BG_FILL, border: `1px dashed ${WF_LINE}`, borderRadius: 4, padding: 10, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ width: 28, height: 28, background: WF_BG_CARD, border: `1px solid ${WF_LINE}`, borderRadius: 3 }} />
                      <span>{it}</span>
                    </div>
                  ))}
                  <div style={{ background: 'transparent', border: `1px dashed ${WF_LINE}`, borderRadius: 4, padding: 10, fontSize: 11, color: WF_INK_FAINT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    + add
                  </div>
                </div>
              </WFBox>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <WFBtn primary>Print as label sheet</WFBtn>
            <WFBtn>Lock layout</WFBtn>
            <WFBtn ghost>Reset to default</WFBtn>
          </div>
        </div>
        {showAnno && <WFArrowNote text="3 buckets you actually fill" x={620} y={140} dir="up" />}
      </WFArtboard>
    </div>
  );
}

window.S_Prep = S_Prep;
