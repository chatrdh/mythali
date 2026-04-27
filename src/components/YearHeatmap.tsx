import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Flame, Calendar, Target, Zap } from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  buildYearGrid,
  computeYearStats,
  monthLabels,
  PALETTES,
  colorFor,
  isToday,
  type DayCell,
} from "@/lib/yearHeatmap";


const SQUARE = 12;       // desktop px (incl gap calc); we use w-3 h-3
const SQUARE_MOBILE = 10;

export function YearHeatmap() {
  const { logs, settings } = useStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [hover, setHover] = useState<{ cell: DayCell; x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDark = settings.darkMode;
  const palette = PALETTES[isDark ? "dark" : "light"];

  const grid = useMemo(
    () => buildYearGrid(logs, settings.calorieGoal, year),
    [logs, settings.calorieGoal, year],
  );
  const stats = useMemo(() => computeYearStats(grid), [grid]);
  const months = useMemo(() => monthLabels(grid), [grid]);

  // Available years: current year + any year present in logs
  const years = useMemo(() => {
    const ys = new Set<number>([new Date().getFullYear()]);
    logs.forEach((l) => ys.add(parseISO(l.date).getFullYear()));
    return [...ys].sort((a, b) => b - a);
  }, [logs]);

  // Auto-scroll to the right so the current week & month are in focus on mount/year change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Defer to next frame to ensure layout is computed
    requestAnimationFrame(() => {
      el.scrollTo({ left: el.scrollWidth, behavior: "auto" });
    });
  }, [year, grid]);

  return (
    <div className="rounded-2xl bg-card shadow-card p-4 border border-border/50 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">My Year in Calories</div>
          <div className="text-xs text-muted-foreground">
            {year} · {stats.loggedDays} days logged · vs {settings.calorieGoal.toLocaleString()} kcal goal
          </div>
        </div>
        <div className="flex items-center gap-2">
          {years.length > 1 && (
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="text-xs bg-muted rounded-lg px-2 py-1 font-medium border-0 focus:ring-1 focus:ring-ring"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}

        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard icon={<Flame className="w-3.5 h-3.5" />} value={`${stats.streak}`} label="day streak" tone="primary" />
        <StatCard icon={<Calendar className="w-3.5 h-3.5" />} value={`${stats.loggedDays}`} label={`/ ${stats.totalDays} days`} />
        <StatCard icon={<Target className="w-3.5 h-3.5" />} value={`${stats.onGoalDays}`} label={`on goal (${stats.onGoalPct}%)`} tone="success" />
        <StatCard
          icon={<Zap className="w-3.5 h-3.5" />}
          value={stats.bestDay ? `${stats.bestDay.kcal.toLocaleString()}` : "—"}
          label={stats.bestDay ? `best · ${format(parseISO(stats.bestDay.date), "MMM d")}` : "no data"}
        />
      </div>

      {/* Grid — sticky day labels on the left, horizontally-scrolling weeks on the right */}
      <div className="flex">
        {/* Sticky day-of-week labels — match grid cell height (16) + gap (3) = 19 */}
        <div
          className="flex flex-col select-none flex-shrink-0 pt-[22px]"
          style={{ width: 26, marginRight: 4, gap: 3 }}
        >
          {["Mon", "", "Wed", "", "Fri", "", ""].map((d, i) => (
            <div key={i} style={{ height: 16, lineHeight: "16px" }} className="text-[11px] text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Scrollable area: month labels + week columns */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto no-scrollbar">
          <div className="inline-block">
            {/* Month labels — aligned with grid columns (each col = 16 + 3 gap = 19px) */}
            <div className="flex mb-1.5 select-none" style={{ height: 16 }}>
              {grid.map((_, i) => {
                const m = months.find((mm) => mm.col === i);
                return (
                  <div key={i} style={{ width: 19 }} className="text-[11px] text-muted-foreground font-medium">
                    {m?.label ?? ""}
                  </div>
                );
              })}
            </div>
            <div className="flex" style={{ gap: 3 }}>
              {grid.map((col, ci) => (
                <div key={ci} className="flex flex-col" style={{ gap: 3 }}>
                  {col.map((cell) => {
                    const today = isToday(cell.date);
                    return (
                      <div
                        key={cell.key}
                        onMouseEnter={(e) => cell.inYear && setHover({ cell, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => cell.inYear && setHover({ cell, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHover(null)}
                        onClick={(e) => cell.inYear && setHover({ cell, x: e.clientX, y: e.clientY })}
                        className="rounded-[3px] transition-transform hover:scale-150 cursor-pointer"
                        style={{
                          width: 16,
                          height: 16,
                          background: colorFor(cell, palette),
                          boxShadow: today ? `inset 0 0 0 1.5px ${palette.todayBorder}` : undefined,
                          opacity: cell.inYear ? 1 : 0.35,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend — simplified to two states */}
      <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground">
        <LegendDot c={palette.on_track[2]} label="On goal" />
        <LegendDot c={palette.over[2]} label="Over goal" />
      </div>

      {/* Tooltip */}
      {hover && hover.cell.inYear && (
        <Tooltip x={hover.x} y={hover.y} cell={hover.cell} />
      )}


    </div>
  );
}

function StatCard({
  icon, value, label, tone,
}: { icon: React.ReactNode; value: string; label: string; tone?: "primary" | "success" }) {
  const accent = tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-xl bg-muted/50 border border-border/50 px-3 py-2.5">
      <div className={`flex items-center gap-1.5 ${accent}`}>
        {icon}
        <span className="font-mono-num text-lg font-bold leading-none">{value}</span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</div>
    </div>
  );
}

function Swatch({ c }: { c: string }) {
  return <div className="w-3 h-3 rounded-[3px]" style={{ background: c }} />;
}
function LegendDot({ c, label }: { c: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-sm" style={{ background: c }} />
      {label}
    </span>
  );
}

function Tooltip({ x, y, cell }: { x: number; y: number; cell: DayCell }) {
  const d = cell.data;
  const dateStr = format(cell.date, "EEE, MMM d");
  // Position above cursor; clamp to viewport
  const tx = Math.min(Math.max(x + 12, 8), window.innerWidth - 220);
  const ty = Math.max(y - 90, 8);
  return (
    <div
      className="fixed z-50 pointer-events-none rounded-xl px-3 py-2 text-[11px] animate-fade-in"
      style={{
        left: tx, top: ty,
        background: "rgba(15,15,15,0.92)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        minWidth: 200,
      }}
    >
      <div className="font-semibold mb-0.5">📅 {dateStr}</div>
      {d ? (
        <>
          <div className="font-mono-num">🔥 {d.kcal.toLocaleString()} / {d.goal.toLocaleString()} kcal</div>
          <div className="text-white/70 mb-1">{Math.round(d.pct)}% · {d.pct <= 110 ? "On goal" : "Over goal"}</div>
          <div className="font-mono-num text-white/80">P {d.protein}g · C {d.carbs}g · F {d.fat}g</div>
        </>
      ) : (
        <div className="text-white/60">No data</div>
      )}
    </div>
  );
}
