import { ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export default function Settings() {
  const { settings, updateSettings, customFoods, removeCustomFood, logs } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);

  const exportCsv = () => {
    const header = "date,meal,food,regional,grams,calories,protein,carbs,fat,fibre\n";
    const rows = logs.map((l) => [
      l.date, l.mealType, `"${l.foodName}"`, `"${l.regionalName}"`,
      l.quantityGrams.toFixed(1), l.calories.toFixed(1), l.protein.toFixed(1),
      l.carbs.toFixed(1), l.fat.toFixed(1), l.fibre.toFixed(1),
    ].join(","));
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `thali-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV exported");
  };

  const clearAll = () => {
    if (!confirm("Delete all logs and custom foods?")) return;
    if (!confirm("This cannot be undone. Are you absolutely sure?")) return;
    localStorage.removeItem("thali-store-v1");
    location.reload();
  };

  return (
    <div className="max-w-md mx-auto pb-28 safe-top px-4 pt-4 space-y-4">
      <header className="flex items-center gap-2 mb-1">
        <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <Section title="Profile">
        <LabeledInput label="Name" value={settings.userName} onChange={(v) => updateSettings({ userName: v })} />
        <Slider label="Daily calorie goal" min={1200} max={4000} step={50} value={settings.calorieGoal} onChange={(v) => updateSettings({ calorieGoal: v })} suffix="kcal" />
        <Slider label="Protein goal" min={30} max={300} step={5} value={settings.proteinGoal} onChange={(v) => updateSettings({ proteinGoal: v })} suffix="g" />
        <Slider label="Carbs goal" min={50} max={500} step={5} value={settings.carbsGoal} onChange={(v) => updateSettings({ carbsGoal: v })} suffix="g" />
        <Slider label="Fat goal" min={20} max={200} step={5} value={settings.fatGoal} onChange={(v) => updateSettings({ fatGoal: v })} suffix="g" />
      </Section>

      <Section title="Preferences">
        <Toggle label="Dark mode" value={settings.darkMode} onChange={(v) => updateSettings({ darkMode: v })} />
      </Section>

      <Section title="My foods">
        {customFoods.length === 0 ? (
          <p className="text-sm text-muted-foreground">No custom foods yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {customFoods.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{Math.round(f.calories)} kcal/100g</div>
                </div>
                <button onClick={() => removeCustomFood(f.id)} className="p-1.5 rounded-full text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Data">
        <button onClick={exportCsv} className="w-full py-2.5 rounded-xl bg-muted font-semibold text-sm">Export log as CSV</button>
        <button onClick={clearAll} className="w-full py-2.5 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm">Clear all data</button>
      </Section>

      <p className="text-xs text-muted-foreground text-center px-4 pb-4">
        Nutrition data sourced from <strong>IFCT 2017</strong> — National Institute of Nutrition, Hyderabad.
        Values per 100g edible fresh-weight portion.
      </p>
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl bg-card shadow-card p-4 border border-border/50 space-y-3">
    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
    {children}
  </section>
);

const LabeledInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="block">
    <span className="text-xs text-muted-foreground">{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
  </label>
);

const Slider = ({ label, min, max, step, value, onChange, suffix }: any) => (
  <div>
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono-num text-sm font-semibold">{value} {suffix}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(+e.target.value)}
      className="w-full accent-primary mt-1" />
  </div>
);

const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between">
    <span className="text-sm">{label}</span>
    <span className={"w-10 h-6 rounded-full transition " + (value ? "bg-primary" : "bg-muted")}>
      <span className={"block w-5 h-5 rounded-full bg-card shadow mt-0.5 transition-transform " + (value ? "translate-x-[18px]" : "translate-x-0.5")} />
    </span>
  </button>
);
