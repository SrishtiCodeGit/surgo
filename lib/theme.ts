import { Theme, ThemeKey } from '@/types';

// ─── Soft "Bloom" ─────────────────────────────────────────────────────────────
// Sunny golden yellow + warm tangerine. Feels like a bright morning.

const softTheme: Theme = {
  key: 'soft',
  name: 'Soft',
  tagline: 'Rise softly, grow surely 🌸',
  colors: {
    background: '#FFFEF0',      // very warm cream-yellow
    surface: '#FFFFFF',
    surfaceAlt: '#FFF8D6',      // pale yellow tint
    primary: '#F0A500',         // rich golden yellow
    primaryLight: '#FFF3CC',    // soft pale yellow
    accent: '#FF7A35',          // warm tangerine
    text: '#2A1A00',            // warm dark brown-black
    textMuted: '#9A7020',       // golden brown
    textInverse: '#1A1000',     // dark on yellow backgrounds
    border: '#FAE8A0',          // soft yellow border
    success: '#5CB88A',         // sage green
    warning: '#FF7A35',         // tangerine
    danger: '#D96878',          // rose-danger
    streakFire: '#FF7A35',      // tangerine flame
  },
  tone: {
    greeting: 'Good morning',
    taskMotivation: 'Take it one gentle step at a time 🌿',
    streakCongrats: 'Look at you showing up — that\'s everything. 🌸',
    streakWarning: 'Your goal is still waiting — no pressure, just a kind nudge 💛',
    streakBroken: 'That\'s okay. Every single day is a fresh start. Let\'s bloom again 🌱',
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

// ─── Balanced "Focus" ─────────────────────────────────────────────────────────
// Rich indigo + cyan. Clean, sharp, premium productivity.

const balancedTheme: Theme = {
  key: 'balanced',
  name: 'Balanced',
  tagline: 'Consistent action builds empires ⚡',
  colors: {
    background: '#F5F7FF',      // barely blue white
    surface: '#FFFFFF',
    surfaceAlt: '#EBF0FF',      // light indigo tint
    primary: '#4F46E5',         // rich indigo
    primaryLight: '#E6E5FF',    // pale indigo
    accent: '#06B6D4',          // electric cyan
    text: '#0A0F2E',            // near-black with deep blue
    textMuted: '#6272A4',       // blue-grey
    textInverse: '#FFFFFF',
    border: '#DCDEFF',          // pale indigo border
    success: '#10B981',         // emerald
    warning: '#F59E0B',         // amber
    danger: '#EF4444',          // red
    streakFire: '#F59E0B',      // amber flame
  },
  tone: {
    greeting: 'Morning',
    taskMotivation: 'Keep your momentum going ⚡',
    streakCongrats: 'Streak extended. You\'re building something real. 💪',
    streakWarning: 'Day\'s not over — get one task done and protect that streak.',
    streakBroken: 'Streak reset. That\'s data, not failure. Start over stronger.',
    freezeUsed: 'Freeze used ❄️ — streak protected. Don\'t make it a habit.',
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

// ─── Hardcore "Obsidian" ──────────────────────────────────────────────────────
// Near-black + vivid red. Zero mercy. Premium dark-mode energy.

const hardcoreTheme: Theme = {
  key: 'hardcore',
  name: 'Hardcore',
  tagline: 'No excuses. Full send. 🔥',
  colors: {
    background: '#080808',
    surface: '#111111',
    surfaceAlt: '#1A1A1A',
    primary: '#FF3B30',         // vivid red
    primaryLight: '#2D0B08',    // dark red background tint
    accent: '#FFD60A',          // sharp gold
    text: '#F2F2F2',
    textMuted: '#505050',
    textInverse: '#080808',
    border: '#1E1E1E',
    success: '#30D158',         // bright green
    warning: '#FFD60A',         // gold
    danger: '#FF453A',          // bright danger
    streakFire: '#FF6308',      // orange-red flame
  },
  tone: {
    greeting: 'WAKE UP',
    taskMotivation: 'NO EXCUSES. GET IT DONE. 🔥',
    streakCongrats: 'Streak. You showed up. Winners do that. Keep going.',
    streakWarning: 'Midnight is coming. You haven\'t done a thing. Fix that. NOW.',
    streakBroken: 'Streak broken. You chose comfort over growth. Don\'t let it happen again.',
    freezeUsed: 'Freeze used. That\'s your pass. Don\'t waste it twice.',
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
