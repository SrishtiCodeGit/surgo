// ─── Theme ────────────────────────────────────────────────────────────────────

export type ThemeKey = 'soft' | 'balanced' | 'hardcore';

export interface Theme {
  key: ThemeKey;
  name: string;
  tagline: string;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    primary: string;
    primaryLight: string;
    accent: string;
    text: string;
    textMuted: string;
    textInverse: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
    streakFire: string;
  };
  tone: {
    greeting: string;         // morning message prefix
    taskMotivation: string;   // shown above task list
    streakCongrats: string;   // when streak increments
    streakWarning: string;    // at-risk nudge
    streakBroken: string;     // when streak resets
    freezeUsed: string;       // after using a freeze card
    weeklyReviewTone: string; // passed to Claude for review
    aiPace: string;           // passed to Claude for task generation
  };
  emoji: {
    streak: string;
    task: string;
    goal: string;
    win: string;
  };
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface VeloUser {
  id: string;
  name: string;
  email: string;
  theme: ThemeKey;
  notificationTime: string; // "HH:MM" 24h
  timezone: string;
  createdAt: string;
}

// ─── Goal ─────────────────────────────────────────────────────────────────────

export type GoalCategory =
  | 'fitness'
  | 'career'
  | 'learning'
  | 'finance'
  | 'health'
  | 'relationships'
  | 'creativity'
  | 'other';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  targetDate: string; // ISO date
  metric?: string;           // e.g. "Run 5km", "Save $5000"
  progress: number;          // 0–100
  isActive: boolean;
  createdAt: string;
  minutesPerDay?: number;    // daily time commitment
  overview?: string;         // AI coaching overview
  achievabilityNote?: string;
  timeBreakdown?: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  targetDate: string;
  completedAt?: string;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  dueDate: string;        // ISO date "YYYY-MM-DD"
  estimatedMinutes?: number;
  completedAt?: string;
  aiGenerated: boolean;
  isStretchTask: boolean;
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export type StreakDayStatus = 'completed' | 'missed' | 'frozen' | 'pending';

export type StreakState = 'active' | 'at_risk' | 'grace' | 'broken' | 'new';

export interface StreakDay {
  date: string;           // "YYYY-MM-DD"
  status: StreakDayStatus;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null; // "YYYY-MM-DD"
  freezeCardsAvailable: number;
  totalCheckIns: number;
  history: StreakDay[];
}

// ─── Daily Log ────────────────────────────────────────────────────────────────

export interface DailyLog {
  id: string;
  userId: string;
  date: string;           // "YYYY-MM-DD"
  tasksCompleted: number;
  tasksTotal: number;
  checkInDone: boolean;
  note?: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AIMilestone {
  title: string;
  targetDate: string;
}

export interface AIWeekTask {
  title: string;
  day: number; // 1=Mon … 7=Sun
  estimatedMinutes: number;
}

export interface AITodayTask {
  title: string;
  why: string;
}

export interface AIGoalBreakdown {
  milestones: AIMilestone[];
  weekTasks: AIWeekTask[];
  todayTask: AITodayTask;
}

// Extended goal model to store time-per-day
export interface GoalMeta {
  minutesPerDay: number;
  overview?: string;
  achievabilityNote?: string;
  timeBreakdown?: string;
}
