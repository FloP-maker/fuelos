// Surface 5: Post-race debrief — 4 variations

function S_Debrief({ tweaks }) {
  const showAnno = tweaks.annotations;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>

      {/* V1 — Story / scrollytelling */}
      <WFArtboard label="V1 — Story" hypothesis="Walk through the race chronologically · prompt at each moment" width={1280} height={760}>
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>debrief · day after</WFText>
              <WFH title="Marathon de Nantes · 3h 41m" sub="10 of 10 intakes logged · let's review" mt={4} mb={0} />
            </div>
            <WFPill accent>5 min review</WFPill>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <WFBox padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <WFText size={10} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>chapter 2 of 5 · h+1:00 to h+2:00</WFText>
              <WFText size={24} weight={600} style={{ fontFamily: 'serif', lineHeight: 1.2 }}>The middle hour</WFText>
              <WFPlaceholder height={120} label="HR + carbs · h1–h2" />
              <WFText size={12} style={{ lineHeight: 1.5 }}>Carbs hit 88 g/h. HR steady at 158. You took 3 gels and a bottle swap on schedule.</WFText>
              <WFBox padding={12} style={{ background: WF_BG_FILL, border: 'none' }}>
                <WFText size={11} weight={500}>How did your stomach feel here?</WFText>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {['😀 great', '🙂 fine', '😐 meh', '😖 bad'].map((b, i) => (
                    <div key={i} style={{ flex: 1, padding: '8px', textAlign: 'center', background: i === 1 ? WF_ACCENT : '#fff', color: i === 1 ? '#fff' : WF_INK, border: `1px solid ${i === 1 ? WF_ACCENT : WF_LINE}`, borderRadius: 4, fontSize: 11 }}>{b}</div>
                  ))}
                </div>
              </WFBox>
            </WFBox>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <WFBox padding={16}>
                <WFText size={10} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>journey</WFText>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {['Start · 0:00', 'First hour · h0–h1', 'Middle hour · h1–h2', 'The wall · h2–h3', 'Finish · h3–end'].map((c, i) => (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: i === 2 ? WF_BG_FILL : 'transparent', borderRadius: 4 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 999, background: i < 2 ? WF_ACCENT : '#fff', border: `1.5px solid ${i <= 2 ? WF_ACCENT : WF_LINE}` }} />
                      <WFText size={11} color={i > 2 ? WF_INK_MUTED : WF_INK} weight={i === 2 ? 600 : 400}>{c}</WFText>
                    </div>
                  ))}
                </div>
              </WFBox>

              <WFBox padding={16}>
                <WFText size={10} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>jot a note · optional</WFText>
                <WFLine width="100%" height={6} mt={10} />
                <WFLine width="80%" height={6} mt={6} />
                <WFLine width="60%" height={6} mt={6} />
              </WFBox>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <WFBtn ghost>← Previous chapter</WFBtn>
            <WFBtn primary>Next chapter →</WFBtn>
          </div>
        </div>
        {showAnno && <WFArrowNote text="walked through, not a form" x={460} y={100} dir="down" />}
      </WFArtboard>

      {/* V2 — Plan vs actual diff */}
      <WFArtboard label="V2 — Plan vs Actual" hypothesis="Side-by-side · what worked · auto-extract lessons" width={1280} height={720}>
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <WFH title="Plan vs Actual" sub="Marathon de Nantes · 3h 41m · target 3h 45m · faster than planned" mb={0} />

          <WFBox padding={16}>
            <WFText size={10} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>fueling timeline · planned (top) · actual (bottom)</WFText>
            <div style={{ marginTop: 12, position: 'relative' }}>
              {[
                { y: 0, label: 'planned', items: [10, 22, 34, 46, 58, 70, 82, 94] },
                { y: 50, label: 'actual', items: [11, 24, 35, 44, 57, 73, 80, 95] },
              ].map((row, ri) => (
                <div key={ri} style={{ position: 'relative', height: 30, marginBottom: 12 }}>
                  <WFText size={9} color={WF_INK_MUTED} style={{ position: 'absolute', left: 0, top: 0, width: 60, textTransform: 'uppercase' }}>{row.label}</WFText>
                  <div style={{ position: 'absolute', left: 70, right: 0, top: 14, height: 2, background: WF_LINE }} />
                  {row.items.map((x, i) => (
                    <div key={i} style={{ position: 'absolute', left: `calc(70px + ${x}% * (100% - 70px) / 100)`, top: 6, width: 16, height: 16, borderRadius: 4, background: ri === 0 ? '#fff' : WF_ACCENT, border: `1.5px solid ${WF_ACCENT}`, transform: 'translateX(-50%)' }} />
                  ))}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: WF_INK_FAINT, paddingLeft: 70 }}>
                {['0:00', '0:30', '1:00', '1:30', '2:00', '2:30', '3:00', '3:30', '3:41'].map(t => <span key={t}>{t}</span>)}
              </div>
            </div>
          </WFBox>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { l: 'avg g/h', plan: '88', act: '85', delta: '-3', ok: true },
              { l: 'fluid', plan: '1500ml', act: '1320ml', delta: '-180', ok: false },
              { l: 'sodium', plan: '2.6g', act: '2.6g', delta: '0', ok: true },
              { l: 'caffeine', plan: '200mg', act: '200mg', delta: '0', ok: true },
            ].map(s => (
              <WFBox key={s.l} padding={12}>
                <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>{s.l}</WFText>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <WFText size={16} weight={600}>{s.act}</WFText>
                  <WFText size={10} color={s.ok ? WF_INK_MUTED : '#c43'}>Δ {s.delta}</WFText>
                </div>
                <WFText size={9} color={WF_INK_FAINT}>plan {s.plan}</WFText>
              </WFBox>
            ))}
          </div>

          <WFBox padding={20} style={{ background: WF_BG_FILL, border: 'none', flex: 1 }}>
            <WFText size={11} weight={600} color={WF_ACCENT} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>auto-extracted lessons · review & save</WFText>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Fluid 12% under target', 'Carry a 3rd bottle next time? Hot weather race coming up.'],
                ['Stomach OK at 85 g/h', 'Confirms 80–88 g/h is your safe zone. Lock for next plan.'],
                ['Caffeine timing worked', 'Both doses landed before fatigue. Keep this cadence.'],
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: 10, background: '#fff', borderRadius: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, border: `1px solid ${WF_LINE}`, marginTop: 1, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <WFText size={12} weight={600}>{row[0]}</WFText>
                    <WFText size={11} color={WF_INK_MUTED} mt={2}>{row[1]}</WFText>
                  </div>
                  <span style={{ fontSize: 11, color: WF_INK_MUTED }}>edit</span>
                </div>
              ))}
            </div>
          </WFBox>
        </div>
        {showAnno && <WFArrowNote text="the lesson, not the data" x={520} y={460} dir="down" />}
      </WFArtboard>

      {/* V3 — Mood / vibe debrief (mobile) */}
      <WFArtboard label="V3 — Vibe (mobile)" hypothesis="Quick · emotional · 4 swipes done · journal-feel" width={760} height={720}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32, gap: 24 }}>
          <WFPhone>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: WF_INK_MUTED }}>
                <span style={{ textTransform: 'uppercase' }}>step 2 of 4</span>
                <span>skip</span>
              </div>
              <div style={{ height: 3, background: WF_BG_FILL, borderRadius: 2 }}>
                <div style={{ height: '100%', width: '50%', background: WF_ACCENT, borderRadius: 2 }} />
              </div>
              <WFText size={11} color={WF_ACCENT} weight={600} style={{ textTransform: 'uppercase' }} mt={20}>question 2</WFText>
              <WFText size={24} weight={600} style={{ lineHeight: 1.2 }}>How did your stomach feel?</WFText>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {[
                  ['Bulletproof', 'No issues anywhere'],
                  ['Mostly fine', 'Some slosh after h2'],
                  ['Took a hit', 'GI cramps · had to slow'],
                  ['Disaster', 'Couldn\'t take fuel'],
                ].map((opt, i) => (
                  <div key={i} style={{ padding: 14, border: `1px solid ${i === 1 ? WF_ACCENT : WF_LINE}`, borderRadius: 8, background: i === 1 ? '#fff7f3' : '#fff' }}>
                    <WFText size={13} weight={600}>{opt[0]}</WFText>
                    <WFText size={11} color={WF_INK_MUTED} mt={2}>{opt[1]}</WFText>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <WFBtn>← Back</WFBtn>
                <WFBtn primary full>Next →</WFBtn>
              </div>
            </div>
          </WFPhone>

          <WFPhone>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
              <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>your race · summary</WFText>
              <div>
                <WFText size={28} weight={600} style={{ fontFamily: 'serif' }}>3h 41m</WFText>
                <WFText size={12} color={WF_INK_MUTED}>Marathon de Nantes · 4 May</WFText>
              </div>

              {/* journal entries */}
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Stomach', 'Mostly fine · some slosh after h2', '🙂'],
                  ['Energy', 'Strong start, dipped at km 32', '😐'],
                  ['Mind', 'Stayed positive, mantra worked', '😀'],
                  ['Fueling', 'Hit target g/h · light on fluid', '🙂'],
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: 12, background: WF_BG_FILL, borderRadius: 6 }}>
                    <span style={{ fontSize: 20 }}>{r[2]}</span>
                    <div style={{ flex: 1 }}>
                      <WFText size={10} color={WF_INK_MUTED} style={{ textTransform: 'uppercase' }}>{r[0]}</WFText>
                      <WFText size={12} mt={2}>{r[1]}</WFText>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1 }} />
              <WFBtn primary full>Save & continue</WFBtn>
            </div>
          </WFPhone>
        </div>
        {showAnno && <WFArrowNote text="4 questions, then done" x={300} y={50} dir="down" />}
      </WFArtboard>

      {/* V4 — Coach summary (auto + you confirm) */}
      <WFArtboard label="V4 — Coach summary" hypothesis="System writes the debrief · you correct · low effort, high signal" width={1280} height={720}>
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', maxWidth: 920 }}>
          <div>
            <WFText size={11} color={WF_INK_MUTED} style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>here's what we saw · edit anything that's wrong</WFText>
            <WFH title="Marathon de Nantes — race report" mt={6} mb={0} />
          </div>

          <WFBox padding={24} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: WF_INK }}>
              <p style={{ margin: 0 }}>
                You finished in <span style={{ background: '#fff7f3', borderBottom: `2px dotted ${WF_ACCENT}`, padding: '0 2px' }}>3h 41m</span>, four minutes ahead of plan. Your average carb intake was <span style={{ background: '#fff7f3', borderBottom: `2px dotted ${WF_ACCENT}`, padding: '0 2px' }}>85 g/h</span> — within 4% of the 88 g/h target. Stomach reported <span style={{ background: '#fff7f3', borderBottom: `2px dotted ${WF_ACCENT}`, padding: '0 2px' }}>mostly fine</span>, with mild slosh after hour 2.
              </p>
              <p style={{ margin: '12px 0 0' }}>
                The standout was caffeine timing — both 100 mg doses landed before low points. The miss was fluid: you ended <span style={{ background: '#fff5f5', borderBottom: `2px dotted #c43`, padding: '0 2px' }}>180 ml short</span> across the race. The next race in Vichy will be warmer — we should plan for a 3rd bottle pickup.
              </p>
            </div>
          </WFBox>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <WFBox padding={16}>
              <WFText size={10} weight={600} color={WF_ACCENT} style={{ textTransform: 'uppercase' }}>save as a rule</WFText>
              <WFText size={13} weight={500} mt={6}>"Aim for 80–88 g/h on flat marathons"</WFText>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <WFBtn sm primary>Save</WFBtn>
                <WFBtn sm ghost>Edit</WFBtn>
              </div>
            </WFBox>
            <WFBox padding={16}>
              <WFText size={10} weight={600} color={WF_ACCENT} style={{ textTransform: 'uppercase' }}>save as a rule</WFText>
              <WFText size={13} weight={500} mt={6}>"Carry a 3rd bottle when temp ≥ 18°"</WFText>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <WFBtn sm primary>Save</WFBtn>
                <WFBtn sm ghost>Edit</WFBtn>
              </div>
            </WFBox>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <WFBtn primary>Looks right · save report</WFBtn>
            <WFBtn>Edit summary</WFBtn>
            <WFBtn ghost>Re-write from scratch</WFBtn>
          </div>
        </div>
        {showAnno && <WFArrowNote text="dotted = system filled · click to edit" x={650} y={260} dir="left" />}
      </WFArtboard>
    </div>
  );
}

window.S_Debrief = S_Debrief;
