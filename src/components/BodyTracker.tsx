import { useMemo, useState } from "react";
import { Plus, Trash2, Weight, Ruler, TrendingDown, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useStore, todayStr, type BodyMeasurement } from "@/store/useStore";
import { toast } from "sonner";

const FIELDS: { key: keyof Pick<BodyMeasurement, "weight" | "waist" | "hips" | "chest">; label: string; unit: string; icon: string; min: number; max: number; step: number }[] = [
  { key: "weight", label: "Weight", unit: "kg", icon: "⚖️", min: 20, max: 250, step: 0.1 },
  { key: "waist",  label: "Waist",  unit: "cm", icon: "📏", min: 40, max: 200, step: 0.5 },
  { key: "hips",   label: "Hips",   unit: "cm", icon: "📐", min: 40, max: 200, step: 0.5 },
  { key: "chest",  label: "Chest",  unit: "cm", icon: "📐", min: 50, max: 200, step: 0.5 },
];

export function BodyTracker() {
  const { measurements, addMeasurement, removeMeasurement } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const sorted = useMemo(
    () => [...measurements].sort((a, b) => b.loggedAt - a.loggedAt),
    [measurements]
  );

  const latest = sorted[0];
  const previous = sorted[1];

  const save = () => {
    const weight = form.weight ? parseFloat(form.weight) : undefined;
    const waist = form.waist ? parseFloat(form.waist) : undefined;
    const hips = form.hips ? parseFloat(form.hips) : undefined;
    const chest = form.chest ? parseFloat(form.chest) : undefined;

    if (!weight && !waist && !hips && !chest) {
      toast.error("Enter at least one measurement");
      return;
    }

    addMeasurement({ date: todayStr(), weight, waist, hips, chest });
    setForm({});
    setOpen(false);
    toast.success("Measurement logged");
  };

  const diff = (key: string) => {
    if (!latest || !previous) return null;
    const a = (latest as any)[key] as number | undefined;
    const b = (previous as any)[key] as number | undefined;
    if (!a || !b) return null;
    const d = a - b;
    if (Math.abs(d) < 0.05) return null;
    return d;
  };

  return (
    <div className="rounded-2xl bg-card shadow-card p-4 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono-num text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Body measurements
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Log
        </button>
      </div>

      {/* Log form */}
      {open && (
        <div className="mb-4 space-y-2.5 animate-fade-in">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex items-center gap-2">
              <span className="text-sm w-5">{f.icon}</span>
              <span className="text-xs text-muted-foreground w-12">{f.label}</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="—"
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                className="flex-1 px-2.5 py-2 rounded-lg bg-muted border-0 font-mono-num text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                min={f.min}
                max={f.max}
                step={f.step}
              />
              <span className="text-[10px] text-muted-foreground w-6">{f.unit}</span>
            </div>
          ))}
          <button
            onClick={save}
            className="w-full py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
          >
            Save
          </button>
        </div>
      )}

      {/* Current stats */}
      {latest ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map((f) => {
              const val = (latest as any)[f.key] as number | undefined;
              if (!val) return null;
              const d = diff(f.key);
              return (
                <div key={f.key} className="bg-muted/40 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">{f.icon}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{f.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono-num text-lg font-bold">{val}</span>
                    <span className="text-[10px] text-muted-foreground">{f.unit}</span>
                    {d && (
                      <span className={`flex items-center gap-0.5 text-[10px] font-mono-num ml-auto ${d < 0 ? "text-success" : "text-destructive"}`}>
                        {d > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {d > 0 ? "+" : ""}{d.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* History */}
          {sorted.length > 1 && (
            <div className="mt-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Recent</div>
              <ul className="space-y-1">
                {sorted.slice(0, 5).map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-muted/30 group">
                    <span className="text-muted-foreground font-mono-num">
                      {format(parseISO(m.date), "d MMM")}
                    </span>
                    <div className="flex items-center gap-3 font-mono-num">
                      {m.weight && <span>{m.weight} kg</span>}
                      {m.waist && <span>{m.waist} cm</span>}
                      {m.hips && <span>{m.hips} cm</span>}
                      {m.chest && <span>{m.chest} cm</span>}
                    </div>
                    <button
                      onClick={() => removeMeasurement(m.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-destructive/60 hover:text-destructive transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-[10px] text-muted-foreground text-center mt-2">
            Last logged {format(parseISO(latest.date), "d MMM yyyy")}
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground">
          <div className="text-2xl mb-2">⚖️</div>
          Tap <span className="text-primary font-medium">+ Log</span> to record your first measurement
        </div>
      )}
    </div>
  );
}
