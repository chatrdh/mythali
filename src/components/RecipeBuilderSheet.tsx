import { useState, useMemo, useRef } from "react";
import { Search, X, Plus, Minus, ChefHat } from "lucide-react";
import { IFCT_FOODS, CATEGORY_META, FoodCategory, FoodItem } from "@/data/ifct";
import { calcNutrition, useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Ingredient {
  food: FoodItem;
  qty: number; // always in grams (for gram-based) or units (for unit-based)
}

export const RecipeBuilderSheet = ({ open, onClose }: Props) => {
  const { customFoods, addCustomFood } = useStore();
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allFoods = useMemo(() => {
    const custom = customFoods.filter((f) => !f.ingredients); // exclude other recipes from ingredients
    return [...IFCT_FOODS, ...custom];
  }, [customFoods]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allFoods.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return allFoods
      .filter((f) => f.name.toLowerCase().includes(q) || f.regional.toLowerCase().includes(q))
      .slice(0, 20);
  }, [searchQuery, allFoods]);

  // Calculate totals from ingredients
  const totals = useMemo(() => {
    let totalWeight = 0;
    let totalCal = 0, totalP = 0, totalC = 0, totalF = 0, totalFi = 0;

    for (const ing of ingredients) {
      const n = calcNutrition(ing.food, ing.qty);
      // Weight in grams: for gram-based foods, qty IS grams; for unit-based, approximate from serving
      const weightG = ing.food.servingUnit && ing.food.servingUnit !== "g"
        ? ing.qty * ((ing.food.servingSize || 1) * 30) // rough weight estimate for unit-based
        : ing.qty;
      totalWeight += weightG;
      totalCal += n.calories;
      totalP += n.protein;
      totalC += n.carbs;
      totalF += n.fat;
      totalFi += n.fibre;
    }

    // Normalize to per 100g
    const k = totalWeight > 0 ? 100 / totalWeight : 0;
    return {
      totalWeight,
      totalCal, totalP, totalC, totalF, totalFi,
      per100: {
        calories: totalCal * k,
        protein: totalP * k,
        carbs: totalC * k,
        fat: totalF * k,
        fibre: totalFi * k,
      },
    };
  }, [ingredients]);

  const addIngredient = (food: FoodItem) => {
    // Default qty: 100g for gram-based, 1 for unit-based
    const defaultQty = food.servingUnit && food.servingUnit !== "g" ? 1 : 100;
    setIngredients((prev) => [...prev, { food, qty: defaultQty }]);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const updateQty = (index: number, qty: number) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, qty: Math.max(0, qty) } : ing)));
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const save = () => {
    if (!name.trim()) { toast.error("Recipe name is required"); return; }
    if (ingredients.length < 2) { toast.error("Add at least 2 ingredients"); return; }
    if (totals.totalWeight <= 0) { toast.error("Total quantity must be > 0"); return; }

    const recipe: FoodItem = {
      id: crypto.randomUUID(),
      code: `RECIPE-${Date.now()}`,
      name: name.trim(),
      regional: `${ingredients.length} ingredients · ${Math.round(totals.totalWeight)}g`,
      scientific: "",
      category: "Homemade",
      moisture: 0,
      protein: totals.per100.protein,
      fat: totals.per100.fat,
      fibre: totals.per100.fibre,
      carbs: totals.per100.carbs,
      energyKj: totals.per100.calories * 4.184,
      calories: totals.per100.calories,
      isCustom: true,
      ingredients: ingredients.map((ing) => ({
        foodId: ing.food.id,
        foodName: ing.food.name,
        qty: ing.qty,
      })),
    };

    addCustomFood(recipe);
    toast.success("Recipe saved!", { description: `${Math.round(totals.per100.calories)} kcal/100g` });
    setName("");
    setIngredients([]);
    setSearchQuery("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-t-[28px] flex flex-col animate-slide-up shadow-elevated"
        style={{ height: "calc(100% - 16px)", maxHeight: "calc(100% - 16px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-2 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Create recipe</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0 space-y-4">
          {/* Recipe name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recipe name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dal Chawal, Poha…"
              className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Add ingredients */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Ingredients ({ingredients.length})
            </label>

            {/* Ingredient list */}
            {ingredients.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {ingredients.map((ing, i) => {
                  const n = calcNutrition(ing.food, ing.qty);
                  const unitLabel = ing.food.servingUnit && ing.food.servingUnit !== "g"
                    ? ing.food.servingUnit
                    : "g";
                  return (
                    <div key={i} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{ing.food.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {Math.round(n.calories)} kcal
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(i, ing.qty - (unitLabel === "g" ? 10 : 1))}
                          className="w-7 h-7 rounded-lg bg-background flex items-center justify-center active:scale-95"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={ing.qty}
                          onChange={(e) => updateQty(i, Number(e.target.value) || 0)}
                          className="w-14 px-1 py-1 rounded-lg bg-background border-0 font-mono-num text-xs text-center focus:outline-none"
                        />
                        <span className="text-[10px] text-muted-foreground w-5">{unitLabel}</span>
                        <button
                          onClick={() => updateQty(i, ing.qty + (unitLabel === "g" ? 10 : 1))}
                          className="w-7 h-7 rounded-lg bg-background flex items-center justify-center active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeIngredient(i)}
                        className="p-1 rounded-lg hover:bg-destructive/20 text-destructive/70"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Search for ingredients */}
            {searchOpen ? (
              <div className="mt-2 bg-muted rounded-xl overflow-hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search foods to add…"
                    autoFocus
                    className="w-full pl-9 pr-9 py-2.5 bg-transparent border-0 text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-background"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ul className="max-h-48 overflow-y-auto">
                  {searchResults.map((food) => (
                    <li key={food.id}>
                      <button
                        onClick={() => addIngredient(food)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-background/50 text-left transition"
                      >
                        <span className="text-sm">{CATEGORY_META[food.category].emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{food.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{food.regional}</div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono-num">
                          {Math.round(food.calories)} kcal
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full mt-2 py-2.5 rounded-xl border-2 border-dashed border-muted-foreground/20 text-sm text-muted-foreground flex items-center justify-center gap-1.5 hover:border-primary/30 hover:text-primary transition"
              >
                <Plus className="w-4 h-4" /> Add ingredient
              </button>
            )}
          </div>

          {/* Totals */}
          {ingredients.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recipe totals</span>
                <span className="font-mono-num text-xs text-muted-foreground">{Math.round(totals.totalWeight)}g total</span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-mono-num text-3xl font-bold text-primary">{Math.round(totals.totalCal)}</span>
                <span className="text-xs text-muted-foreground">kcal total</span>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Per 100g</span>
                <span className="font-mono-num text-sm font-semibold text-primary">{Math.round(totals.per100.calories)} kcal</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                {([
                  { key: "protein", emoji: "🥩", val: totals.per100.protein },
                  { key: "carbs", emoji: "🍞", val: totals.per100.carbs },
                  { key: "fat", emoji: "🥑", val: totals.per100.fat },
                  { key: "fibre", emoji: "🌿", val: totals.per100.fibre },
                ] as const).map((m) => (
                  <div key={m.key} className="bg-background rounded-lg py-1.5">
                    <div className="text-sm">{m.emoji}</div>
                    <div className="font-mono-num text-[11px] font-semibold">{m.val.toFixed(1)}g</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button — inline with content */}
          {ingredients.length > 0 && (
            <button
              onClick={save}
              disabled={!name.trim() || ingredients.length < 2}
              className="w-full py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-1.5 shadow-elevated active:scale-[0.98] transition disabled:opacity-40"
            >
              <ChefHat className="w-4 h-4" /> Save recipe
            </button>
          )}

          {/* Bottom spacing for nav bar */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
};
