import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Streak,
  StreakState,
} from '@/types';
import {
  createDefaultStreak,
  recordCheckIn,
  useFreezeCard,
  grantFreezeCard,
  calculateCurrentStreak,
  getStreakState,
  getStreakStats,
  checkStreakMilestone,
} from '@/lib/streak';

const STREAK_STORAGE_KEY = '@velo_streak';

interface StreakStore {
  streak: Streak | null;
  isLoaded: boolean;

  // Actions
  loadStreak: (userId: string) => Promise<void>;
  checkIn: (tasksCompleted: number, tasksTotal: number) => Promise<{ milestone: number | null }>;
  useFreeze: () => Promise<boolean>;
  grantFreeze: () => Promise<void>;
  resetStreak: (userId: string) => Promise<void>;

  // Computed
  streakState: () => StreakState | null;
  stats: () => ReturnType<typeof getStreakStats> | null;
}

export const useStreakStore = create<StreakStore>((set, get) => ({
  streak: null,
  isLoaded: false,

  loadStreak: async (userId: string) => {
    try {
      const raw = await AsyncStorage.getItem(`${STREAK_STORAGE_KEY}_${userId}`);
      if (raw) {
        const parsed: Streak = JSON.parse(raw);
        set({ streak: parsed, isLoaded: true });
      } else {
        // First time — create default
        const defaultStreak = createDefaultStreak(userId);
        await AsyncStorage.setItem(
          `${STREAK_STORAGE_KEY}_${userId}`,
          JSON.stringify(defaultStreak),
        );
        set({ streak: defaultStreak, isLoaded: true });
      }
    } catch {
      const defaultStreak = createDefaultStreak(userId);
      set({ streak: defaultStreak, isLoaded: true });
    }
  },

  checkIn: async (tasksCompleted: number, tasksTotal: number) => {
    const { streak } = get();
    if (!streak) return { milestone: null };

    const prevStreak = streak.currentStreak;
    const updated = recordCheckIn(streak, tasksCompleted, tasksTotal);
    const milestone = checkStreakMilestone(prevStreak, updated.currentStreak);

    await AsyncStorage.setItem(
      `${STREAK_STORAGE_KEY}_${streak.userId}`,
      JSON.stringify(updated),
    );
    set({ streak: updated });

    return { milestone };
  },

  useFreeze: async () => {
    const { streak } = get();
    if (!streak) return false;

    const updated = useFreezeCard(streak);
    if (!updated) return false; // No cards available

    await AsyncStorage.setItem(
      `${STREAK_STORAGE_KEY}_${streak.userId}`,
      JSON.stringify(updated),
    );
    set({ streak: updated });
    return true;
  },

  grantFreeze: async () => {
    const { streak } = get();
    if (!streak) return;

    const updated = grantFreezeCard(streak);
    await AsyncStorage.setItem(
      `${STREAK_STORAGE_KEY}_${streak.userId}`,
      JSON.stringify(updated),
    );
    set({ streak: updated });
  },

  resetStreak: async (userId: string) => {
    const defaultStreak = createDefaultStreak(userId);
    await AsyncStorage.setItem(
      `${STREAK_STORAGE_KEY}_${userId}`,
      JSON.stringify(defaultStreak),
    );
    set({ streak: defaultStreak });
  },

  streakState: () => {
    const { streak } = get();
    if (!streak) return null;
    return getStreakState(streak);
  },

  stats: () => {
    const { streak } = get();
    if (!streak) return null;
    return getStreakStats(streak);
  },
}));
