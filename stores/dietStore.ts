import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toDateString } from '@/lib/streak';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealEntry {
  id:       string;
  date:     string;      // YYYY-MM-DD
  mealType: MealType;
  name:     string;
  calories: number;
  protein:  number;      // grams
  carbs:    number;
  fat:      number;
}

export interface MealSuggestion {
  name:        string;
  description: string;
  calories:    number;
  protein:     number;
  carbs:       number;
  fat:         number;
}

export interface DietPlanCache {
  date:          string;
  calorieTarget: number;
  breakfast:     MealSuggestion;
  lunch:         MealSuggestion;
  dinner:        MealSuggestion;
  snack:         MealSuggestion;
  tip:           string;
}

interface DietStore {
  entries:   MealEntry[];
  planCache: DietPlanCache | null;
  isLoaded:  boolean;

  load:         () => Promise<void>;
  addEntry:     (entry: Omit<MealEntry, 'id'>) => void;
  removeEntry:  (id: string) => void;
  setDietPlan:  (plan: DietPlanCache) => void;

  getTodaysEntries: () => MealEntry[];
  getTodaysTotals:  () => { calories: number; protein: number; carbs: number; fat: number };
  getTodayByMeal:   (meal: MealType) => MealEntry[];
}

export const useDietStore = create<DietStore>()(
  persist(
    (set, get) => ({
      entries:   [],
      planCache: null,
      isLoaded:  false,

      load: async () => set({ isLoaded: true }),

      addEntry: (entry) => {
        const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
        set(s => ({ entries: [...s.entries, { ...entry, id }] }));
      },

      removeEntry: (id) =>
        set(s => ({ entries: s.entries.filter(e => e.id !== id) })),

      setDietPlan: (plan) => set({ planCache: plan }),

      getTodaysEntries: () => {
        const today = toDateString(new Date());
        return get().entries.filter(e => e.date === today);
      },

      getTodaysTotals: () => {
        const today = toDateString(new Date());
        const todayEntries = get().entries.filter(e => e.date === today);
        return todayEntries.reduce(
          (acc, e) => ({
            calories: acc.calories + e.calories,
            protein:  acc.protein  + e.protein,
            carbs:    acc.carbs    + e.carbs,
            fat:      acc.fat      + e.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
      },

      getTodayByMeal: (meal) => {
        const today = toDateString(new Date());
        return get().entries.filter(e => e.date === today && e.mealType === meal);
      },
    }),
    {
      name:    '@surgo_diet',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
