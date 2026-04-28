import { useMemo } from "react";
import { Cell, ResponsiveContainer, PieChart, Pie } from "recharts";
import { addDays, format, startOfDay } from "date-fns";
import { useStore } from "@/store/useStore";
import { YearHeatmap } from "@/components/YearHeatmap";

export default function Insights() {
  const { logs, settings } = useStore();

  const week = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, -6 + i);
      const key = format(d, "yyyy-MM-dd");
      const total = logs.filter((l) => l.date === key).reduce((a, l) => a + l.calories, 0);
      return { day: format(d, "EEE"), key, kcal: Math.round(total) };
    });
  }, [logs]);

  const avg = Math.round(week.reduce((a, d) => a + d.kcal, 0) / 7);

  const macros = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const weekKeys = new Set(week.map((w) => w.key));
    const weekLogs = logs.filter((l) => weekKeys.has(l.date));
    const p = weekLogs.reduce((a, l) => a + l.protein, 0);
    const c = weekLogs.reduce((a, l) => a + l.carbs, 0);
    const f = weekLogs.reduce((a, l) => a + l.fat, 0);
    return [
      { name: "Protein", value: Math.round(p * 4), color: "hsl(var(--primary))" },
      { name: "Carbs",   value: Math.round(c * 4), color: "hsl(var(--accent))" },
      { name: "Fat",     value: Math.round(f * 9), color: "hsl(var(--secondary))" },
    ].filter((x) => x.value > 0);
  }, [logs, week]);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; ; i++) {
      const key = format(addDays(new Date(), -i), "yyyy-MM-dd");
      if (logs.some((l) => l.date === key)) s++;
      else break;
      if (s > 365) break;
    }
    return s;
  }, [logs]);

  const mostLogged = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    logs.forEach((l) => {
      const cur = counts.get(l.foodId);
      counts.set(l.foodId, { name: l.foodName, count: (cur?.count ?? 0) + 1 });
    });
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [logs]);

  return (
    <div className="max-w-2xl mx-auto pb-28 safe-top px-4 pt-4 space-y-4">
      <h1 className="text-xl font-bold">Insights</h1>

      <YearHeatmap />

      {macros.length > 0 && (
        <div className="rounded-2xl bg-card shadow-card p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground">Weekly macro split (kcal)</div>
              <div className="font-mono-num text-lg font-bold mt-0.5">
                {avg.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kcal/day avg</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl">🔥</div>
              <div className="text-xs font-semibold">{streak}-day streak</div>
            </div>
          </div>
          <div className="h-48 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={macros} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {macros.map((m) => <Cell key={m.name} fill={m.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-1/2 space-y-1.5">
              {macros.map((m) => (
                <li key={m.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                    {m.name}
                  </span>
                  <span className="font-mono-num">{m.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {mostLogged.length > 0 && (
        <div className="rounded-2xl bg-card shadow-card p-4 border border-border/50">
          <div className="text-sm font-semibold mb-2">Most logged foods</div>
          <ul className="space-y-2">
            {mostLogged.map((f, i) => (
              <li key={f.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="text-muted-foreground font-mono-num w-4">{i + 1}</span>{f.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-semibold">{f.count}×</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
