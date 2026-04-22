import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FoodItem, FoodCategory } from "@/data/ifct";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";

export interface FoodLog {
  id: string;
  foodId: string;
  foodName: string;
  regionalName: string;
  category: FoodCategory;
  mealType: MealType;
  date: string;          // YYYY-MM-DD
  quantityGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  loggedAt: number;
}

export interface Settings {
  userName: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  darkMode: boolean;
  onboardingDone: boolean;
}

interface Store {
  logs: FoodLog[];
  customFoods: FoodItem[];
  settings: Settings;
  addLog: (log: Omit<FoodLog, "id" | "loggedAt">) => void;
  removeLog: (id: string) => void;
  updateLogQty: (id: string, qty: number) => void;
  addCustomFood: (f: FoodItem) => void;
  removeCustomFood: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
}

const DEFAULT_SETTINGS: Settings = {
  userName: "",
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
  darkMode: false,
  onboardingDone: false,
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      logs: [],
      customFoods: [],
      settings: DEFAULT_SETTINGS,
      addLog: (log) =>
        set((s) => ({
          logs: [
            ...s.logs,
            { ...log, id: crypto.randomUUID(), loggedAt: Date.now() },
          ],
        })),
      removeLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
      updateLogQty: (id, qty) =>
        set((s) => ({
          logs: s.logs.map((l) => {
            if (l.id !== id) return l;
            const factor = qty / l.quantityGrams;
            return {
              ...l,
              quantityGrams: qty,
              calories: l.calories * factor,
              protein: l.protein * factor,
              carbs: l.carbs * factor,
              fat: l.fat * factor,
              fibre: l.fibre * factor,
            };
          }),
        })),
      addCustomFood: (food) =>
        set((s) => ({ customFoods: [...s.customFoods, { ...food, isCustom: true }] })),
      removeCustomFood: (id) =>
        set((s) => ({ customFoods: s.customFoods.filter((f) => f.id !== id) })),
      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
    }),
    { name: "thali-store-v1" }
  )
);

// Helpers
export const todayStr = () => new Date().toISOString().slice(0, 10);

export const mealForTime = (d = new Date()): MealType => {
  const h = d.getHours();
  if (h < 11) return "BREAKFAST";
  if (h < 15) return "LUNCH";
  if (h >= 18) return "DINNER";
  return "SNACKS";
};

export const calcNutrition = (food: FoodItem, qty: number) => {
  const k = qty / 100;
  return {
    calories: food.calories * k,
    protein: food.protein * k,
    carbs: food.carbs * k,
    fat: food.fat * k,
    fibre: food.fibre * k,
  };
};
