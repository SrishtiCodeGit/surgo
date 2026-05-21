import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ThemeKey } from '@/types';
import { getTodaysQuote } from '@/lib/quotes';

// ─── Setup ────────────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('surgo-reminders', {
      name: 'Surgo Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Notification builders ────────────────────────────────────────────────────
// Each returns { title, body } with a motivational quote appended.

function buildMorningNotification(
  pace: ThemeKey,
  todayTask: string,
  streak: number,
): { title: string; body: string } {
  const quote = getTodaysQuote(pace);
  const streakLine =
    streak > 1 ? ` ${streak}-day streak on the line.` : ' Day 1 starts now.';

  switch (pace) {
    case 'soft':
      return {
        title: '🌿 Good morning — rise gently',
        body: `Today: ${todayTask}.${streakLine}\n\n"${quote}"`,
      };
    case 'balanced':
      return {
        title: '⚡ Morning. Time to move.',
        body: `${todayTask}.${streakLine}\n\n"${quote}"`,
      };
    case 'hardcore':
      return {
        title: '🔥 WAKE UP. NO EXCUSES.',
        body: `${todayTask}.${streakLine}\n\n"${quote}"`,
      };
  }
}

function buildMiddayNudge(pace: ThemeKey): { title: string; body: string } {
  const quote = getTodaysQuote(pace);

  switch (pace) {
    case 'soft':
      return {
        title: '💛 Just a gentle reminder',
        body: `Your goal is still waiting. Even 5 minutes counts.\n\n"${quote}"`,
      };
    case 'balanced':
      return {
        title: '⚡ Halfway through the day',
        body: `Not checked in yet. Your streak is counting on you.\n\n"${quote}"`,
      };
    case 'hardcore':
      return {
        title: '💀 HALFWAY THROUGH. STILL NOTHING?',
        body: `You haven't done a thing. Fix it now.\n\n"${quote}"`,
      };
  }
}

function buildEveningWarning(
  pace: ThemeKey,
  streak: number,
): { title: string; body: string } {
  const quote = getTodaysQuote(pace);
  const streakText = streak > 0 ? `${streak}-day` : 'your';

  switch (pace) {
    case 'soft':
      return {
        title: '🌙 One hour before midnight',
        body: `Don't let yourself down. One small thing and your ${streakText} streak is safe.\n\n"${quote}"`,
      };
    case 'balanced':
      return {
        title: `⚠️ ${streakText} streak ends at midnight`,
        body: `One task. Ten minutes. Protect what you've built.\n\n"${quote}"`,
      };
    case 'hardcore':
      return {
        title: `🔥 ${streakText} STREAK DIES IN 1 HOUR`,
        body: `You're about to throw it all away. MOVE.\n\n"${quote}"`,
      };
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

export async function scheduleAllDailyNotifications({
  morningHour,
  morningMinute,
  pace,
  todayTask,
  streak,
}: {
  morningHour: number;
  morningMinute: number;
  pace: ThemeKey;
  todayTask: string;
  streak: number;
}) {
  // Cancel all existing so we don't stack duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  const morning = buildMorningNotification(pace, todayTask, streak);
  const nudge = buildMiddayNudge(pace);
  const evening = buildEveningWarning(pace, streak);

  // 1. Morning reminder (user-chosen time)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: morning.title,
      body: morning.body,
      data: { type: 'morning' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: morningHour,
      minute: morningMinute,
    },
  });

  // 2. Midday nudge at 12:00 (only fires if user hasn't checked in — handled in app logic)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: nudge.title,
      body: nudge.body,
      data: { type: 'nudge' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 12,
      minute: 0,
    },
  });

  // 3. Evening final warning at 21:00
  await Notifications.scheduleNotificationAsync({
    content: {
      title: evening.title,
      body: evening.body,
      data: { type: 'evening' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Instant (local) notifications ───────────────────────────────────────────
// Used for milestone celebrations — fired immediately in-app.

export async function sendMilestoneNotification(
  streak: number,
  pace: ThemeKey,
  milestoneQuote: string,
) {
  const emojiMap: Record<ThemeKey, string> = {
    soft: '🌸',
    balanced: '🏆',
    hardcore: '🔥',
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emojiMap[pace]} ${streak}-Day Streak!`,
      body: milestoneQuote,
      data: { type: 'milestone', streak },
    },
    trigger: null, // Fire immediately
  });
}
