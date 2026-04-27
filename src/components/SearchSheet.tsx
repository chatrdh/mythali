import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Plus, Sparkles } from "lucide-react";
import { IFCT_FOODS, CATEGORY_META, FoodCategory, FoodItem } from "@/data/ifct";
import { calcNutrition, MealType, todayStr, useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultMeal: MealType;
  onAddCustom: () => void;
}

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Breakfast", LUNCH: "Lunch", DINNER: "Dinner", SNACKS: "Snacks",
};
const MEALS: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"];

export const SearchSheet = ({ open, onClose, defaultMeal, onAddCustom }: Props) => {
  const { customFoods, logs, addLog } = useStore();
  const [meal, setMeal] = useState<MealType>(defaultMeal);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory | "All">("All");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMeal(defaultMeal);
      // Defensive: blur any focused element when sheet opens (prevents iOS keyboard popping)
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    } else {
      setQuery(""); setSelected(null); setCategory("All"); setQty(100);
    }
  }, [open, defaultMeal]);

  const allFoods = useMemo(() => [...customFoods, ...IFCT_FOODS], [customFoods]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allFoods.filter((f) => {
      if (category !== "All" && f.category !== category) return false;
      if (!q) return true;
      return f.name.toLowerCase().includes(q)
        || f.regional.toLowerCase().includes(q)
        || f.code.toLowerCase().includes(q);
    }).slice(0, 80);
  }, [query, category, allFoods]);

  const recent = useMemo(() => {
    const seen = new Set<string>();
    const out: FoodItem[] = [];
    for (const l of [...logs].sort((a, b) => b.loggedAt - a.loggedAt)) {
      if (seen.has(l.foodId)) continue;
      seen.add(l.foodId);
      const f = allFoods.find((x) => x.id === l.foodId);
      if (f) out.push(f);
      if (out.length >= 10) break;
    }
    return out;
  }, [logs, allFoods]);

  const frequent = useMemo(() => {
    const counts = new Map<string, number>();
    logs.forEach((l) => counts.set(l.foodId, (counts.get(l.foodId) ?? 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => allFoods.find((f) => f.id === id))
      .filter(Boolean) as FoodItem[];
  }, [logs, allFoods]);

  const isUnitFood = !!selected && !!selected.servingUnit && selected.servingUnit !== "g";
  const unitLabel = isUnitFood ? `${selected!.servingUnit}${qty === 1 ? "" : "s"}` : "grams";

  // Reset qty whenever a new food is picked so unit foods default to 1, gram foods to 100.
  const pickFood = (f: FoodItem) => {
    setSelected(f);
    setQty(f.servingUnit && f.servingUnit !== "g" ? 1 : 100);
  };

  const handleAdd = () => {
    if (!selected) return;
    const n = calcNutrition(selected, qty);
    addLog({
      foodId: selected.id,
      foodName: selected.name,
      regionalName: selected.regional,
      category: selected.category,
      mealType: meal,
      date: todayStr(),
      quantityGrams: qty,
      ...n,
    });
    if (navigator.vibrate) navigator.vibrate(15);
    toast.success(`Added to ${MEAL_LABELS[meal]}`, { description: `${Math.round(n.calories)} kcal · ${selected.name}` });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-md" />
      <div
        className="relative bg-card rounded-t-[28px] flex flex-col animate-slide-up shadow-elevated"
        style={{ height: "88dvh", maxHeight: "88dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 pt-2">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between px-4 pb-3">
            <h2 className="text-lg font-bold">Log food</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-5 h-5" /></button>
          </div>

          <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
            {MEALS.map((m) => (
              <button key={m} onClick={() => setMeal(m)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition",
                  meal === m ? "bg-gradient-primary text-primary-foreground shadow-elevated" : "bg-muted text-muted-foreground")}>
                {MEAL_LABELS[m]}
              </button>
            ))}
          </div>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 100+ Indian foods…"
                enterKeyHint="search"
                className="w-full pl-9 pr-3 py-3 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            <Chip active={category === "All"} onClick={() => setCategory("All")} label="All" />
            {(Object.keys(CATEGORY_META) as FoodCategory[]).map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}
                label={`${CATEGORY_META[c].emoji} ${CATEGORY_META[c].label}`} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 min-h-0">
          {!query && category === "All" && (recent.length > 0 || frequent.length > 0) && (
            <div className="space-y-3 px-2 py-2">
              {recent.length > 0 && <HorizRow title="🕐 Recently logged" items={recent} onPick={pickFood} />}
              {frequent.length > 0 && <HorizRow title="⭐ Most frequent" items={frequent} onPick={pickFood} />}
            </div>
          )}

          <ul className="mt-1">
            {results.map((food) => (
              <li key={food.id}>
                <button onClick={() => pickFood(food)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-xl text-left transition">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: CATEGORY_META[food.category].color + "22" }}>
                    {CATEGORY_META[food.category].emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-semibold truncate">{food.name}</div>
                      {food.isCustom && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">⭐ Custom</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{food.regional}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono-num text-sm font-semibold">{Math.round(food.calories)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      kcal/{food.servingUnit && food.servingUnit !== "g" ? `${food.servingSize ?? 1} ${food.servingUnit}` : "100g"}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <button onClick={onAddCustom}
            className="w-full mt-3 py-3 text-sm font-semibold text-primary flex items-center justify-center gap-1.5 hover:bg-primary/5 rounded-xl">
            <Sparkles className="w-4 h-4" /> Can't find it? Add custom food
          </button>
        </div>
      </div>

      {/* Selected food action panel — rendered as its own overlay so it's always reachable */}
      {selected && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" />
          <div
            className="relative w-full sm:max-w-sm bg-card rounded-t-[24px] sm:rounded-[24px] shadow-elevated animate-slide-up safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-2 mb-1 sm:hidden" />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 pr-2">
                  <div className="font-display italic text-lg leading-tight truncate">{selected.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{selected.regional}</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="flex-shrink-0 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  inputMode="decimal"
                  value={qty}
                  onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 px-3 py-2 rounded-xl bg-muted border-0 font-mono-num text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <span className="text-sm text-muted-foreground">{unitLabel}</span>
                <div className="ml-auto text-right">
                  <div className="font-mono-num text-2xl font-bold text-primary leading-none">
                    {Math.round(calcNutrition(selected, qty).calories)}
                  </div>
                  <div className="font-mono-num text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">kcal</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                {(["protein","carbs","fat","fibre"] as const).map((k) => {
                  const v = (calcNutrition(selected, qty) as any)[k] as number;
                  const emoji = { protein: "🥩", carbs: "🍞", fat: "🥑", fibre: "🌿" }[k];
                  return (
                    <div key={k} className="bg-muted rounded-lg py-1.5">
                      <div className="text-sm">{emoji}</div>
                      <div className="font-mono-num text-xs font-semibold">{v.toFixed(1)}g</div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleAdd}
                className="w-full py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-1.5 shadow-elevated active:scale-[0.98] transition"
              >
                <Plus className="w-4 h-4" /> Add to {MEAL_LABELS[meal]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Chip = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button onClick={onClick}
    className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition",
      active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
    {label}
  </button>
);

const HorizRow = ({ title, items, onPick }: { title: string; items: FoodItem[]; onPick: (f: FoodItem) => void }) => (
  <div>
    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">{title}</div>
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {items.map((f) => (
        <button key={f.id} onClick={() => onPick(f)}
          className="flex-shrink-0 px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 text-left min-w-[140px]">
          <div className="text-xs font-semibold truncate">{f.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">
            {Math.round(f.calories)} kcal/{f.servingUnit && f.servingUnit !== "g" ? `${f.servingSize ?? 1} ${f.servingUnit}` : "100g"}
          </div>
        </button>
      ))}
    </div>
  </div>
);
