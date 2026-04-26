import { FoodLog, MealType, useStore } from "@/store/useStore";
import { Plus, Trash2 } from "lucide-react";
import { useState, useRef, TouchEvent } from "react";

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
    <div className="rounded-[20px] bg-card shadow-card overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.emoji}</span>
          <span className="font-display italic text-[17px] font-semibold text-foreground">{meta.label}</span>
        </div>
        <div className="font-mono-num text-[12px] text-primary-glow">
          {Math.round(total)} <span className="text-muted-foreground">kcal</span>
        </div>
      </div>

      <div>
        {logs.length === 0 ? (
          <div className="text-[12px] text-muted-foreground px-4 pb-3 italic font-display">No items yet.</div>
        ) : (
          <ul>
            {logs.map((l) => (
              <SwipeItem key={l.id} log={l} />
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => { onAdd(meal); if (navigator.vibrate) navigator.vibrate(8); }}
        className="w-full text-left px-4 py-3 border-t border-border text-primary text-[12px] font-medium tracking-wide hover:bg-rose-100 transition-colors flex items-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" /> Add food
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
    <li className="relative overflow-hidden border-t border-border">
      <div className="absolute inset-0 bg-destructive flex items-center justify-end pr-5">
        <Trash2 className="w-4 h-4 text-destructive-foreground" />
      </div>
      <div
        className="relative bg-card flex items-center justify-between px-4 py-2.5"
        style={{ transform: `translateX(${dx}px)`, transition: dx === 0 ? "transform 0.25s" : "none" }}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      >
        <div className="min-w-0 flex-1">
          <div className="text-[14px] text-foreground truncate">{log.foodName}</div>
          <div className="font-mono-num text-[11px] text-muted-foreground truncate">
            {log.regionalName} · {Math.round(log.quantityGrams)}g
          </div>
        </div>
        <div className="font-mono-num text-[13px] text-foreground ml-3">
          {Math.round(log.calories)}
        </div>
      </div>
    </li>
  );
};
