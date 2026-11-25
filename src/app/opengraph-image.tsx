import { ImageResponse } from "next/og";

export const alt = "Signal: turn feedback noise into product signal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card shown when a Signal link is shared on LinkedIn, Slack, X and so on. */
export default function OpenGraphImage() {
  const ink = "#1b1b19";
  const muted = "#76756e";
  const accent = "#2b50d6";
  const line = "#e4e3df";
  const bar = (label: string, n: number, w: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 22, color: "#44443f" }}>
      <div style={{ display: "flex", width: 300 }}>{label}</div>
      <div style={{ display: "flex", width: 260, height: 14, background: "#f2f2ef", borderRadius: 4 }}>
        <div style={{ display: "flex", width: w, height: 14, background: accent, borderRadius: 4 }} />
      </div>
      <div style={{ display: "flex", color: muted }}>{n}</div>
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f7f5", padding: "64px 72px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "flex-end", fontSize: 40, fontWeight: 700, color: ink, letterSpacing: -1.8 }}>
          signal
          <div style={{ display: "flex", width: 10, height: 10, borderRadius: 999, background: accent, marginLeft: 2, marginBottom: 9 }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 66, fontWeight: 700, color: ink, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 1060 }}>
            {["Turn", "feedback", "noise", "into", "product"].map((w) => (
              <span key={w} style={{ display: "flex", marginRight: 18 }}>{w}</span>
            ))}
            <span style={{ display: "flex", color: accent }}>signal.</span>
          </div>
          <div style={{ display: "flex", fontSize: 28, color: muted, maxWidth: 980 }}>
            Themes, evidence and priorities from support tickets, reviews and interviews.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: `2px solid ${line}`, paddingTop: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bar("Slow dashboard loading", 12, 235)}
            {bar("Pricing and plan limits", 11, 215)}
            {bar("Missing notifications", 11, 215)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, fontSize: 22, color: muted }}>
            <div style={{ display: "flex" }}>Free · open source · runs in your browser</div>
            <div style={{ display: "flex", color: accent, fontWeight: 700 }}>signal-voc.vercel.app</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
