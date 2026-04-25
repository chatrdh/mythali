import { useState } from "react";
import { X } from "lucide-react";
import { FoodCategory, CATEGORY_META } from "@/data/ifct";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; }

type ServingUnit = "g" | "piece" | "bowl" | "cup" | "serving" | "slice" | "tbsp";

const UNIT_OPTIONS: { value: ServingUnit; label: string }[] = [
  { value: "piece",   label: "piece" },
  { value: "bowl",    label: "bowl" },
  { value: "cup",     label: "cup" },
  { value: "serving", label: "serving" },
  { value: "slice",   label: "slice" },
  { value: "tbsp",    label: "tbsp" },
];

export const CustomFoodSheet = ({ open, onClose }: Props) => {
  const addCustomFood = useStore((s) => s.addCustomFood);
  const [name, setName] = useState("");
  const [regional, setRegional] = useState("");
  const [unitMode, setUnitMode] = useState<"g" | "other">("g");
  const [otherUnit, setOtherUnit] = useState<ServingUnit>("piece");
  const [serving, setServing] = useState(100); // grams when unitMode='g', else count of unit
  const [cal, setCal] = useState(0);
  const [p, setP] = useState(0);
  const [c, setC] = useState(0);
  const [fat, setFat] = useState(0);
  const [fi, setFi] = useState(0);
  const [cat, setCat] = useState<FoodCategory>("Other");

  if (!open) return null;

  const reset = () => {
    setName(""); setRegional(""); setUnitMode("g"); setOtherUnit("piece");
    setServing(100); setCal(0); setP(0); setC(0); setFat(0); setFi(0); setCat("Other");
  };

  const save = () => {
    if (!name.trim() || !serving || !cal) {
      toast.error("Please fill name, serving size, and calories.");
      return;
    }
    // For grams: normalize to per-100g basis (existing behavior).
    // For non-gram units: store macros as entered (totals for `serving` units) and tag with servingUnit/servingSize.
    const isGram = unitMode === "g";
    const factor = isGram ? 100 / serving : 1;
    const displayName = isGram
      ? name.trim()
      : `${name.trim()} (per 1 ${otherUnit})`;

    addCustomFood({
      id: `C-${Date.now()}`, code: `C${Date.now()}`,
      name: displayName, regional: regional.trim() || name.trim(),
      scientific: "", category: cat,
      moisture: 0, protein: p * factor, fat: fat * factor, fibre: fi * factor,
      carbs: c * factor, energyKj: cal * 4.184 * factor, calories: cal * factor,
      isCustom: true,
      servingUnit: isGram ? "g" : otherUnit,
      servingSize: isGram ? 100 : serving,
    });
    toast.success("Custom food saved");
    onClose();
    reset();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div className="relative bg-card rounded-t-[28px] h-[90vh] flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-2 mb-3" />
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="text-lg font-bold">Add custom food</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
          <Field label="Food name *"><input value={name} onChange={(e) => setName(e.target.value)} className={input} /></Field>
          <Field label="Regional / local name"><input value={regional} onChange={(e) => setRegional(e.target.value)} className={input} /></Field>

          {/* Serving unit toggle */}
          <div>
            <span className="text-xs font-semibold text-muted-foreground mb-1 block">Serving measured in</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => setUnitMode("g")}
                className={`py-2 rounded-lg text-sm font-semibold transition ${unitMode === "g" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                Grams
              </button>
              <button
                type="button"
                onClick={() => setUnitMode("other")}
                className={`py-2 rounded-lg text-sm font-semibold transition ${unitMode === "other" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                Other unit
              </button>
            </div>
          </div>

          {unitMode === "g" ? (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Serving (g) *"><input type="number" value={serving} onChange={(e) => setServing(+e.target.value)} className={input} /></Field>
              <Field label="Calories (kcal) *"><input type="number" value={cal} onChange={(e) => setCal(+e.target.value)} className={input} /></Field>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Quantity *">
                  <input type="number" min={1} value={serving} onChange={(e) => setServing(+e.target.value)} className={input} />
                </Field>
                <Field label="Unit *">
                  <select value={otherUnit} onChange={(e) => setOtherUnit(e.target.value as ServingUnit)} className={input}>
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Calories (kcal) *">
                <input type="number" value={cal} onChange={(e) => setCal(+e.target.value)} className={input} />
              </Field>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Macros below should be the totals for {serving} {otherUnit}{serving > 1 ? "s" : ""}.
              </p>
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Field label="Protein (g)"><input type="number" value={p} onChange={(e) => setP(+e.target.value)} className={input} /></Field>
            <Field label="Carbs (g)"><input type="number" value={c} onChange={(e) => setC(+e.target.value)} className={input} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Fat (g)"><input type="number" value={fat} onChange={(e) => setFat(+e.target.value)} className={input} /></Field>
            <Field label="Fibre (g)"><input type="number" value={fi} onChange={(e) => setFi(+e.target.value)} className={input} /></Field>
          </div>
          <Field label="Category">
            <select value={cat} onChange={(e) => setCat(e.target.value as FoodCategory)} className={input}>
              {(Object.keys(CATEGORY_META) as FoodCategory[]).map((k) => (
                <option key={k} value={k}>{CATEGORY_META[k].emoji} {CATEGORY_META[k].label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-border safe-bottom">
          <button onClick={save} className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-elevated active:scale-[0.98]">
            Save food
          </button>
        </div>
      </div>
    </div>
  );
};

const input = "w-full px-3 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</span>
    {children}
  </label>
);
