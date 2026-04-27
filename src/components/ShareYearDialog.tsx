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
  surface: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentGlow: string;
  border: string;
  divider: string;
  palette: HeatmapPalette;
}

/* Dark premium theme — deep plum with rose accents */
const DARK_ROSE: ShareTheme = {
  bg: "#120C10",
  surface: "#1C1318",
  text: "#F5ECF0",
  textMuted: "#9E7A8A",
  textSubtle: "#5A3E4C",
  accent: "#E8A0B4",
  accentGlow: "#D4849C",
  border: "rgba(232,160,180,0.12)",
  divider: "rgba(232,160,180,0.08)",
  palette: {
    empty: "#1E151A",
    outOfYear: "#160E12",
    under:    { 1: "#7AAE94", 2: "#7AAE94", 3: "#7AAE94" },
    light:    { 1: "#7AAE94", 2: "#7AAE94", 3: "#7AAE94" },
    on_track: { 1: "#7AAE94", 2: "#7AAE94", 3: "#7AAE94" },
    over:     { 1: "#A04455", 2: "#A04455", 3: "#A04455" },
    big_over: { 1: "#A04455", 2: "#A04455", 3: "#A04455" },
    way_over: { 1: "#A04455", 2: "#A04455", 3: "#A04455" },
    todayBorder: "rgba(232,160,180,0.65)",
  },
};

const CARD_W = 1080;
const CARD_H = 1920; // Full 9:16 portrait for stories

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
      style={{ background: "#0A0709", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
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

      {/* Preview */}
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
              borderRadius: 32 / scale,
              overflow: "hidden",
              boxShadow: "0 40px 100px -30px rgba(232,160,180,0.15)",
            }}
          >
            <ShareCard
              ref={cardRef}
              theme={DARK_ROSE}
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

      {/* Actions */}
      <div
        className="px-5 pt-3 pb-6 safe-bottom"
        style={{ background: "linear-gradient(to top, rgba(10,7,9,0.98), rgba(10,7,9,0.6) 60%, transparent)" }}
      >
        <button
          disabled={busy}
          onClick={download}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-full font-medium tracking-wide active:scale-[0.98] transition disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #E8A0B4, #D4849C)",
            color: "#120C10",
            boxShadow: "0 8px 32px rgba(232,160,180,0.25), 0 0 24px rgba(212,132,156,0.15)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.03em",
          }}
        >
          <Download className="w-[18px] h-[18px]" /> {busy ? "Generating…" : "Save image"}
        </button>
      </div>
    </div>
  );
}

/* ─── Share Card (1080×1920 portrait, Dark Rose) ─── */

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

    const sans = "'DM Sans', system-ui, -apple-system, sans-serif";
    const display = "'Cormorant Garamond', Georgia, serif";
    const mono = "'DM Mono', ui-monospace, monospace";

    return (
      <div
        ref={ref}
        style={{
          width: CARD_W,
          height: CARD_H,
          background: t.bg,
          color: t.text,
          fontFamily: sans,
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "0",
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: -250, right: -200,
            width: 600, height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,160,180,0.08) 0%, transparent 70%)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -300, left: -200,
            width: 700, height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(122,174,148,0.06) 0%, transparent 70%)",
            zIndex: 1,
          }}
        />

        {/* ── Top section ── */}
        <div style={{ padding: "80px 72px 0", zIndex: 2 }}>
          {/* Brand + Year */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                fontSize: 32,
                width: 52, height: 52,
                borderRadius: 14,
                background: "rgba(232,160,180,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>🍛</div>
              <div>
                <div style={{
                  fontFamily: display, fontSize: 28, fontWeight: 600,
                  fontStyle: "italic", letterSpacing: -0.3, lineHeight: 1,
                  color: t.accent,
                }}>Thali</div>
                <div style={{
                  fontFamily: mono, fontSize: 10, color: t.textMuted,
                  letterSpacing: 2.5, textTransform: "uppercase", marginTop: 6,
                }}>Indian calorie tracker</div>
              </div>
            </div>
            <div style={{
              fontFamily: mono, fontSize: 48, fontWeight: 500,
              color: t.textSubtle, letterSpacing: -1,
            }}>{year}</div>
          </div>

          {/* Divider */}
          <div style={{
            height: 1, background: t.divider,
            margin: "48px 0 52px",
          }} />

          {/* Name + subtitle */}
          <div style={{
            fontFamily: mono, fontSize: 11, color: t.textMuted,
            letterSpacing: 5, textTransform: "uppercase", fontWeight: 500,
          }}>My Year in Calories</div>
          <div style={{
            fontFamily: display, fontSize: 120, fontWeight: 600,
            fontStyle: "italic", lineHeight: 0.95, marginTop: 20,
            color: t.text, letterSpacing: -2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>{displayName}</div>
          <div style={{
            fontFamily: mono, fontSize: 13, color: t.textMuted,
            letterSpacing: 1.5, marginTop: 20,
          }}>
            {goal.toLocaleString()} kcal · daily goal
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 1, margin: "52px 72px 0",
          background: t.divider, borderRadius: 20, overflow: "hidden",
          zIndex: 2,
        }}>
          <StatCell t={t} value={`${stats.streak}`} label="Streak" unit="days" />
          <StatCell t={t} value={`${stats.loggedDays}`} label="Logged" unit={`of ${stats.totalDays}`} />
          <StatCell t={t} value={`${stats.onGoalPct}%`} label="On Goal" accent />
          <StatCell
            t={t}
            value={stats.bestDay ? stats.bestDay.kcal.toLocaleString() : "—"}
            label="Best Day"
            unit={stats.bestDay ? format(parseISO(stats.bestDay.date), "MMM d") : ""}
          />
        </div>

        {/* ── Heatmap ── */}
        <div style={{
          margin: "44px 72px 0",
          padding: "36px 36px 28px",
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 24,
          display: "flex", flexDirection: "column", alignItems: "center",
          zIndex: 2,
        }}>
          {/* Month labels */}
          <div style={{ display: "flex", width: gridW, marginBottom: 10 }}>
            {grid.map((_, i) => {
              const m = months.find((mm) => mm.col === i);
              return (
                <div key={i} style={{
                  width: colW, fontFamily: mono,
                  fontSize: 10, color: t.textMuted, letterSpacing: 0.5,
                }}>
                  {m?.label ?? ""}
                </div>
              );
            })}
          </div>
          {/* Grid */}
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
                        opacity: cell.inYear ? 1 : 0.3,
                        boxShadow: today ? `inset 0 0 0 1.5px ${t.palette.todayBorder}` : undefined,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 32,
            marginTop: 22, fontFamily: mono,
            fontSize: 10, color: t.textMuted, letterSpacing: 1.5,
            textTransform: "uppercase",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: t.palette.on_track[2], display: "inline-block" }} />
              On goal
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: t.palette.over[2], display: "inline-block" }} />
              Over goal
            </span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          marginTop: "auto",
          padding: "0 72px 72px",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          zIndex: 2,
        }}>
          <div>
            <div style={{
              fontFamily: sans, fontSize: 13, color: t.textMuted, fontWeight: 400,
            }}>
              Tracked with{" "}
              <span style={{
                fontFamily: display, color: t.accent, fontWeight: 600,
                fontStyle: "italic", fontSize: 16,
              }}>Thali</span>
              {" "}🍛
            </div>
            <div style={{
              fontFamily: mono, fontSize: 10, color: t.textSubtle,
              letterSpacing: 1, marginTop: 6,
            }}>
              IFCT 2017 · NIN, Hyderabad 🇮🇳
            </div>
          </div>
          <div style={{
            fontFamily: mono, fontSize: 11, color: t.accent,
            fontWeight: 500, letterSpacing: 2,
            padding: "8px 18px", borderRadius: 999,
            border: `1px solid ${t.border}`,
            background: "rgba(232,160,180,0.06)",
          }}>
            mythali.app
          </div>
        </div>
      </div>
    );
  },
);
ShareCard.displayName = "ShareCard";

function StatCell({
  t, value, label, unit, accent,
}: { t: ShareTheme; value: string; label: string; unit?: string; accent?: boolean }) {
  const display = "'Cormorant Garamond', Georgia, serif";
  const mono = "'DM Mono', ui-monospace, monospace";
  const sans = "'DM Sans', system-ui, -apple-system, sans-serif";
  return (
    <div style={{
      background: t.surface,
      padding: "28px 20px 24px",
      display: "flex", flexDirection: "column", alignItems: "center",
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: mono, fontSize: 9, color: t.textMuted, fontWeight: 500,
        letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10,
      }}>{label}</div>
      <div style={{
        fontFamily: display, fontSize: 48, fontWeight: 600,
        color: accent ? "#7AAE94" : t.accent,
        lineHeight: 1, letterSpacing: -1.5,
      }}>{value}</div>
      {unit && (
        <div style={{
          fontFamily: sans, fontSize: 11, color: t.textSubtle,
          marginTop: 8, fontWeight: 400,
        }}>{unit}</div>
      )}
    </div>
  );
}
