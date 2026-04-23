import { addDays, format, getDay, getMonth, startOfDay, startOfWeek, isSameDay } from "date-fns";
import type { FoodLog } from "@/store/useStore";

export type DayState = "not_logged" | "under" | "light" | "on_track" | "over" | "big_over" | "way_over";

export interface DayCell {
  date: Date;
  key: string;        // YYYY-MM-DD
  inYear: boolean;    // belongs to selected year
  data?: {
    kcal: number;
    goal: number;
    pct: number;
    state: DayState;
    intensity: 1 | 2 | 3;
    protein: number;
    carbs: number;
    fat: number;
    meals: number;
  };
}

export interface YearStats {
  streak: number;
  loggedDays: number;
  totalDays: number;       // days in selected year up to today (or full year if past)
  onGoalDays: number;
  onGoalPct: number;
  bestDay?: { kcal: number; date: string };
}

const stateOf = (pct: number): DayState => {
  if (pct < 50) return "under";
  if (pct < 80) return "light";
  if (pct <= 110) return "on_track";
  if (pct <= 130) return "over";
  if (pct <= 160) return "big_over";
  return "way_over";
};

const intensityOf = (pct: number, state: DayState): 1 | 2 | 3 => {
  // 3 levels per state, mapped to where pct sits within band
  switch (state) {
    case "under":     return pct < 17 ? 1 : pct < 34 ? 2 : 3;
    case "light":     return pct < 60 ? 1 : pct < 70 ? 2 : 3;
    case "on_track":  return pct < 90 ? 1 : pct < 100 ? 2 : 3;
    case "over":      return pct < 117 ? 1 : pct < 124 ? 2 : 3;
    case "big_over":  return pct < 140 ? 1 : pct < 150 ? 2 : 3;
    case "way_over":  return pct < 200 ? 2 : 3;
    default:          return 1;
  }
};

/**
 * Build the 53-column grid. Columns are weeks (Mon-start), rows are Mon..Sun.
 * Anchored so that today sits in the right-most column.
 */
export function buildYearGrid(logs: FoodLog[], goal: number, year: number, today = new Date()): DayCell[][] {
  // Determine the anchor "last column" date.
  // If selected year === current year → anchor = today.
  // If past year → anchor = Dec 31 of that year.
  const isCurrentYear = year === today.getFullYear();
  const anchor = isCurrentYear ? startOfDay(today) : new Date(year, 11, 31);
  // Move anchor to the end of its week (Sunday) so column is "complete-ish"
  const anchorWeekStart = startOfWeek(anchor, { weekStartsOn: 1 }); // Monday
  // 53 columns; the right-most column is anchorWeekStart..+6
  const firstColMonday = addDays(anchorWeekStart, -52 * 7);

  // Build a logs-by-date lookup
  const byDate = new Map<string, FoodLog[]>();
  for (const l of logs) {
    const arr = byDate.get(l.date) ?? [];
    arr.push(l);
    byDate.set(l.date, arr);
  }

  const cols: DayCell[][] = [];
  for (let c = 0; c < 53; c++) {
    const col: DayCell[] = [];
    for (let r = 0; r < 7; r++) {
      const d = addDays(firstColMonday, c * 7 + r);
      const key = format(d, "yyyy-MM-dd");
      const inYear = d.getFullYear() === year && d <= today;
      const dayLogs = byDate.get(key);
      let data: DayCell["data"] | undefined;
      if (inYear && dayLogs && dayLogs.length) {
        const kcal = dayLogs.reduce((a, l) => a + l.calories, 0);
        const protein = dayLogs.reduce((a, l) => a + l.protein, 0);
        const carbs = dayLogs.reduce((a, l) => a + l.carbs, 0);
        const fat = dayLogs.reduce((a, l) => a + l.fat, 0);
        const pct = goal > 0 ? (kcal / goal) * 100 : 0;
        const state = stateOf(pct);
        data = {
          kcal: Math.round(kcal),
          goal,
          pct,
          state,
          intensity: intensityOf(pct, state),
          protein: Math.round(protein),
          carbs: Math.round(carbs),
          fat: Math.round(fat),
          meals: new Set(dayLogs.map((l) => l.mealType)).size,
        };
      }
      col.push({ date: d, key, inYear, data });
    }
    cols.push(col);
  }
  return cols;
}

export function computeYearStats(grid: DayCell[][], today = new Date()): YearStats {
  const flat = grid.flat().filter((c) => c.inYear);
  const logged = flat.filter((c) => c.data);
  const onGoal = logged.filter((c) => c.data!.state === "on_track");
  const best = logged.reduce<DayCell | undefined>(
    (best, c) => (!best || c.data!.kcal > best.data!.kcal ? c : best),
    undefined,
  );

  // streak: consecutive days ending today (or yesterday) with logs
  const sortedKeys = new Set(logged.map((c) => c.key));
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const d = addDays(startOfDay(today), -i);
    const key = format(d, "yyyy-MM-dd");
    if (sortedKeys.has(key)) streak++;
    else if (i === 0) continue; // allow today to be empty without breaking streak
    else break;
  }

  return {
    streak,
    loggedDays: logged.length,
    totalDays: flat.length,
    onGoalDays: onGoal.length,
    onGoalPct: logged.length ? Math.round((onGoal.length / logged.length) * 100) : 0,
    bestDay: best ? { kcal: best.data!.kcal, date: best.key } : undefined,
  };
}

/** Compute month-label positions: { label, colIndex } for first column where each month starts. */
export function monthLabels(grid: DayCell[][]): { label: string; col: number }[] {
  const out: { label: string; col: number }[] = [];
  let lastMonth = -1;
  grid.forEach((col, i) => {
    // use the first in-year date in the column, fallback to first
    const ref = col.find((c) => c.inYear) ?? col[0];
    const m = getMonth(ref.date);
    if (m !== lastMonth) {
      out.push({ label: format(ref.date, "MMM"), col: i });
      lastMonth = m;
    }
  });
  return out;
}

/* ---------- Color palette (HEX so it works inside html2canvas + tooltips) ---------- */

export type ThemeMode = "light" | "dark";

interface PaletteEntry { 1: string; 2: string; 3: string }
export interface HeatmapPalette {
  empty: string;
  outOfYear: string;
  under: PaletteEntry;
  light: PaletteEntry;
  on_track: PaletteEntry;
  over: PaletteEntry;
  big_over: PaletteEntry;
  way_over: PaletteEntry;
  todayBorder: string;
}

export const PALETTES: Record<ThemeMode, HeatmapPalette> = {
  dark: {
    empty: "#1e1e1e",
    outOfYear: "#141414",
    under:    { 1: "#0d2a3d", 2: "#1a4a6b", 3: "#2196F3" },
    light:    { 1: "#0d2a3d", 2: "#1a4a6b", 3: "#42a5f5" },
    on_track: { 1: "#2d6a3f", 2: "#388e3c", 3: "#4CAF50" },
    over:     { 1: "#cc7a00", 2: "#FF9800", 3: "#ffb74d" },
    big_over: { 1: "#c62828", 2: "#E53935", 3: "#ef5350" },
    way_over: { 1: "#8b1a1a", 2: "#b71c1c", 3: "#7f0000" },
    todayBorder: "rgba(255,255,255,0.55)",
  },
  light: {
    empty: "#ebedf0",
    outOfYear: "#f5f5f5",
    under:    { 1: "#cfe5f5", 2: "#64b5f6", 3: "#1976d2" },
    light:    { 1: "#cfe5f5", 2: "#64b5f6", 3: "#1e88e5" },
    on_track: { 1: "#a5d6a7", 2: "#66bb6a", 3: "#2e7d32" },
    over:     { 1: "#ffe0b2", 2: "#ffb74d", 3: "#f57c00" },
    big_over: { 1: "#ef9a9a", 2: "#ef5350", 3: "#c62828" },
    way_over: { 1: "#b71c1c", 2: "#8b0000", 3: "#5a0000" },
    todayBorder: "rgba(0,0,0,0.5)",
  },
};

export function colorFor(cell: DayCell, palette: HeatmapPalette): string {
  if (!cell.inYear) return palette.outOfYear;
  if (!cell.data) return palette.empty;
  return palette[cell.data.state][cell.data.intensity];
}

export function isToday(d: Date, today = new Date()) {
  return isSameDay(d, today);
}
