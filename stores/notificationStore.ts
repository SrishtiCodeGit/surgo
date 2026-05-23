import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeKey } from '@/types';

const KEY = '@surgo_notifications';

export type NotifType = 'motivation' | 'streak' | 'task' | 'milestone' | 'tip';

export interface SurgoNotif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: number;   // ms since epoch
  isRead: boolean;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Generate contextual Surgo messages ──────────────────────────────────────

export function buildNotifications(opts: {
  streak: number;
  completedToday: number;
  totalToday: number;
  hasGoals: boolean;
  themeKey: ThemeKey;
}): Omit<SurgoNotif, 'id' | 'isRead'>[] {
  const { streak, completedToday, totalToday, hasGoals, themeKey } = opts;
  const now = Date.now();
  const notifs: Omit<SurgoNotif, 'id' | 'isRead'>[] = [];

  // Motivation (always)
  const motiv: Record<ThemeKey, [string, string]> = {
    soft:     ['Rise gently today 🌸', 'Small steps add up. You\'re already ahead just by showing up.'],
    balanced: ['Ready to win the day? ⚡', 'Focus on one task at a time. Momentum builds from small wins.'],
    hardcore: ['ZERO EXCUSES TODAY 🔥', 'The clock is ticking. Every hour you waste is ground your competition gains.'],
  };
  notifs.push({ type: 'motivation', title: motiv[themeKey][0], body: motiv[themeKey][1], timestamp: now });

  // Streak message
  if (streak >= 3) {
    notifs.push({
      type: 'streak',
      title: streak >= 7 ? `${streak}-day streak — you\'re on fire!` : `${streak} days in a row`,
      body: streak >= 7
        ? 'A week of consistency. That\'s not luck — that\'s character. Keep it alive.'
        : 'You\'re building a habit. Don\'t break the chain today.',
      timestamp: now - 60_000,
    });
  }

  // Task progress
  if (totalToday > 0) {
    const pct = Math.round((completedToday / totalToday) * 100);
    if (completedToday === totalToday) {
      notifs.push({
        type: 'task',
        title: 'All tasks done! 🎉',
        body: 'Incredible. You finished everything on your list. Don\'t forget to check in.',
        timestamp: now - 120_000,
      });
    } else if (pct >= 50) {
      notifs.push({
        type: 'task',
        title: `${pct}% done — almost there`,
        body: `${totalToday - completedToday} task${totalToday - completedToday > 1 ? 's' : ''} left. You\'re over halfway. Finish strong.`,
        timestamp: now - 180_000,
      });
    } else {
      notifs.push({
        type: 'task',
        title: `${totalToday} tasks waiting`,
        body: `You haven\'t started yet. Open your list and knock out the first task — it\'s the hardest step.`,
        timestamp: now - 240_000,
      });
    }
  }

  // No goals nudge
  if (!hasGoals) {
    notifs.push({
      type: 'tip',
      title: 'Set your first goal',
      body: 'Surgo works best when you have a goal. Tap Goals → Add Goal and let AI build your plan.',
      timestamp: now - 300_000,
    });
  }

  // Daily tip
  const tips: [string, string][] = [
    ['Track progress every day', 'People who review their goals daily are 40% more likely to achieve them.'],
    ['Use the Nightly Review', 'End-of-day reflection helps Surgo adapt your next day automatically.'],
    ['Streaks drive habits', 'Research shows 21 days of consistency rewires your brain. Trust the process.'],
    ['Freeze cards are a safety net', 'Use a freeze if life gets hectic — your streak is too valuable to lose.'],
  ];
  const tip = tips[new Date().getDay() % tips.length];
  notifs.push({ type: 'tip', title: tip[0], body: tip[1], timestamp: now - 600_000 });

  return notifs;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface NotifStore {
  notifs: SurgoNotif[];
  isLoaded: boolean;
  load: () => Promise<void>;
  generate: (opts: Parameters<typeof buildNotifications>[0]) => Promise<void>;
  markAllRead: () => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotifStore>((set, get) => ({
  notifs: [],
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const saved: SurgoNotif[] = raw ? JSON.parse(raw) : [];
      set({ notifs: saved, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  generate: async (opts) => {
    // Generate fresh notifications — replace stale ones older than 24h
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const existing = get().notifs.filter((n) => n.timestamp > cutoff && n.isRead);
    const fresh = buildNotifications(opts).map((n) => ({ ...n, id: uid(), isRead: false }));
    const merged = [...fresh, ...existing].slice(0, 20);
    set({ notifs: merged });
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  },

  markAllRead: async () => {
    const updated = get().notifs.map((n) => ({ ...n, isRead: true }));
    set({ notifs: updated });
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  },

  unreadCount: () => get().notifs.filter((n) => !n.isRead).length,
}));
