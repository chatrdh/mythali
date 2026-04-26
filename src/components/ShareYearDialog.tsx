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
  surface: string;       // inner card surface (parchment)
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;        // rose
  accentSoft: string;    // rose tint
  border: string;
  divider: string;
  palette: HeatmapPalette;
}

/* "Rose & Cream" share theme — premium wellness journal feel.
   Solid colors throughout (html2canvas-safe). */
const ROSE_CREAM: ShareTheme = {
  bg: "#FAF7F5",            // warm parchment
  surface: "#FFFFFF",
  text: "#2C1F27",          // deep plum-black
  textMuted: "#8B6B78",     // muted mauve
  textSubtle: "#C4A8B5",    // placeholder mauve
  accent: "#A0546A",        // dusty rose
  accentSoft: "#FAF0F3",    // rose tint
  border: "rgba(160,84,106,0.14)",
  divider: "rgba(160,84,106,0.10)",
  palette: {
    empty: "#F1E7EB",
    outOfYear: "#F8F1F4",
    under:    { 1: "#5C8A6E", 2: "#5C8A6E", 3: "#5C8A6E" },
    light:    { 1: "#5C8A6E", 2: "#5C8A6E", 3: "#5C8A6E" },
    on_track: { 1: "#5C8A6E", 2: "#5C8A6E", 3: "#5C8A6E" },
    over:     { 1: "#A04455", 2: "#A04455", 3: "#A04455" },
    big_over: { 1: "#A04455", 2: "#A04455", 3: "#A04455" },
    way_over: { 1: "#A04455", 2: "#A04455", 3: "#A04455" },
    todayBorder: "rgba(160,84,106,0.55)",
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
    <div
      className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: "rgba(44,31,39,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 safe-top" style={{ color: "#F5ECF0" }}>
        <div className="font-display italic text-[18px]">Share your year</div>
        <button
          onClick={onClose}
          className="p-2 -m-2 rounded-full transition"
          style={{ color: "#F5ECF0" }}
          aria-label="Close"
        >
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
              borderRadius: 28 / scale,
              overflow: "hidden",
              boxShadow: "0 30px 70px -20px rgba(44,31,39,0.55)",
            }}
          >
            <ShareCard
              ref={cardRef}
              theme={ROSE_CREAM}
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
      <div
        className="px-5 pt-3 pb-6 safe-bottom"
        style={{ background: "linear-gradient(to top, rgba(22,14,18,0.95), rgba(22,14,18,0.6) 60%, transparent)" }}
      >
        <button
          disabled={busy}
          onClick={download}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-full font-medium tracking-wide active:scale-[0.98] transition disabled:opacity-50"
          style={{
            background: "#A0546A",
            color: "#FFFFFF",
            boxShadow: "0 8px 24px rgba(160,84,106,0.35), 0 0 20px rgba(196,114,138,0.2)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            letterSpacing: "0.03em",
          }}
        >
          <Download className="w-[18px] h-[18px]" /> {busy ? "Generating…" : "Save image"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Share Card (1080×1350 portrait, Rose & Cream) ---------------- */

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
    const SQ = 14;
    const GAP = 3;
    const colW = SQ + GAP;
    const gridW = 53 * colW - GAP;
    const displayName = (userName || "").trim() || "Foodie";

    const sansStack = "'DM Sans', system-ui, -apple-system, sans-serif";
    const displayStack = "'Cormorant Garamond', Georgia, serif";
    const monoStack = "'DM Mono', ui-monospace, monospace";

    return (
      <div
        ref={ref}
        style={{
          width: CARD_W,
          height: CARD_H,
          background: t.bg,
          color: t.text,
          fontFamily: sansStack,
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "80px 72px 64px",
        }}
      >
        {/* Decorative soft rose orb (top-right) */}
        <div
          style={{
            position: "absolute",
            top: -180, right: -160,
            width: 520, height: 520,
            borderRadius: "50%",
            background: "#FAF0F3",
            opacity: 0.85,
            zIndex: 1,
          }}
        />
        {/* Decorative blush orb (bottom-left) */}
        <div
          style={{
            position: "absolute",
            bottom: -200, left: -180,
            width: 460, height: 460,
            borderRadius: "50%",
            background: "#FDF5F7",
            opacity: 0.7,
            zIndex: 1,
          }}
        />

        {/* ---------- Top: Brand chip ---------- */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "#A0546A",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30,
              boxShadow: "0 6px 16px rgba(160,84,106,0.25)",
            }}>🍛</div>
            <div>
              <div style={{
                fontFamily: displayStack,
                fontSize: 30, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1,
                fontStyle: "italic",
              }}>
                Thali
              </div>
              <div style={{
                fontFamily: monoStack,
                fontSize: 11, color: t.textMuted, marginTop: 6,
                letterSpacing: 2, textTransform: "uppercase",
              }}>
                Indian calorie tracker
              </div>
            </div>
          </div>
          <div style={{
            fontFamily: monoStack,
            fontSize: 14, fontWeight: 500, letterSpacing: 3,
            color: t.accent, padding: "10px 20px", borderRadius: 999,
            background: t.accentSoft,
            border: `1px solid ${t.border}`,
          }}>
            {year}
          </div>
        </div>

        {/* ---------- Title block ---------- */}
        <div style={{ marginTop: 72, zIndex: 2 }}>
          <div style={{
            fontFamily: monoStack,
            fontSize: 13, color: t.textMuted, letterSpacing: 6,
            fontWeight: 500, textTransform: "uppercase",
          }}>
            My Year in Calories
          </div>
          <div style={{
            fontFamily: displayStack,
            fontSize: 132, fontWeight: 600, marginTop: 18,
            letterSpacing: -2, lineHeight: 0.95,
            fontStyle: "italic",
            color: t.text,
          }}>
            {displayName}
          </div>
          <div style={{
            fontFamily: monoStack,
            fontSize: 14, color: t.textMuted, marginTop: 18,
            letterSpacing: 1.5,
          }}>
            {goal.toLocaleString()} kcal · daily goal
          </div>
        </div>

        {/* ---------- Heatmap card ---------- */}
        <div style={{
          marginTop: 48,
          padding: "36px 32px 30px",
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 24,
          display: "flex", flexDirection: "column", alignItems: "center",
          boxShadow: "0 4px 30px rgba(160,84,106,0.06)",
          zIndex: 2,
        }}>
          {/* month labels */}
          <div style={{ display: "flex", width: gridW, marginBottom: 10 }}>
            {grid.map((_, i) => {
              const m = months.find((mm) => mm.col === i);
              return (
                <div key={i} style={{
                  width: colW,
                  fontFamily: monoStack,
                  fontSize: 10,
                  color: t.textMuted,
                  letterSpacing: 0.5,
                }}>
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
                        opacity: cell.inYear ? 1 : 0.45,
                        boxShadow: today ? `inset 0 0 0 1.5px ${t.palette.todayBorder}` : undefined,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend inline below grid — two states */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 28,
            marginTop: 24,
            fontFamily: monoStack,
            fontSize: 11, color: t.textMuted, letterSpacing: 1.2,
            textTransform: "uppercase",
          }}>
            <LegendChip c={t.palette.on_track[2]} label="On goal" t={t} />
            <LegendChip c={t.palette.over[2]} label="Over goal" t={t} />
          </div>
        </div>

        {/* ---------- Stats grid (2×2, editorial display numbers) ---------- */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 30, zIndex: 2,
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
          marginTop: "auto", paddingTop: 32,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: `1px solid ${t.divider}`,
          zIndex: 2,
        }}>
          <div style={{ lineHeight: 1.6 }}>
            <div style={{
              fontFamily: sansStack,
              fontSize: 13, color: t.textMuted, fontWeight: 400,
            }}>
              Tracked with{" "}
              <span style={{
                fontFamily: displayStack,
                color: t.accent, fontWeight: 600, fontStyle: "italic", fontSize: 16,
              }}>
                Thali
              </span>{" "}
              🍛
            </div>
            <div style={{
              fontFamily: monoStack,
              fontSize: 10, color: t.textSubtle, letterSpacing: 1, marginTop: 4,
            }}>
              Powered by IFCT 2017 · NIN, Hyderabad 🇮🇳
            </div>
          </div>
          <div style={{
            fontFamily: monoStack,
            fontSize: 11, color: t.accent, fontWeight: 500, letterSpacing: 2,
            padding: "8px 16px", borderRadius: 999,
            border: `1px solid ${t.border}`,
            background: t.accentSoft,
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
  const sansStack = "'DM Sans', system-ui, -apple-system, sans-serif";
  const displayStack = "'Cormorant Garamond', Georgia, serif";
  const monoStack = "'DM Mono', ui-monospace, monospace";
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 20,
      padding: "24px 26px",
      boxShadow: "0 2px 16px rgba(160,84,106,0.05)",
    }}>
      <div style={{
        fontFamily: monoStack,
        fontSize: 10, color: t.textMuted, fontWeight: 500,
        letterSpacing: 2, textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: displayStack,
        fontSize: 64, fontWeight: 600, color: t.accent,
        lineHeight: 1.05, marginTop: 10, letterSpacing: -1.5,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: sansStack,
        fontSize: 13, color: t.textMuted, marginTop: 4, fontWeight: 400,
      }}>
        {unit}
      </div>
    </div>
  );
}

function LegendChip({ c, label, t }: { c: string; label: string; t: ShareTheme }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: c, display: "inline-block" }} />
      <span style={{ color: t.textMuted }}>{label}</span>
    </span>
  );
}
