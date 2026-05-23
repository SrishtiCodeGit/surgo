import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Facts Surgo has learned about the user across all conversations.
// e.g. { age: "24", weight: "68kg", height: "165cm", fitness_level: "beginner" }

interface SurgoMemoryStore {
  facts: Record<string, string>;
  learnFacts:   (newFacts: Record<string, string>) => void;
  getFactsText: () => string;   // formatted for the system prompt
  clearMemory:  () => void;
}

export const useSurgoMemoryStore = create<SurgoMemoryStore>()(
  persist(
    (set, get) => ({
      facts: {},

      learnFacts: (newFacts) =>
        set(state => ({ facts: { ...state.facts, ...newFacts } })),

      getFactsText: () => {
        const { facts } = get();
        const entries = Object.entries(facts);
        if (entries.length === 0) return '';
        return entries
          .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
          .join('\n');
      },

      clearMemory: () => set({ facts: {} }),
    }),
    {
      name:    '@surgo_memory',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
