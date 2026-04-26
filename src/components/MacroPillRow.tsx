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
  <div className="grid grid-cols-3 gap-2.5">
    {macros.map((m) => {
      const pct = Math.min(m.value / m.goal, 1);
      return (
        <div key={m.label} className="rounded-2xl bg-card shadow-card p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[15px]">{m.emoji}</span>
            <span className="font-mono-num text-[9px] tracking-[0.14em] uppercase text-muted-foreground">{m.label}</span>
          </div>
          <div className="font-mono-num text-[15px] font-medium text-foreground">
            {Math.round(m.value)}
            <span className="text-muted-foreground font-normal text-[11px]">/{m.goal}{m.unit ?? "g"}</span>
          </div>
          <div className="mt-2 h-[3px] rounded-full bg-cream-200 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700")}
              style={{
                width: `${pct * 100}%`,
                background: "linear-gradient(90deg, hsl(var(--primary-glow)), hsl(var(--accent)))",
              }}
            />
          </div>
        </div>
      );
    })}
  </div>
);
