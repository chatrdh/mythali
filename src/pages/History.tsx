import { useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { MealType, useStore } from "@/store/useStore";
import { MealSectionCard } from "@/components/MealSectionCard";
import { cn } from "@/lib/utils";

const MEALS: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"];

export default function History() {
  const logs = useStore((s) => s.logs);
  const [offset, setOffset] = useState(0);
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(today, -6 + i - offset * 7));
  }, [offset]);
  const [selected, setSelected] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const dayLogs = logs.filter((l) => l.date === selected);
  const dayTotal = dayLogs.reduce((a, l) => a + l.calories, 0);

  return (
    <div className="max-w-md mx-auto pb-28 safe-top px-4 pt-4">
      <h1 className="text-xl font-bold mb-3">History</h1>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setOffset((o) => o + 1)} className="text-xs text-muted-foreground px-2">←</button>
        <div className="flex-1 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const isSel = key === selected;
            return (
              <button key={key} onClick={() => setSelected(key)}
                className={cn("flex flex-col items-center py-2 rounded-xl text-xs transition",
                  isSel ? "bg-gradient-primary text-primary-foreground shadow-elevated" : "bg-card")}>
                <span className="opacity-70">{format(d, "EEEEEE")}</span>
                <span className="font-bold text-base">{format(d, "d")}</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => setOffset((o) => Math.max(0, o - 1))} className="text-xs text-muted-foreground px-2">→</button>
      </div>

      <div className="rounded-2xl bg-card shadow-card p-4 mb-4 border border-border/50">
        <div className="text-xs text-muted-foreground">Total for {format(new Date(selected + "T00:00:00"), "d MMM")}</div>
        <div className="font-mono-num text-3xl font-bold">{Math.round(dayTotal)} <span className="text-sm font-normal text-muted-foreground">kcal</span></div>
      </div>

      <div className="space-y-3">
        {MEALS.map((m) => (
          <MealSectionCard key={m} meal={m} logs={dayLogs.filter((l) => l.mealType === m)} onAdd={() => {}} />
        ))}
      </div>
    </div>
  );
}
