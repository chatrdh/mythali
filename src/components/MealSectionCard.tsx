import { FoodLog, MealType, useStore } from "@/store/useStore";
import { Plus, Trash2 } from "lucide-react";
import { useState, useRef, TouchEvent } from "react";
import { cn } from "@/lib/utils";

const MEAL_META: Record<MealType, { label: string; emoji: string }> = {
  BREAKFAST: { label: "Breakfast", emoji: "🌅" },
  LUNCH:     { label: "Lunch",     emoji: "☀️" },
  DINNER:    { label: "Dinner",    emoji: "🌙" },
  SNACKS:    { label: "Snacks",    emoji: "🍎" },
};

interface Props {
  meal: MealType;
  logs: FoodLog[];
  onAdd: (meal: MealType) => void;
}

export const MealSectionCard = ({ meal, logs, onAdd }: Props) => {
  const meta = MEAL_META[meal];
  const total = logs.reduce((a, l) => a + l.calories, 0);

  return (
    <div className="rounded-2xl bg-card border border-border/50 shadow-card overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <span className="font-semibold text-foreground">{meta.label}</span>
        </div>
        <div className="font-mono-num text-sm font-semibold text-foreground">
          {Math.round(total)} <span className="text-muted-foreground font-normal text-xs">kcal</span>
        </div>
      </div>

      <div className="px-2">
        {logs.length === 0 ? (
          <div className="text-xs text-muted-foreground px-2 pb-3">No items yet.</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {logs.map((l) => (
              <SwipeItem key={l.id} log={l} />
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => { onAdd(meal); if (navigator.vibrate) navigator.vibrate(8); }}
        className="flex items-center gap-1.5 mx-4 my-3 text-primary text-sm font-semibold hover:text-primary-glow transition-colors"
      >
        <Plus className="w-4 h-4" /> Add food
      </button>
    </div>
  );
};

const SwipeItem = ({ log }: { log: FoodLog }) => {
  const removeLog = useStore((s) => s.removeLog);
  const [dx, setDx] = useState(0);
  const startX = useRef(0);

  const onStart = (e: TouchEvent) => (startX.current = e.touches[0].clientX);
  const onMove = (e: TouchEvent) => {
    const d = e.touches[0].clientX - startX.current;
    if (d < 0) setDx(Math.max(d, -100));
  };
  const onEnd = () => {
    if (dx < -70) {
      if (navigator.vibrate) navigator.vibrate(12);
      removeLog(log.id);
    } else setDx(0);
  };

  return (
    <li className="relative overflow-hidden">
      <div className="absolute inset-0 bg-destructive flex items-center justify-end pr-5">
        <Trash2 className="w-5 h-5 text-destructive-foreground" />
      </div>
      <div
        className={cn("relative bg-card flex items-center justify-between px-3 py-2.5 transition-transform")}
        style={{ transform: `translateX(${dx}px)`, transition: dx === 0 ? "transform 0.25s" : "none" }}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">{log.foodName}</div>
          <div className="text-xs text-muted-foreground truncate">
            {log.regionalName} · {Math.round(log.quantityGrams)}g
          </div>
        </div>
        <div className="font-mono-num text-sm font-semibold text-foreground ml-3">
          {Math.round(log.calories)}
        </div>
      </div>
    </li>
  );
};
