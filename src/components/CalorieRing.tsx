import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Props {
  consumed: number;
  goal: number;
  size?: number;
  className?: string;
}

export const CalorieRing = ({ consumed, goal, size = 280, className }: Props) => {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min(consumed / goal, 1.2);

  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(pct * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const stroke = 14;
  const radius = (size - stroke) / 2;
  const C = 2 * Math.PI * radius;
  const offset = C * (1 - Math.min(animated, 1));

  const over = consumed > goal;
  const ringColor = over ? "hsl(var(--destructive))" : "hsl(var(--primary-glow))";
  const remaining = goal - consumed;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={radius} stroke="hsl(var(--cream-200))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          stroke={over ? ringColor : "url(#ringGrad)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: "stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono-num text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Today</div>
        <div className="font-display text-[44px] font-semibold leading-none text-foreground tabular-nums">
          {Math.round(consumed).toLocaleString()}
        </div>
        <div className="font-mono-num text-[11px] text-muted-foreground mt-2 tracking-wider">
          / {goal.toLocaleString()} kcal
        </div>
        <div className={cn(
          "mt-3 font-mono-num text-[11px] tracking-[0.04em] px-3.5 py-1 rounded-full border",
          over
            ? "bg-destructive/10 text-destructive border-destructive/30"
            : "bg-success/10 text-success border-success/30"
        )}>
          {over ? `${Math.round(-remaining)} over` : `${Math.round(remaining)} left`}
        </div>
      </div>
    </div>
  );
};
