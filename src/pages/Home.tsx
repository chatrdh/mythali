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

  const greeting = settings.userName
    ? <>Namaste, <span className="font-semibold not-italic text-primary">{settings.userName}</span></>
    : <>Namaste</>;

  return (
    <div className="max-w-md mx-auto pb-28 safe-top animate-fade-in">
      <header className="flex items-end justify-between px-5 pt-8 pb-4">
        <div>
          <h1 className="font-display italic text-2xl leading-tight text-foreground">{greeting}</h1>
          <p className="font-mono-num text-[10px] tracking-[0.18em] uppercase text-muted-foreground mt-1.5">
            {format(new Date(), "EEEE · d MMMM")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className="p-2 rounded-full hover:bg-muted transition text-muted-foreground hover:text-primary"
            aria-label="Toggle dark mode"
          >
            {settings.darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <Link to="/settings" className="p-2 rounded-full hover:bg-muted transition text-muted-foreground hover:text-primary" aria-label="Settings">
            <Settings className="w-[18px] h-[18px]" />
          </Link>
        </div>
      </header>

      <section className="flex justify-center py-2">
        <CalorieRing consumed={totals.calories} goal={settings.calorieGoal} size={260} />
      </section>

      <section className="px-5 mt-3">
        <MacroPillRow macros={[
          { label: "Protein", emoji: "🥩", value: totals.protein, goal: settings.proteinGoal, color: "hsl(var(--primary))" },
          { label: "Carbs",   emoji: "🍞", value: totals.carbs,   goal: settings.carbsGoal,   color: "hsl(var(--accent))" },
          { label: "Fat",     emoji: "🥑", value: totals.fat,     goal: settings.fatGoal,     color: "hsl(var(--secondary))" },
        ]} />
      </section>

      <section className="px-5 mt-7 space-y-2.5">
        <h2 className="font-mono-num text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-1">Meals</h2>
        {MEALS.map((m) => (
          <MealSectionCard key={m} meal={m}
            logs={todayLogs.filter((l) => l.mealType === m)}
            onAdd={(meal) => setSheet({ open: true, meal })} />
        ))}
      </section>

      <button
        onClick={() => { setSheet({ open: true, meal: mealForTime() }); if (navigator.vibrate) navigator.vibrate(10); }}
        className="fixed bottom-[88px] right-5 z-30 w-[54px] h-[54px] rounded-full bg-primary text-primary-foreground shadow-glow flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Log food">
        <Plus className="w-5 h-5" strokeWidth={2.25} />
      </button>

      <SearchSheet open={sheet.open} defaultMeal={sheet.meal}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        onAddCustom={() => { setSheet((s) => ({ ...s, open: false })); setCustomOpen(true); }} />
      <CustomFoodSheet open={customOpen} onClose={() => setCustomOpen(false)} />
    </div>
  );
}
