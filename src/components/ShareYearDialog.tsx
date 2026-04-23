import { forwardRef, useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import html2canvas from "html2canvas";
import { Download, Share2, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  buildYearGrid, computeYearStats, monthLabels, colorFor, isToday,
  type HeatmapPalette,
} from "@/lib/yearHeatmap";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; year: number }

type ThemeKey = "midnight" | "saffron";

interface ShareTheme {
  key: ThemeKey;
  name: string;
  bg: string;
  text: string;
  textMuted: string;
  accent: string;
  cardBg: string;
  cardBorder: string;
  palette: HeatmapPalette;
  rangoli: boolean;
}

const THEMES: Record<ThemeKey, ShareTheme> = {
  midnight: {
    key: "midnight",
    name: "Midnight",
    bg: "linear-gradient(135deg,#0a0a0f 0%,#1a1a2e 50%,#0d1117 100%)",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.6)",
    accent: "#FF6F00",
    cardBg: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(255,255,255,0.08)",
    rangoli: false,
    palette: {
      empty: "#161b22",
      outOfYear: "#0d1117",
      under:    { 1: "#0d2a3d", 2: "#1a4a6b", 3: "#2196F3" },
      light:    { 1: "#0d2a3d", 2: "#1a4a6b", 3: "#42a5f5" },
      on_track: { 1: "#2d6a3f", 2: "#388e3c", 3: "#4CAF50" },
      over:     { 1: "#cc7a00", 2: "#FF9800", 3: "#ffb74d" },
      big_over: { 1: "#c62828", 2: "#E53935", 3: "#ef5350" },
      way_over: { 1: "#8b1a1a", 2: "#b71c1c", 3: "#7f0000" },
      todayBorder: "rgba(255,255,255,0.7)",
    },
  },
  saffron: {
    key: "saffron",
    name: "Saffron",
    bg: "linear-gradient(135deg,#1a0a00 0%,#3d1a00 50%,#1a0800 100%)",
    text: "#ffd080",
    textMuted: "rgba(255,208,128,0.65)",
    accent: "#FF6F00",
    cardBg: "rgba(255,111,0,0.06)",
    cardBorder: "rgba(255,208,128,0.15)",
    rangoli: true,
    palette: {
      empty: "#2a1200",
      outOfYear: "#1a0800",
      under:    { 1: "#3d2510", 2: "#7a4a1a", 3: "#d99020" },
      light:    { 1: "#3d2510", 2: "#7a4a1a", 3: "#e8a040" },
      on_track: { 1: "#3d5a1f", 2: "#6b8e2f", 3: "#a8c43f" },
      over:     { 1: "#cc6600", 2: "#FF8800", 3: "#ffaa44" },
      big_over: { 1: "#a02020", 2: "#d83030", 3: "#ff5050" },
      way_over: { 1: "#700000", 2: "#9a0000", 3: "#5a0000" },
      todayBorder: "rgba(255,208,128,0.85)",
    },
  },
};

export function ShareYearDialog({ open, onClose, year }: Props) {
  const { logs, settings } = useStore();
  const [theme, setTheme] = useState<ThemeKey>("midnight");
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const grid = buildYearGrid(logs, settings.calorieGoal, year);
  const stats = computeYearStats(grid);
  const months = monthLabels(grid);
  const t = THEMES[theme];

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const generate = async (action: "share" | "download") => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob failed"))), "image/png"),
      );
      const filename = `thali-year-${year}.png`;
      if (action === "share" && (navigator as any).canShare) {
        const file = new File([blob], filename, { type: "image/png" });
        if ((navigator as any).canShare({ files: [file] })) {
          await (navigator as any).share({
            title: `My Year in Calories ${year}`,
            text: `${stats.loggedDays} days logged · ${stats.streak}-day streak · ${stats.onGoalPct}% on goal. Tracked with Thali 🍛`,
            files: [file],
          });
          setBusy(false);
          return;
        }
      }
      // Fallback download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success("Saved to your device");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="text-sm font-semibold">Share your year</div>
        <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto px-4 flex items-start justify-center">
        <div
          className="origin-top"
          style={{
            transform: "scale(var(--share-scale))",
            // Scale to fit width on mobile
            ['--share-scale' as any]: `min(1, calc((100vw - 32px) / 1080))`,
          }}
        >
          <ShareCard
            ref={cardRef}
            theme={t}
            year={year}
            userName={settings.userName}
            stats={stats}
            grid={grid}
            months={months}
          />
        </div>
      </div>

      {/* Theme + actions */}
      <div className="p-4 pb-6 space-y-3 bg-black/40 backdrop-blur-md safe-bottom">
        <div className="flex items-center gap-2 justify-center">
          {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setTheme(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                theme === k ? "bg-white text-black border-white" : "text-white border-white/30 hover:border-white/60"
              }`}
            >
              {THEMES[k].name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 max-w-md mx-auto">
          <button
            disabled={busy}
            onClick={() => generate("download")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-semibold border border-white/15 hover:bg-white/15 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Save
          </button>
          <button
            disabled={busy}
            onClick={() => generate("share")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" /> {busy ? "Generating…" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Share Card (1080×1080, fixed pixel layout) ---------------- */

interface ShareCardProps {
  theme: ShareTheme;
  year: number;
  userName: string;
  stats: ReturnType<typeof computeYearStats>;
  grid: ReturnType<typeof buildYearGrid>;
  months: ReturnType<typeof monthLabels>;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ theme: t, year, userName, stats, grid, months }, ref) => {
    const SQ = 16; // bigger squares for share
    const GAP = 3;
    const colW = SQ + GAP;
    const gridW = 53 * colW - GAP;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          background: t.bg,
          color: t.text,
          fontFamily: "Inter, system-ui, sans-serif",
          padding: 56,
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {t.rangoli && <RangoliCorners color={t.accent} />}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${t.accent}, #E65100)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>🍛</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Thali</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>Indian calorie tracker</div>
            </div>
          </div>
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
            color: t.accent, padding: "6px 12px", borderRadius: 999,
            border: `1px solid ${t.cardBorder}`,
          }}>
            {year}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginTop: 56, textAlign: "center" }}>
          <div style={{ fontSize: 14, color: t.textMuted, letterSpacing: 4, fontWeight: 600 }}>
            MY YEAR IN CALORIES
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, marginTop: 8, letterSpacing: -1.5, lineHeight: 1 }}>
            {userName ? userName : "A year of meals"}
          </div>
        </div>

        {/* Heatmap grid (centered) */}
        <div style={{
          marginTop: 48,
          padding: 32,
          background: t.cardBg,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 24,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          {/* month labels */}
          <div style={{ display: "flex", width: gridW, marginBottom: 6, paddingLeft: 0 }}>
            {grid.map((_, i) => {
              const m = months.find((mm) => mm.col === i);
              return (
                <div key={i} style={{ width: colW, fontSize: 11, color: t.textMuted, fontWeight: 600 }}>
                  {m?.label ?? ""}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: GAP }}>
            {grid.map((col, ci) => (
              <div key={ci} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {col.map((cell) => {
                  const today = isToday(cell.date);
                  return (
                    <div
                      key={cell.key}
                      style={{
                        width: SQ, height: SQ, borderRadius: 3,
                        background: colorFor(cell, t.palette),
                        opacity: cell.inYear ? 1 : 0.35,
                        boxShadow: today ? `inset 0 0 0 1.5px ${t.palette.todayBorder}` : undefined,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 32 }}>
          <ShareStat t={t} icon="🔥" value={`${stats.streak}`} label="day streak" />
          <ShareStat t={t} icon="📅" value={`${stats.loggedDays}`} label="days logged" />
          <ShareStat t={t} icon="🎯" value={`${stats.onGoalPct}%`} label="on goal" />
        </div>

        {/* Legend + footer */}
        <div style={{
          position: "absolute", left: 56, right: 56, bottom: 40,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: t.textMuted }}>
            <LegendChip c={t.palette.under[2]} label="Under" t={t} />
            <LegendChip c={t.palette.on_track[3]} label="On goal" t={t} />
            <LegendChip c={t.palette.over[2]} label="Over" t={t} />
            <LegendChip c={t.palette.way_over[2]} label="Cheat" t={t} />
          </div>
          <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>
            Tracked with Thali · IFCT 2017 🇮🇳
          </div>
        </div>
      </div>
    );
  };
  return Object.assign(
    // forwardRef-equivalent
    require("react").forwardRef(Component) as React.ForwardRefExoticComponent<any>,
    {},
  );
})();

function ShareStat({ t, icon, value, label }: { t: ShareTheme; icon: string; value: string; label: string }) {
  return (
    <div style={{
      background: t.cardBg, border: `1px solid ${t.cardBorder}`,
      borderRadius: 16, padding: "20px 24px",
    }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 38, fontWeight: 900, color: t.accent, lineHeight: 1.1, marginTop: 4, letterSpacing: -1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4, fontWeight: 600, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

function LegendChip({ c, label, t }: { c: string; label: string; t: ShareTheme }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />
      <span style={{ color: t.textMuted }}>{label}</span>
    </span>
  );
}

function RangoliCorners({ color }: { color: string }) {
  const corner = (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <g stroke={color} strokeWidth="1.2" opacity="0.35" fill="none">
        <circle cx="60" cy="60" r="50" />
        <circle cx="60" cy="60" r="36" />
        <circle cx="60" cy="60" r="22" />
        <circle cx="60" cy="60" r="8" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={60} y1={60} x2={60 + Math.cos(a) * 50} y2={60 + Math.sin(a) * 50} />;
        })}
      </g>
      <g fill={color} opacity="0.5">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <circle key={i} cx={60 + Math.cos(a) * 36} cy={60 + Math.sin(a) * 36} r="2" />;
        })}
      </g>
    </svg>
  );
  return (
    <>
      <div style={{ position: "absolute", top: -30, left: -30 }}>{corner}</div>
      <div style={{ position: "absolute", top: -30, right: -30, transform: "scaleX(-1)" }}>{corner}</div>
      <div style={{ position: "absolute", bottom: -30, left: -30, transform: "scaleY(-1)" }}>{corner}</div>
      <div style={{ position: "absolute", bottom: -30, right: -30, transform: "scale(-1,-1)" }}>{corner}</div>
    </>
  );
}
