import { Theme, ThemeKey } from '@/types';

// ─── Soft Theme ───────────────────────────────────────────────────────────────
// Warm, gentle, encouraging. Pastel palette. You're doing amazing.

const softTheme: Theme = {
  key: 'soft',
  name: 'Soft',
  tagline: 'Gentle progress, every day',
  colors: {
    background: '#faf7f2',
    surface: '#ffffff',
    surfaceAlt: '#f0ebe3',
    primary: '#8b9e7a',        // sage green
    primaryLight: '#d4e3c9',
    accent: '#e8a598',         // blush
    text: '#3d3530',
    textMuted: '#9e8f85',
    textInverse: '#ffffff',
    border: '#e8e0d8',
    success: '#7fb97a',
    warning: '#e8c07a',
    danger: '#e8957a',
    streakFire: '#e8a598',
  },
  tone: {
    greeting: 'Good morning',
    taskMotivation: 'Take it one step at a time 🌿',
    streakCongrats: 'Look at you showing up! That\'s beautiful. 🌸',
    streakWarning: 'Hey, your goal is still waiting for you — no pressure, just a reminder 💛',
    streakBroken: 'That\'s okay. Every day is a fresh start. Let\'s go again 🌱',
    freezeUsed: 'Rest day saved ❄️ — your streak is safe. Back at it tomorrow!',
    weeklyReviewTone: 'gentle, warm, encouraging, like a kind mentor',
    aiPace: 'soft',
  },
  emoji: {
    streak: '🌸',
    task: '✨',
    goal: '🌿',
    win: '🎉',
  },
};

// ─── Balanced Theme ───────────────────────────────────────────────────────────
// Clean, honest, motivating. Indigo + amber. Real talk with a supportive edge.

const balancedTheme: Theme = {
  key: 'balanced',
  name: 'Balanced',
  tagline: 'Consistent action builds empires',
  colors: {
    background: '#f8f9ff',
    surface: '#ffffff',
    surfaceAlt: '#f0f2ff',
    primary: '#6366f1',        // indigo
    primaryLight: '#c7d2fe',
    accent: '#f59e0b',         // amber
    text: '#1e1b4b',
    textMuted: '#6b7280',
    textInverse: '#ffffff',
    border: '#e0e7ff',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    streakFire: '#f59e0b',
  },
  tone: {
    greeting: 'Morning',
    taskMotivation: 'Keep your momentum going ⚡',
    streakCongrats: 'Streak extended. You\'re building something real. 💪',
    streakWarning: 'Day\'s not over yet — get one task done and protect that streak.',
    streakBroken: 'Streak reset. That\'s information, not failure. Start over stronger.',
    freezeUsed: 'Freeze card used ❄️ — streak protected. Don\'t make it a habit.',
    weeklyReviewTone: 'honest, balanced, like a smart mentor who tells it straight',
    aiPace: 'balanced',
  },
  emoji: {
    streak: '⚡',
    task: '✅',
    goal: '🎯',
    win: '🏆',
  },
};

// ─── Hardcore Theme ───────────────────────────────────────────────────────────
// Dark, sharp, zero excuses. Black + red. You said you wanted this.

const hardcoreTheme: Theme = {
  key: 'hardcore',
  name: 'Hardcore',
  tagline: 'No excuses. Full speed.',
  colors: {
    background: '#0a0a0a',
    surface: '#141414',
    surfaceAlt: '#1f1f1f',
    primary: '#ef4444',        // red
    primaryLight: '#7f1d1d',
    accent: '#facc15',         // yellow
    text: '#f5f5f5',
    textMuted: '#6b6b6b',
    textInverse: '#0a0a0a',
    border: '#2a2a2a',
    success: '#22c55e',
    warning: '#facc15',
    danger: '#ef4444',
    streakFire: '#ef4444',
  },
  tone: {
    greeting: 'WAKE UP',
    taskMotivation: 'NO EXCUSES. GET IT DONE. 🔥',
    streakCongrats: 'Streak. You showed up. That\'s what winners do. Keep going.',
    streakWarning: 'Midnight is coming. You haven\'t done a thing. Fix it. NOW.',
    streakBroken: 'Streak broken. You chose comfort over growth. Don\'t let it happen again.',
    freezeUsed: 'Freeze used. That\'s your pass. One. Don\'t waste it twice.',
    weeklyReviewTone: 'blunt, no-nonsense, drill sergeant energy, zero sugarcoating',
    aiPace: 'hardcore',
  },
  emoji: {
    streak: '🔥',
    task: '💀',
    goal: '⚔️',
    win: '🏆',
  },
};

// ─── Theme Map ────────────────────────────────────────────────────────────────

export const themes: Record<ThemeKey, Theme> = {
  soft: softTheme,
  balanced: balancedTheme,
  hardcore: hardcoreTheme,
};

export const getTheme = (key: ThemeKey): Theme => themes[key];

export const themeKeys: ThemeKey[] = ['soft', 'balanced', 'hardcore'];
