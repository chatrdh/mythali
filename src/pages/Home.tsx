import { useMemo, useState } from "react";
import { Settings, Plus, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroPillRow } from "@/components/MacroPillRow";
import { MealSectionCard } from "@/components/MealSectionCard";
import { SearchSheet } from "@/components/SearchSheet";
import { CustomFoodSheet } from "@/components/CustomFoodSheet";
import { MealType, mealForTime, todayStr, useStore } from "@/store/useStore";
import { format } from "date-fns";

const MEALS: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"];

export default function Home() {
  const { logs, settings, updateSettings } = useStore();
  const [sheet, setSheet] = useState<{ open: boolean; meal: MealType }>({ open: false, meal: mealForTime() });
  const [customOpen, setCustomOpen] = useState(false);

  const today = todayStr();
  const todayLogs = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);

  const totals = useMemo(() => todayLogs.reduce(
    (a, l) => ({
      calories: a.calories + l.calories,
      protein: a.protein + l.protein,
      carbs: a.carbs + l.carbs,
      fat: a.fat + l.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ), [todayLogs]);

  const greeting = settings.userName ? `Namaste, ${settings.userName} 👋` : "Namaste 👋";

  return (
    <div className="max-w-md mx-auto pb-28 safe-top">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h1 className="text-lg font-bold">{greeting}</h1>
          <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, d MMMM")}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className="p-2 rounded-full hover:bg-muted transition"
            aria-label="Toggle dark mode"
          >
            {settings.darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <Link to="/settings" className="p-2 rounded-full hover:bg-muted transition" aria-label="Settings">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <section className="flex justify-center py-3">
        <CalorieRing consumed={totals.calories} goal={settings.calorieGoal} size={260} />
      </section>

      <section className="px-4 mt-2">
        <MacroPillRow macros={[
          { label: "Protein", emoji: "🥩", value: totals.protein, goal: settings.proteinGoal, color: "hsl(var(--primary))" },
          { label: "Carbs",   emoji: "🍞", value: totals.carbs,   goal: settings.carbsGoal,   color: "hsl(var(--accent))" },
          { label: "Fat",     emoji: "🥑", value: totals.fat,     goal: settings.fatGoal,     color: "hsl(var(--secondary))" },
        ]} />
      </section>

      <section className="px-4 mt-5 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Meals</h2>
        {MEALS.map((m) => (
          <MealSectionCard key={m} meal={m}
            logs={todayLogs.filter((l) => l.mealType === m)}
            onAdd={(meal) => setSheet({ open: true, meal })} />
        ))}
      </section>

      <button
        onClick={() => { setSheet({ open: true, meal: mealForTime() }); if (navigator.vibrate) navigator.vibrate(10); }}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-elevated flex items-center justify-center animate-pulse-glow active:scale-95 transition"
        aria-label="Log food">
        <Plus className="w-6 h-6" />
      </button>

      <SearchSheet open={sheet.open} defaultMeal={sheet.meal}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        onAddCustom={() => { setSheet((s) => ({ ...s, open: false })); setCustomOpen(true); }} />
      <CustomFoodSheet open={customOpen} onClose={() => setCustomOpen(false)} />
    </div>
  );
}
