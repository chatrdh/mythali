import { cn } from "@/lib/utils";

interface Macro {
  label: string;
  emoji: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
}

export const MacroPillRow = ({ macros }: { macros: Macro[] }) => (
  <div className="grid grid-cols-3 gap-3">
    {macros.map((m) => {
      const pct = Math.min(m.value / m.goal, 1);
      return (
        <div key={m.label} className="rounded-2xl bg-card shadow-card p-3 border border-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">{m.emoji}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{m.label}</span>
          </div>
          <div className="font-mono-num text-sm font-semibold text-foreground">
            {Math.round(m.value)}<span className="text-muted-foreground font-normal">/{m.goal}{m.unit ?? "g"}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500")}
              style={{ width: `${pct * 100}%`, background: m.color }}
            />
          </div>
        </div>
      );
    })}
  </div>
);
