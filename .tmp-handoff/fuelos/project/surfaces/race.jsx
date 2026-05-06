// Surface 4: Race-day live screen — 4 mobile variations
// Priority: map + fuel stops along the route.

function S_Race({ tweaks }) {
  const showAnno = tweaks.annotations;
  const dark = tweaks.daynight === 'night';

  const ink = dark ? '#fafaf9' : WF_INK;
  const inkMuted = dark ? '#a3a3a3' : WF_INK_MUTED;
  const bg = dark ? '#0a0a0a' : '#fafaf9';
  const card = dark ? '#1a1a1a' : '#fff';
  const line = dark ? '#2a2a2a' : WF_LINE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>

      {/* V1 — Map-first */}
      <WFArtboard label="V1 — Map-first" hypothesis="Map fills screen · fuel pins · next stop banner on top" width={1380} height={760}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: 20, gap: 24 }}>
          <WFPhone dark={dark}>
            <div style={{ height: '100%', position: 'relative', background: bg, color: ink }}>
              <WFMap height={500} stops={6} dark={dark} style={{ borderRadius: 0, border: 'none' }} />

              {/* top banner */}
              <div style={{ position: 'absolute', top: 12, left: 12, right: 12, background: card, border: `1px solid ${line}`, borderRadius: 8, padding: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: inkMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span>next fuel · stop 3</span>
                  <span>in 1.2 km · 6 min</span>
                </div>
                <WFText size={16} weight={600} color={ink} mt={4}>Maurten 100 caf</WFText>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <WFPill style={{ background: card, color: ink, borderColor: line }}>40 g</WFPill>
                  <WFPill style={{ background: card, color: ink, borderColor: line }}>caf 100mg</WFPill>
                </div>
              </div>

              {/* bottom card */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: card, borderTop: `1px solid ${line}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <WFText size={9} color={inkMuted} style={{ textTransform: 'uppercase' }}>elapsed</WFText>
                    <WFText size={20} weight={600} color={ink}>1:42:18</WFText>
                  </div>
                  <div>
                    <WFText size={9} color={inkMuted} style={{ textTransform: 'uppercase' }}>km · pace</WFText>
                    <WFText size={20} weight={600} color={ink}>21.4 · 4:48</WFText>
                  </div>
                  <div>
                    <WFText size={9} color={inkMuted} style={{ textTransform: 'uppercase' }}>g/h</WFText>
                    <WFText size={20} weight={600} color={WF_ACCENT}>82</WFText>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1, background: WF_ACCENT, color: '#fff', padding: '14px 12px', borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>Log next intake</div>
                  <div style={{ width: 48, background: card, border: `1px solid ${line}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ink, fontSize: 18 }}>···</div>
                </div>
              </div>
            </div>
          </WFPhone>

          <WFPhone dark={dark}>
            <div style={{ height: '100%', position: 'relative', background: bg, color: ink, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: inkMuted, textTransform: 'uppercase' }}>
                <span>{nextRaceLabel(tweaks)}</span>
                <span>•REC</span>
              </div>
              <WFText size={11} color={inkMuted} mt={12} style={{ textTransform: 'uppercase' }}>upcoming fuel stops</WFText>
              <div style={{ marginTop: 8 }}>
                {[
                  { n: 3, dist: '1.2 km · 6 min', label: 'Maurten 100 caf', tag: 'NEXT', accent: true },
                  { n: 4, dist: '4.8 km · 23 min', label: 'Bottle swap · 500ml', tag: 'aid 2' },
                  { n: 5, dist: '8.4 km · 41 min', label: 'SiS Beta gel', tag: 'flavor break' },
                  { n: 6, dist: '12.0 km · 59 min', label: 'Maurten 100 caf', tag: '' },
                  { n: 7, dist: '15.6 km · 1h 17m', label: 'Maurten 100', tag: 'drop bag' },
                  { n: 8, dist: '18.0 km · 1h 29m', label: 'Finish kick · caf 50mg', tag: 'last' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${line}`, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: s.accent ? WF_ACCENT : 'transparent', border: `1.5px solid ${s.accent ? WF_ACCENT : line}`, color: s.accent ? '#fff' : ink, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.n}</div>
                    <div style={{ flex: 1 }}>
                      <WFText size={12} weight={s.accent ? 600 : 400} color={ink}>{s.label}</WFText>
                      <WFText size={10} color={inkMuted}>{s.dist}</WFText>
                    </div>
                    {s.tag && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: s.accent ? WF_ACCENT : 'transparent', color: s.accent ? '#fff' : inkMuted, border: s.accent ? 'none' : `1px solid ${line}`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.tag}</span>}
                  </div>
                ))}
              </div>
            </div>
          </WFPhone>
        </div>
        {showAnno && <WFArrowNote text="map = primary · stops list = secondary" x={680} y={50} dir="down" />}
      </WFArtboard>

      {/* V2 — Countdown big numeral */}
      <WFArtboard label="V2 — Countdown dial" hypothesis="Glanceable · sweat-friendly · one number until next intake" width={1380} height={760}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: 20 }}>
          <WFPhone dark={dark}>
            <div style={{ height: '100%', background: bg, color: ink, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: inkMuted }}>
                <span>1:42:18 · 21.4 km</span>
                <span>{tweaks.daynight === 'night' ? '☾ NIGHT' : '☀ DAY'}</span>
              </div>

              {/* big dial */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <WFText size={11} color={inkMuted} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>next intake in</WFText>
                <div style={{ position: 'relative', width: 220, height: 220 }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="44" fill="none" stroke={line} strokeWidth="3" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke={WF_ACCENT} strokeWidth="3" strokeDasharray={`${0.7 * 276} 276`} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <WFText size={56} weight={700} color={ink} style={{ lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>5:48</WFText>
                    <WFText size={11} color={inkMuted}>min · 1.2 km</WFText>
                  </div>
                </div>
                <WFBox padding={12} style={{ background: card, borderColor: line, color: ink, width: '100%', textAlign: 'center' }}>
                  <WFText size={10} color={inkMuted} style={{ textTransform: 'uppercase' }}>then take</WFText>
                  <WFText size={16} weight={600} color={ink} mt={4}>Maurten 100 caf</WFText>
                  <WFText size={10} color={inkMuted}>40 g · caffeine 100 mg</WFText>
                </WFBox>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[['CARBS', '88g', '110g target'], ['FLUID', '420ml', '600 target'], ['ON-PLAN', '✓', '0:14 ahead']].map((s, i) => (
                  <div key={i} style={{ background: card, border: `1px solid ${line}`, borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <WFText size={9} color={inkMuted}>{s[0]}</WFText>
                    <WFText size={14} weight={600} color={i === 2 ? WF_ACCENT : ink}>{s[1]}</WFText>
                    <WFText size={9} color={inkMuted}>{s[2]}</WFText>
                  </div>
                ))}
              </div>

              <div style={{ background: WF_ACCENT, color: '#fff', padding: 16, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>Took it now</div>
            </div>
          </WFPhone>

          <WFPhone dark={dark}>
            <div style={{ height: '100%', background: bg, color: ink, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <WFText size={10} color={inkMuted} style={{ textTransform: 'uppercase' }}>after you tapped "took it"</WFText>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <div style={{ width: 80, height: 80, borderRadius: 999, border: `2px solid ${WF_ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WF_ACCENT, fontSize: 36 }}>✓</div>
                <WFText size={20} weight={600} color={ink}>Logged.</WFText>
                <WFText size={12} color={inkMuted} style={{ textAlign: 'center', maxWidth: 200 }}>Maurten 100 caf · 40 g · taken at 1:42:18</WFText>
                <WFBox padding={12} style={{ background: card, borderColor: line, width: '100%' }}>
                  <WFText size={10} color={inkMuted} style={{ textTransform: 'uppercase' }}>next</WFText>
                  <WFText size={14} weight={600} color={ink} mt={4}>in 18 min · Bottle swap</WFText>
                </WFBox>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1, padding: 12, borderRadius: 6, border: `1px solid ${line}`, color: ink, textAlign: 'center', fontSize: 12 }}>Felt good</div>
                <div style={{ flex: 1, padding: 12, borderRadius: 6, border: `1px solid ${line}`, color: ink, textAlign: 'center', fontSize: 12 }}>Stomach ⚠</div>
                <div style={{ flex: 1, padding: 12, borderRadius: 6, border: `1px solid ${line}`, color: ink, textAlign: 'center', fontSize: 12 }}>Skipped</div>
              </div>
            </div>
          </WFPhone>
        </div>
        {showAnno && <WFArrowNote text="one number, runnable in sweat" x={420} y={300} dir="right" />}
      </WFArtboard>

      {/* V3 — Now / Next / Later */}
      <WFArtboard label="V3 — Now / Next / Later" hypothesis="Three rows · always visible · one tap to log now" width={1380} height={760}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: 20 }}>
          <WFPhone dark={dark}>
            <div style={{ height: '100%', background: bg, color: ink, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: inkMuted, textTransform: 'uppercase' }}>
                <span>1:42:18 · 21.4km · 4:48/km</span>
                <span>● rec</span>
              </div>

              <WFMap height={140} stops={4} dark={dark} />

              {/* NOW */}
              <div style={{ background: WF_ACCENT, borderRadius: 10, padding: 14, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8 }}>now · take</span>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>5:48 left</span>
                </div>
                <WFText size={20} weight={600} color="#fff" mt={4}>Maurten 100 caf</WFText>
                <WFText size={11} color="#fff" style={{ opacity: 0.85 }}>40 g · caffeine 100 mg</WFText>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <div style={{ flex: 1, background: '#fff', color: WF_ACCENT, padding: 10, borderRadius: 6, textAlign: 'center', fontSize: 12, fontWeight: 600 }}>Took it</div>
                  <div style={{ width: 80, background: 'rgba(255,255,255,0.25)', padding: 10, borderRadius: 6, textAlign: 'center', fontSize: 12, color: '#fff' }}>Skip</div>
                </div>
              </div>

              {/* NEXT */}
              <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: inkMuted }}>next</span>
                  <span style={{ fontSize: 9, color: inkMuted }}>+23 min · aid 2</span>
                </div>
                <WFText size={14} weight={600} color={ink} mt={2}>Bottle swap · 500ml mix</WFText>
              </div>

              {/* LATER */}
              <div style={{ background: card, border: `1px solid ${line}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: inkMuted }}>later · 4 stops</span>
                  <span style={{ fontSize: 9, color: inkMuted }}>see all</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {['SiS gel', 'M caf', 'M100', 'Drop bag', 'Finish kick'].map(t => (
                    <span key={t} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, border: `1px solid ${line}`, color: inkMuted }}>{t}</span>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: inkMuted }}>
                <span>carbs 88 g/h</span>
                <span>fluid 73%</span>
                <span style={{ color: WF_ACCENT }}>on plan ✓</span>
              </div>
            </div>
          </WFPhone>
        </div>
        {showAnno && <WFArrowNote text="vertical hierarchy = priority" x={520} y={180} dir="down" />}
      </WFArtboard>

      {/* V4 — Watch face mirror */}
      <WFArtboard label="V4 — Watch face" hypothesis="Phone mirrors what's on the Garmin · two-screen choreography" width={1380} height={760}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20, gap: 60, alignItems: 'center' }}>
          {/* watch */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 260, height: 260, borderRadius: 999,
              background: dark ? '#000' : '#0a0a0a',
              border: '8px solid #2a2a2a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}>
              <div style={{ width: 200, height: 200, borderRadius: 999, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <span style={{ fontSize: 8, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>fuel in</span>
                <span style={{ fontSize: 56, color: '#fff', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginTop: 4 }}>5:48</span>
                <span style={{ fontSize: 10, color: WF_ACCENT, fontWeight: 600, textTransform: 'uppercase', marginTop: 6 }}>● Maurten caf</span>
                <div style={{ width: 80, height: 1, background: '#2a2a2a', margin: '8px 0' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 9, color: '#888' }}>21.4km</span>
                  <span style={{ fontSize: 9, color: '#888' }}>4:48/km</span>
                </div>
              </div>
            </div>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>garmin · fuelos data field</WFText>
          </div>

          <div style={{ fontSize: 24, color: WF_INK_MUTED }}>↔</div>

          <WFPhone dark={dark}>
            <div style={{ height: '100%', background: bg, color: ink, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <WFText size={10} color={inkMuted} style={{ textTransform: 'uppercase' }}>phone · companion</WFText>
                <WFPill style={{ background: card, borderColor: WF_ACCENT, color: WF_ACCENT }}>watch ●</WFPill>
              </div>
              <WFMap height={200} stops={5} dark={dark} />
              <WFBox padding={12} style={{ background: card, borderColor: line, color: ink }}>
                <WFText size={9} color={inkMuted} style={{ textTransform: 'uppercase' }}>next stop · in 1.2 km</WFText>
                <WFText size={16} weight={600} color={ink} mt={4}>Maurten 100 caf</WFText>
                <WFText size={11} color={inkMuted}>logged automatically when watch detects intake</WFText>
              </WFBox>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <WFText size={10} color={inkMuted} style={{ textTransform: 'uppercase' }}>recent</WFText>
                {[['1:22 · Gel #2 logged auto', '✓'], ['1:02 · Bottle swap', '✓'], ['0:42 · Gel #1', '✓']].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '6px 0', borderBottom: i < 2 ? `1px solid ${line}` : 'none' }}>
                    <span style={{ color: inkMuted }}>{r[0]}</span>
                    <span style={{ color: WF_ACCENT }}>{r[1]}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <WFBtn full style={{ background: card, borderColor: line, color: ink }}>Manual log →</WFBtn>
            </div>
          </WFPhone>
        </div>
        {showAnno && <WFArrowNote text="watch leads · phone supports" x={680} y={120} dir="down" />}
      </WFArtboard>
    </div>
  );
}

window.S_Race = S_Race;
