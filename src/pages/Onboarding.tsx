import { useState } from "react";
import { useStore } from "@/store/useStore";

export default function Onboarding() {
  const { settings, updateSettings } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.userName);
  const [goal, setGoal] = useState(settings.calorieGoal);

  const finish = () => updateSettings({ userName: name.trim(), calorieGoal: goal, onboardingDone: true });

  return (
    <div className="min-h-screen flex flex-col safe-top px-6 pb-6 bg-background">
      <div className="flex gap-1.5 pt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={"h-1 flex-1 rounded-full " + (i <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {step === 0 && (
          <div className="text-center animate-fade-in">
            <img src="./icon-192.png" alt="Thali" className="w-24 h-24 rounded-[22px] mx-auto mb-6 shadow-elevated" />
          </div>
        )}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <h1 className="text-2xl font-bold">What should we call you?</h1>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              className="w-full px-4 py-3.5 rounded-2xl bg-muted border-0 text-base focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Daily calorie goal</span>
                <span className="font-mono-num text-lg font-bold">{goal} kcal</span>
              </div>
              <input type="range" min={1200} max={4000} step={50} value={goal}
                onChange={(e) => setGoal(+e.target.value)} className="w-full accent-primary" />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-6">✨</div>
            <h1 className="text-2xl font-bold mb-2">You're all set{name ? `, ${name}` : ""}!</h1>
            <p className="text-muted-foreground">Your food library is ready. 100+ Indian foods loaded from IFCT 2017.</p>
          </div>
        )}
      </div>

      <button
        onClick={() => (step < 2 ? setStep(step + 1) : finish())}
        className="w-full py-4 rounded-2xl bg-gradient-primary text-primary-foreground font-semibold shadow-elevated active:scale-[0.98]">
        {step === 0 ? "Get started" : step === 1 ? "Continue" : "Enter app"}
      </button>
    </div>
  );
}
