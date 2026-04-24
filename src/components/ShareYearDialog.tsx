import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import html2canvas from "html2canvas";
import { Download, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  buildYearGrid, computeYearStats, monthLabels, colorFor, isToday,
  type HeatmapPalette,
} from "@/lib/yearHeatmap";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; year: number }

interface ShareTheme {
  bg: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  cardBg: string;
  cardBorder: string;
  palette: HeatmapPalette;
}

const MIDNIGHT: ShareTheme = {
  bg: "linear-gradient(160deg,#0a0a0f 0%,#16162a 50%,#0d1117 100%)",
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.55)",
  accent: "#FF6F00",
  accentSoft: "rgba(255,111,0,0.12)",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
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
};

// Card dims — portrait, story-friendly, also fits IG feed (4:5)
const CARD_W = 1080;
const CARD_H = 1350;

export function ShareYearDialog({ open, onClose, year }: Props) {
  const { logs, settings } = useStore();
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const grid = buildYearGrid(logs, settings.calorieGoal, year);
  const stats = computeYearStats(grid);
  const months = monthLabels(grid);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Measure available preview width and scale the 1080×1350 card to fit
  useLayoutEffect(() => {
    if (!open) return;
    const compute = () => {
      const el = previewWrapRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const s = Math.min(w / CARD_W, h / CARD_H, 1);
      setScale(s);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [open]);

  if (!open) return null;

  const download = async () => {
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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 text-white safe-top">
        <div className="text-sm font-semibold">Share your year</div>
        <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10 active:bg-white/20">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preview — fills available space, card is scaled to fit */}
      <div
        ref={previewWrapRef}
        className="flex-1 min-h-0 px-4 py-3 flex items-center justify-center overflow-hidden"
      >
        <div
          style={{
            width: CARD_W * scale,
            height: CARD_H * scale,
            position: "relative",
          }}
        >
          <div
            style={{
              width: CARD_W,
              height: CARD_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              borderRadius: 24 / scale,
              overflow: "hidden",
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7)",
            }}
          >
            <ShareCard
              ref={cardRef}
              theme={MIDNIGHT}
              year={year}
              userName={settings.userName}
              goal={settings.calorieGoal}
              stats={stats}
              grid={grid}
              months={months}
            />
          </div>
        </div>
      </div>

      {/* Actions — sticky bottom, thumb-friendly */}
      <div className="px-4 pt-3 pb-6 bg-gradient-to-t from-black via-black/90 to-transparent safe-bottom">
        <button
          disabled={busy}
          onClick={download}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold active:scale-[0.98] transition disabled:opacity-50 shadow-lg"
        >
          <Download className="w-5 h-5" /> {busy ? "Generating…" : "Save image"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Share Card (1080×1350 portrait) ---------------- */

interface ShareCardProps {
  theme: ShareTheme;
  year: number;
  userName: string;
  goal: number;
  stats: ReturnType<typeof computeYearStats>;
  grid: ReturnType<typeof buildYearGrid>;
  months: ReturnType<typeof monthLabels>;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ theme: t, year, userName, goal, stats, grid, months }, ref) => {
    const SQ = 18;
    const GAP = 4;
    const colW = SQ + GAP;
    const gridW = 53 * colW - GAP;
    const displayName = (userName || "").trim() || "Foodie";

    return (
      <div
        ref={ref}
        style={{
          width: CARD_W,
          height: CARD_H,
          background: t.bg,
          color: t.text,
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "72px 64px 56px",
        }}
      >
        {/* ---------- Top: Brand chip ---------- */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${t.accent}, #E65100)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28,
            }}>🍛</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1 }}>Thali</div>
              <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4, fontWeight: 500 }}>Indian calorie tracker</div>
            </div>
          </div>
          <div style={{
            fontSize: 14, fontWeight: 800, letterSpacing: 2,
            color: t.accent, padding: "8px 16px", borderRadius: 999,
            background: t.accentSoft,
            border: `1px solid ${t.cardBorder}`,
          }}>
            {year}
          </div>
        </div>

        {/* ---------- Title block ---------- */}
        <div style={{ marginTop: 64, zIndex: 2 }}>
          <div style={{ fontSize: 16, color: t.textMuted, letterSpacing: 6, fontWeight: 700, textTransform: "uppercase" }}>
            My Year in Calories
          </div>
          <div style={{
            fontSize: 88, fontWeight: 900, marginTop: 14, letterSpacing: -3, lineHeight: 0.95,
          }}>
            {displayName}
          </div>
          <div style={{ fontSize: 18, color: t.textMuted, marginTop: 14, fontWeight: 500 }}>
            {goal.toLocaleString()} kcal/day goal
          </div>
        </div>

        {/* ---------- Heatmap card ---------- */}
        <div style={{
          marginTop: 44,
          padding: "32px 28px",
          background: t.cardBg,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 24,
          display: "flex", flexDirection: "column", alignItems: "center",
          zIndex: 2,
        }}>
          {/* month labels */}
          <div style={{ display: "flex", width: gridW, marginBottom: 8 }}>
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

          {/* Legend inline below grid */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 18,
            marginTop: 20, fontSize: 12, color: t.textMuted, fontWeight: 600,
          }}>
            <LegendChip c={t.palette.under[2]} label="Under" t={t} />
            <LegendChip c={t.palette.on_track[3]} label="On goal" t={t} />
            <LegendChip c={t.palette.over[2]} label="Over" t={t} />
            <LegendChip c={t.palette.way_over[2]} label="Cheat" t={t} />
          </div>
        </div>

        {/* ---------- Stats grid (2×2, big numbers) ---------- */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 28, zIndex: 2,
        }}>
          <ShareStat t={t} label="Current streak" value={`${stats.streak}`} unit="days" />
          <ShareStat t={t} label="Days logged" value={`${stats.loggedDays}`} unit={`/ ${stats.totalDays}`} />
          <ShareStat t={t} label="On goal" value={`${stats.onGoalPct}%`} unit="of days" />
          <ShareStat
            t={t}
            label="Best day"
            value={stats.bestDay ? stats.bestDay.kcal.toLocaleString() : "—"}
            unit={stats.bestDay ? `kcal · ${format(parseISO(stats.bestDay.date), "MMM d")}` : "no data"}
          />
        </div>

        {/* ---------- Footer ---------- */}
        <div style={{
          marginTop: "auto", paddingTop: 28,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: `1px solid ${t.cardBorder}`,
          zIndex: 2,
        }}>
          <div style={{ fontSize: 13, color: t.textMuted, fontWeight: 600, lineHeight: 1.4 }}>
            Tracked with <span style={{ color: t.text, fontWeight: 800 }}>Thali</span> 🍛<br/>
            <span style={{ fontSize: 11, opacity: 0.75 }}>Powered by IFCT 2017 · NIN, Hyderabad 🇮🇳</span>
          </div>
          <div style={{
            fontSize: 11, color: t.textMuted, fontWeight: 700, letterSpacing: 1.5,
            padding: "6px 12px", borderRadius: 8, border: `1px solid ${t.cardBorder}`,
          }}>
            mythali.app
          </div>
        </div>
      </div>
    );
  },
);
ShareCard.displayName = "ShareCard";

function ShareStat({ t, label, value, unit }: { t: ShareTheme; label: string; value: string; unit: string }) {
  return (
    <div style={{
      background: t.cardBg, border: `1px solid ${t.cardBorder}`,
      borderRadius: 18, padding: "20px 22px",
    }}>
      <div style={{
        fontSize: 11, color: t.textMuted, fontWeight: 700,
        letterSpacing: 1.2, textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 44, fontWeight: 900, color: t.accent,
        lineHeight: 1.05, marginTop: 8, letterSpacing: -1.5,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4, fontWeight: 600 }}>
        {unit}
      </div>
    </div>
  );
}

function LegendChip({ c, label, t }: { c: string; label: string; t: ShareTheme }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: c, display: "inline-block" }} />
      <span style={{ color: t.textMuted }}>{label}</span>
    </span>
  );
}
