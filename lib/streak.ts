import { Streak, StreakDay, StreakDayStatus, StreakState } from '@/types';

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

export function subtractDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() - days);
  return toDateString(date);
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export function isToday(dateStr: string): boolean {
  return dateStr === toDateString(new Date());
}

export function isYesterday(dateStr: string): boolean {
  return dateStr === subtractDays(toDateString(new Date()), 1);
}

// ─── Streak Calculation ───────────────────────────────────────────────────────

/**
 * Walk backwards through history to calculate the current streak.
 * Completed and frozen days both count. Missed days break the chain.
 */
export function calculateCurrentStreak(history: StreakDay[]): number {
  const today = toDateString(new Date());
  let streak = 0;

  // Check if today is already completed — add it first
  const todayRecord = history.find((d) => d.date === today);
  if (todayRecord?.status === 'completed') {
    streak++;
  }

  // Walk back from yesterday
  let checkDate = subtractDays(today, 1);

  while (true) {
    const day = history.find((d) => d.date === checkDate);

    if (!day) break; // No record means missed

    if (day.status === 'completed' || day.status === 'frozen') {
      streak++;
      checkDate = subtractDays(checkDate, 1);
    } else {
      break; // Missed day — chain ends
    }
  }

  return streak;
}

/**
 * Determine the streak's current visual/emotional state.
 */
export function getStreakState(streak: Streak): StreakState {
  const today = toDateString(new Date());

  if (streak.totalCheckIns === 0) return 'new';

  const todayRecord = streak.history.find((d) => d.date === today);

  // Already checked in today
  if (todayRecord?.status === 'completed') return 'active';

  // Used a freeze card today
  if (todayRecord?.status === 'frozen') return 'grace';

  // Missed yesterday (and haven't checked in today)
  if (streak.lastCheckIn && !isYesterday(streak.lastCheckIn) && !isToday(streak.lastCheckIn)) {
    return 'broken';
  }

  // Haven't checked in today but yesterday was fine
  return 'at_risk';
}

// ─── Streak Update ────────────────────────────────────────────────────────────

/**
 * Record a check-in for today. Returns the updated streak object.
 */
export function recordCheckIn(
  streak: Streak,
  tasksCompleted: number,
  tasksTotal: number,
): Streak {
  const today = toDateString(new Date());

  const newDay: StreakDay = {
    date: today,
    status: 'completed',
    tasksCompleted,
    tasksTotal,
  };

  // Replace today's record if it exists, otherwise append
  const history = streak.history.filter((d) => d.date !== today);
  history.push(newDay);
  history.sort((a, b) => a.date.localeCompare(b.date));

  const updatedStreak: Streak = {
    ...streak,
    lastCheckIn: today,
    totalCheckIns: streak.totalCheckIns + 1,
    history,
  };

  updatedStreak.currentStreak = calculateCurrentStreak(history);
  updatedStreak.longestStreak = Math.max(
    updatedStreak.longestStreak,
    updatedStreak.currentStreak,
  );

  return updatedStreak;
}

/**
 * Use a freeze card to protect today's streak.
 * Returns null if no freeze cards available.
 */
export function useFreezeCard(streak: Streak): Streak | null {
  if (streak.freezeCardsAvailable <= 0) return null;

  const today = toDateString(new Date());

  const frozenDay: StreakDay = {
    date: today,
    status: 'frozen',
    tasksCompleted: 0,
    tasksTotal: 0,
  };

  const history = streak.history.filter((d) => d.date !== today);
  history.push(frozenDay);
  history.sort((a, b) => a.date.localeCompare(b.date));

  return {
    ...streak,
    freezeCardsAvailable: streak.freezeCardsAvailable - 1,
    history,
    currentStreak: calculateCurrentStreak(history),
  };
}

/**
 * Grant a freeze card (called monthly or on achievement).
 * Capped at 3.
 */
export function grantFreezeCard(streak: Streak): Streak {
  return {
    ...streak,
    freezeCardsAvailable: Math.min(streak.freezeCardsAvailable + 1, 3),
  };
}

// ─── Default Streak ───────────────────────────────────────────────────────────

export function createDefaultStreak(userId: string): Streak {
  return {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastCheckIn: null,
    freezeCardsAvailable: 1, // Everyone starts with 1
    totalCheckIns: 0,
    history: [],
  };
}

// ─── Streak Stats ─────────────────────────────────────────────────────────────

export function getStreakStats(streak: Streak) {
  const totalDays = streak.history.length;
  const completedDays = streak.history.filter(
    (d) => d.status === 'completed',
  ).length;
  const frozenDays = streak.history.filter((d) => d.status === 'frozen').length;
  const missedDays = streak.history.filter((d) => d.status === 'missed').length;
  const completionRate =
    totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return {
    totalDays,
    completedDays,
    frozenDays,
    missedDays,
    completionRate,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    freezeCardsAvailable: streak.freezeCardsAvailable,
  };
}

// ─── Milestone Checks ─────────────────────────────────────────────────────────

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

export function checkStreakMilestone(
  prevStreak: number,
  newStreak: number,
): number | null {
  for (const milestone of STREAK_MILESTONES) {
    if (prevStreak < milestone && newStreak >= milestone) {
      return milestone;
    }
  }
  return null;
}
