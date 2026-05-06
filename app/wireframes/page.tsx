import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";

const INLINE_WIREFRAME_PRIMITIVES = `
const WF_ACCENT = "oklch(0.72 0.16 50)";
const WF_INK = "#1a1a1a";
const WF_INK_MUTED = "#737373";
const WF_INK_FAINT = "#a3a3a3";
const WF_LINE = "#d6d3d1";
const WF_BG_FILL = "#f5f5f4";
const WF_BG_CARD = "#ffffff";

function WFText({ size = 12, weight = 400, color = WF_INK, mt, mb, style, children }) {
  return <div style={{ fontSize: size, fontWeight: weight, color, marginTop: mt, marginBottom: mb, ...style }}>{children}</div>;
}

function WFIcon({ ch = "•", size = 24, accent = false }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(4, Math.round(size * 0.2)),
        border: \`1px solid \${accent ? WF_ACCENT : WF_LINE}\`,
        background: accent ? WF_ACCENT : "#fff",
        color: accent ? "#fff" : WF_INK,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.max(10, Math.round(size * 0.45)),
        flexShrink: 0,
      }}
    >
      {ch}
    </div>
  );
}

function WFPill({ children, accent = false, style }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        border: \`1px solid \${accent ? WF_ACCENT : WF_LINE}\`,
        background: accent ? "color-mix(in srgb, " + WF_ACCENT + " 15%, white)" : "#fff",
        color: accent ? WF_ACCENT : WF_INK_MUTED,
        padding: "3px 8px",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function WFBtn({ children, primary = false, ghost = false, sm = false, full = false, style }) {
  return (
    <button
      type="button"
      style={{
        height: sm ? 28 : 34,
        borderRadius: 8,
        border: ghost ? "none" : \`1px solid \${primary ? WF_ACCENT : WF_LINE}\`,
        background: primary ? WF_ACCENT : ghost ? "transparent" : "#fff",
        color: primary ? "#fff" : ghost ? WF_INK_MUTED : WF_INK,
        padding: sm ? "0 10px" : "0 14px",
        fontSize: sm ? 11 : 12,
        fontWeight: 600,
        cursor: "default",
        width: full ? "100%" : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function WFBox({ children, label, padding = 16, style }) {
  return (
    <div style={{ border: \`1px solid \${WF_LINE}\`, borderRadius: 10, background: WF_BG_CARD, padding, ...style }}>
      {label && <WFText size={10} color={WF_INK_MUTED} style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</WFText>}
      {children}
    </div>
  );
}

function WFH({ title, sub, level = 1, mt, mb = 10 }) {
  const fontSize = level === 2 ? 22 : 28;
  return (
    <div style={{ marginTop: mt, marginBottom: mb }}>
      <WFText size={fontSize} weight={700} style={{ lineHeight: 1.15 }}>{title}</WFText>
      {sub && <WFText size={12} color={WF_INK_MUTED} mt={4}>{sub}</WFText>}
    </div>
  );
}

function WFLine({ width = "100%", height = 8, mt }) {
  return <div style={{ width, height, borderRadius: 4, background: WF_BG_FILL, marginTop: mt }} />;
}

function WFNote({ children }) {
  return <div style={{ fontFamily: "Caveat, cursive", color: WF_ACCENT, fontSize: 18 }}>{children}</div>;
}

function WFPlaceholder({ height = 100, label = "placeholder" }) {
  return (
    <div
      style={{
        height,
        border: \`1px dashed \${WF_LINE}\`,
        borderRadius: 8,
        background: WF_BG_FILL,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: WF_INK_FAINT,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </div>
  );
}

function WFStats({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: 8 }}>
      {items.map((item) => (
        <WFBox key={item.label} padding={10}>
          <WFText size={9} color={WF_INK_MUTED} style={{ textTransform: "uppercase" }}>{item.label}</WFText>
          <WFText size={14} weight={600} mt={3}>{item.value}</WFText>
        </WFBox>
      ))}
    </div>
  );
}

function WFMap({ height = 180, stops = 5, dark = false, style }) {
  return (
    <div
      style={{
        position: "relative",
        height,
        borderRadius: 10,
        border: \`1px solid \${dark ? "#2a2a2a" : WF_LINE}\`,
        background: dark ? "#141414" : "#f8fafc",
        overflow: "hidden",
        ...style,
      }}
    >
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <path d="M0 250 C 160 180, 280 50, 380 120 S 560 270, 700 140 S 860 40, 1000 120" fill="none" stroke={dark ? "#646464" : "#cbd5e1"} strokeWidth="8" />
        <path d="M0 250 C 160 180, 280 50, 380 120 S 560 270, 700 140 S 860 40, 1000 120" fill="none" stroke={WF_ACCENT} strokeWidth="4" strokeDasharray="12 10" />
      </svg>
      {Array.from({ length: stops }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: \`\${14 + i * (68 / Math.max(1, stops - 1))}%\`,
            top: \`\${32 + ((i % 2) ? 20 : 0)}%\`,
            width: 14,
            height: 14,
            borderRadius: 999,
            background: i === 0 ? WF_ACCENT : dark ? "#2a2a2a" : "#fff",
            border: \`1px solid \${i === 0 ? WF_ACCENT : dark ? "#555" : WF_LINE}\`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}

function WFPhone({ children, dark = false }) {
  return (
    <div
      style={{
        width: 320,
        height: 640,
        borderRadius: 30,
        border: \`8px solid \${dark ? "#121212" : "#171717"}\`,
        background: dark ? "#0a0a0a" : "#fff",
        boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ height: 16, width: 120, borderRadius: 999, background: dark ? "#202020" : "#e5e5e5", margin: "8px auto 0" }} />
      <div style={{ height: "calc(100% - 24px)" }}>{children}</div>
    </div>
  );
}

function WFArrowNote({ text, x = 40, y = 40, dir = "down" }) {
  const rot = {
    down: 90,
    up: -90,
    left: 180,
    right: 0,
    downright: 45,
    downleft: 135,
    upright: -45,
    upleft: -135,
  }[dir] ?? 90;

  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none", color: WF_ACCENT, fontFamily: "Caveat, cursive", fontSize: 20 }}>
      <div>{text}</div>
      <div style={{ transform: \`rotate(\${rot}deg)\`, transformOrigin: "left center", fontSize: 22 }}>→</div>
    </div>
  );
}

function WFArtboard({ label, hypothesis, width = 1280, height = 720, children }) {
  return (
    <section style={{ position: "relative", width, maxWidth: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 12 }}>
        <WFText size={11} weight={600} color={WF_INK_MUTED} style={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</WFText>
        <WFText size={11} color={WF_INK_FAINT} style={{ fontStyle: "italic", textAlign: "right" }}>{hypothesis}</WFText>
      </div>
      <div className="wf-artboard" style={{ position: "relative", height, borderRadius: 14, border: \`1px solid \${WF_LINE}\`, background: "#fff", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
        {children}
      </div>
    </section>
  );
}

Object.assign(window, {
  WF_ACCENT,
  WF_INK,
  WF_INK_MUTED,
  WF_INK_FAINT,
  WF_LINE,
  WF_BG_FILL,
  WF_BG_CARD,
  WFText,
  WFIcon,
  WFPill,
  WFBtn,
  WFBox,
  WFH,
  WFLine,
  WFNote,
  WFPlaceholder,
  WFStats,
  WFMap,
  WFPhone,
  WFArrowNote,
  WFArtboard,
});
`;

type HandoffReadOk = { ok: true; content: string };
type HandoffReadErr = { ok: false; relativePath: string; error: string };
type HandoffRead = HandoffReadOk | HandoffReadErr;

async function readHandoffFile(relativePath: string): Promise<HandoffRead> {
  const absolutePath = path.join(process.cwd(), ".tmp-handoff/fuelos/project", relativePath);
  try {
    const content = await readFile(absolutePath, "utf8");
    return { ok: true, content };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, relativePath, error: message };
  }
}

function WireframesHandoffError({
  title,
  description,
  expectedDir,
  missingFiles,
}: {
  title: string;
  description: ReactNode;
  expectedDir: string;
  missingFiles: { relativePath: string; error: string }[];
}) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#f5f5f4",
        padding: "40px 24px",
        fontFamily: "system-ui, sans-serif",
        color: "#1a1a1a",
      }}
    >
      <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700 }}>{title}</h1>
      <p style={{ margin: "0 0 20px", maxWidth: 560, lineHeight: 1.5, color: "#525252" }}>{description}</p>
      <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>Expected directory</p>
      <code style={{ display: "block", marginBottom: 20, padding: "10px 12px", background: "#e7e5e4", borderRadius: 8, fontSize: 12, wordBreak: "break-all" }}>
        {expectedDir}
      </code>
      <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>Missing or unreadable files ({missingFiles.length})</p>
      <ul style={{ margin: 0, paddingLeft: 20, maxWidth: 640 }}>
        {missingFiles.map((f) => (
          <li key={f.relativePath} style={{ marginBottom: 10 }}>
            <code style={{ fontSize: 12 }}>{f.relativePath}</code>
            <span style={{ display: "block", fontSize: 12, color: "#737373", marginTop: 4 }}>{f.error}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

const HANDOFF_RELATIVE_PATHS = [
  "FuelOS Wireframes.html",
  "tweaks-panel.jsx",
  "surfaces/dashboard.jsx",
  "surfaces/plan-builder.jsx",
  "surfaces/prep.jsx",
  "surfaces/race.jsx",
  "surfaces/debrief.jsx",
  "surfaces/rest.jsx",
] as const;

function buildInlinedWireframeDocument(
  template: string,
  tweaksPanel: string,
  dashboard: string,
  planBuilder: string,
  prep: string,
  race: string,
  debrief: string,
  rest: string
): { ok: true; doc: string } | { ok: false; error: string } {
  try {
    const sourceMap = new Map<string, string>([
      ['<script type="text/babel" src="tweaks-panel.jsx"></script>', `<script type="text/babel">${tweaksPanel}</script>`],
      ['<script type="text/babel" src="wireframe-primitives.jsx"></script>', `<script type="text/babel">${INLINE_WIREFRAME_PRIMITIVES}</script>`],
      ['<script type="text/babel" src="surfaces/dashboard.jsx"></script>', `<script type="text/babel">${dashboard}</script>`],
      ['<script type="text/babel" src="surfaces/plan-builder.jsx"></script>', `<script type="text/babel">${planBuilder}</script>`],
      ['<script type="text/babel" src="surfaces/prep.jsx"></script>', `<script type="text/babel">${prep}</script>`],
      ['<script type="text/babel" src="surfaces/race.jsx"></script>', `<script type="text/babel">${race}</script>`],
      ['<script type="text/babel" src="surfaces/debrief.jsx"></script>', `<script type="text/babel">${debrief}</script>`],
      ['<script type="text/babel" src="surfaces/rest.jsx"></script>', `<script type="text/babel">${rest}</script>`],
    ]);

    let doc = template;
    for (const [needle, replacement] of sourceMap) {
      doc = doc.replace(needle, replacement);
    }
    return { ok: true, doc };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, error: message };
  }
}

export default async function WireframesPage() {
  const handoffDir = path.join(process.cwd(), ".tmp-handoff/fuelos/project");
  const reads = await Promise.all(HANDOFF_RELATIVE_PATHS.map((p) => readHandoffFile(p)));

  const missing = reads
    .map((r, i) => ({ relativePath: HANDOFF_RELATIVE_PATHS[i], r }))
    .filter((x): x is { relativePath: (typeof HANDOFF_RELATIVE_PATHS)[number]; r: HandoffReadErr } => !x.r.ok);

  if (missing.length > 0) {
    return (
      <WireframesHandoffError
        title="Wireframes handoff introuvable"
        description={
          <>
            Les fichiers du bundle FuelOS Wireframes ne sont pas disponibles sous{" "}
            <code style={{ fontSize: "0.95em" }}>.tmp-handoff/fuelos/project/</code>. Extrayez l&apos;archive handoff (zip)
            dans ce dossier à la racine du dépôt, puis rechargez la page.
          </>
        }
        expectedDir={handoffDir}
        missingFiles={missing.map((m) => ({ relativePath: m.relativePath, error: m.r.error }))}
      />
    );
  }

  const [
    template,
    tweaksPanel,
    dashboard,
    planBuilder,
    prep,
    race,
    debrief,
    rest,
  ] = reads.map((r) => (r as HandoffReadOk).content);

  const built = buildInlinedWireframeDocument(
    template,
    tweaksPanel,
    dashboard,
    planBuilder,
    prep,
    race,
    debrief,
    rest
  );

  if (!built.ok) {
    return (
      <WireframesHandoffError
        title="Erreur lors du rendu des wireframes"
        description="Les fichiers handoff ont été lus, mais la construction de la page a échoué."
        expectedDir={handoffDir}
        missingFiles={[{ relativePath: "(build)", error: built.error }]}
      />
    );
  }

  return (
    <main style={{ minHeight: "100dvh", background: "#f5f5f4" }}>
      <iframe
        title="FuelOS Wireframes"
        srcDoc={built.doc}
        style={{ width: "100%", minHeight: "100dvh", border: 0 }}
        sandbox="allow-scripts allow-same-origin"
      />
    </main>
  );
}
