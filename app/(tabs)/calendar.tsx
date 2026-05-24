import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useGoalStore } from '@/stores/goalStore';
import { Task, Goal } from '@/types';
import { toDateString } from '@/lib/streak';

// ─── Category colors (matches goals.tsx) ─────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  fitness:       '#F97316',
  career:        '#6366F1',
  learning:      '#0EA5E9',
  finance:       '#22C55E',
  health:        '#EC4899',
  relationships: '#F43F5E',
  creativity:    '#A855F7',
  other:         '#94A3B8',
};

// ─── Time helpers ─────────────────────────────────────────────────────────────

function to12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function timeToMinutes(time24: string): number {
  const [h, m] = time24.split(':').map(Number);
  return h * 60 + m;
}

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

// ─── Generate week days around a selected date ────────────────────────────────

function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay(); // 0=Sun
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7)); // rewind to Mon
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ─── TIME_SLOTS for the reschedule picker ─────────────────────────────────────

const RESCHEDULE_SLOTS = [
  { label: 'Morning',  icon: '🌅', startTime: '06:00', desc: '6:00 AM' },
  { label: 'Midday',   icon: '☀️', startTime: '12:00', desc: '12:00 PM' },
  { label: 'Evening',  icon: '🌆', startTime: '17:00', desc: '5:00 PM' },
  { label: 'Night',    icon: '🌙', startTime: '20:00', desc: '8:00 PM' },
];

// ─── Task block component ─────────────────────────────────────────────────────

function TaskBlock({
  task, goal, onComplete, onReschedule, isCompleted,
}: {
  task: Task;
  goal?: Goal;
  onComplete: () => void;
  onReschedule: () => void;
  isCompleted: boolean;
}) {
  const { theme } = useTheme();
  const cc = goal ? (CATEGORY_COLORS[goal.category] ?? theme.colors.primary) : theme.colors.primary;
  const startLabel = task.scheduledTime ? to12h(task.scheduledTime) : null;
  const endLabel   = task.scheduledEndTime ? to12h(task.scheduledEndTime) : null;
  const mins = task.estimatedMinutes ?? 0;

  return (
    <TouchableOpacity
      onPress={onComplete}
      onLongPress={onReschedule}
      activeOpacity={0.78}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginBottom: 10,
        overflow: 'hidden',
        opacity: isCompleted ? 0.5 : 1,
        borderWidth: 1,
        borderColor: isCompleted ? theme.colors.border : cc + '25',
        shadowColor: cc,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isCompleted ? 0 : 0.08,
        shadowRadius: 8,
        elevation: isCompleted ? 0 : 2,
      }}
    >
      {/* Left accent */}
      <View style={{ width: 4, backgroundColor: cc }} />

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 13 }}>
        {/* Time badge row */}
        {startLabel && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={{
              backgroundColor: cc + '15', borderRadius: 7,
              paddingHorizontal: 8, paddingVertical: 3,
              flexDirection: 'row', alignItems: 'center', gap: 4,
            }}>
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" stroke={cc} strokeWidth="2" />
                <Path d="M12 7v5l3 3" stroke={cc} strokeWidth="2" strokeLinecap="round" />
              </Svg>
              <Text style={{ color: cc, fontSize: 10, fontWeight: '500' }}>
                {startLabel}{endLabel ? ` — ${endLabel}` : ''}
              </Text>
            </View>
            {mins > 0 && (
              <Text style={{ color: theme.colors.textMuted, fontSize: 10 }}>{mins} min</Text>
            )}
          </View>
        )}

        {/* Title */}
        <Text style={{
          color: theme.colors.text,
          fontSize: 14,
          fontWeight: '400',
          lineHeight: 20,
          textDecorationLine: isCompleted ? 'line-through' : 'none',
        }} numberOfLines={2}>
          {task.title}
        </Text>

        {/* Goal name */}
        {goal && (
          <Text style={{ color: cc, fontSize: 11, fontWeight: '400', marginTop: 4 }} numberOfLines={1}>
            {goal.title}
          </Text>
        )}
      </View>

      {/* Checkbox */}
      <View style={{ justifyContent: 'center', paddingRight: 14 }}>
        <View style={{
          width: 24, height: 24, borderRadius: 12,
          backgroundColor: isCompleted ? cc : 'transparent',
          borderWidth: 1.5,
          borderColor: isCompleted ? cc : cc + '60',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {isCompleted && (
            <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main calendar screen ─────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { theme, themeKey } = useTheme();
  const { tasks, goals, isLoaded, load, getTasksForDate, completeTask, uncompleteTask, rescheduleTask } = useGoalStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekAnchor, setWeekAnchor]     = useState(new Date());
  const [refreshing, setRefreshing]     = useState(false);

  useEffect(() => { if (!isLoaded) load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  const weekDays = getWeekDays(weekAnchor);
  const selectedStr = toDateString(selectedDate);
  const todayStr = toDateString(new Date());

  const dayTasks = getTasksForDate(selectedStr).sort((a, b) => {
    if (!a.scheduledTime && !b.scheduledTime) return 0;
    if (!a.scheduledTime) return 1;
    if (!b.scheduledTime) return -1;
    return timeToMinutes(a.scheduledTime) - timeToMinutes(b.scheduledTime);
  });

  const completedCount = dayTasks.filter(t => !!t.completedAt).length;

  const handleComplete = async (task: Task) => {
    if (task.completedAt) {
      await uncompleteTask(task.id);
    } else {
      await completeTask(task.id);
    }
  };

  const handleReschedule = (task: Task) => {
    Alert.alert(
      'Reschedule task',
      `Move "${task.title}" to a different time?`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...RESCHEDULE_SLOTS.map(slot => ({
          text: `${slot.icon} ${slot.label} (${slot.desc})`,
          onPress: () => {
            const endTime = addMinutes(slot.startTime, task.estimatedMinutes ?? 30);
            rescheduleTask(task.id, slot.startTime, endTime);
          },
        })),
      ],
    );
  };

  const goPrevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };
  const goNextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };

  const fullDateLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const isToday = selectedStr === todayStr;

  // ── Compute week stats for the mini bar ───────────────────────────────────
  const weekStats = weekDays.map(d => {
    const dt = toDateString(d);
    const dt_tasks = getTasksForDate(dt);
    return {
      date: dt,
      total: dt_tasks.length,
      done:  dt_tasks.filter(t => !!t.completedAt).length,
    };
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '600', letterSpacing: -0.3 }}>
              Calendar
            </Text>
            {/* Jump to today */}
            {!isToday && (
              <TouchableOpacity
                onPress={() => { setSelectedDate(new Date()); setWeekAnchor(new Date()); }}
                style={{
                  backgroundColor: theme.colors.primaryLight,
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '500' }}>Today</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '400' }}>
            {fullDateLabel}
          </Text>
        </View>

        {/* ── Week strip ───────────────────────────────────────────────── */}
        <View style={{
          backgroundColor: theme.colors.surface,
          marginHorizontal: 20, marginTop: 16,
          borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8,
          borderWidth: 1, borderColor: theme.colors.border,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
        }}>
          {/* Week nav row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 }}>
            <TouchableOpacity onPress={goPrevWeek} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 18 }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '400' }}>
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
              {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={goNextWeek} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day pills */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
            {weekDays.map((d, i) => {
              const ds = toDateString(d);
              const isSelected = ds === selectedStr;
              const isCurrentDay = ds === todayStr;
              const stat = weekStats[i];
              const hasTasks = stat.total > 0;
              const allDone = hasTasks && stat.done === stat.total;

              return (
                <TouchableOpacity
                  key={ds}
                  onPress={() => setSelectedDate(d)}
                  activeOpacity={0.7}
                  style={{ alignItems: 'center', flex: 1 }}
                >
                  {/* Day label */}
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '400',
                    color: isSelected ? theme.colors.primary : theme.colors.textMuted,
                    marginBottom: 5,
                  }}>
                    {DAY_LABELS[i]}
                  </Text>

                  {/* Date circle */}
                  <View style={{
                    width: 34, height: 34, borderRadius: 17,
                    backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                    borderWidth: isCurrentDay && !isSelected ? 1.5 : 0,
                    borderColor: theme.colors.primary,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: isSelected || isCurrentDay ? '500' : '400',
                      color: isSelected ? '#fff' : isCurrentDay ? theme.colors.primary : theme.colors.text,
                    }}>
                      {d.getDate()}
                    </Text>
                  </View>

                  {/* Task dot */}
                  <View style={{ marginTop: 5, height: 5 }}>
                    {hasTasks && (
                      <View style={{
                        width: 5, height: 5, borderRadius: 3,
                        backgroundColor: allDone ? theme.colors.primary : theme.colors.primary + '55',
                      }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Day summary bar ──────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '500' }}>
              {isToday ? "Today's schedule" : 'Schedule'}
            </Text>
            {dayTasks.length > 0 && (
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '400' }}>
                {completedCount}/{dayTasks.length} done
              </Text>
            )}
          </View>

          {/* Progress bar */}
          {dayTasks.length > 0 && (
            <View style={{ height: 3, backgroundColor: theme.colors.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <View style={{
                height: 3,
                borderRadius: 2,
                backgroundColor: theme.colors.primary,
                width: `${(completedCount / dayTasks.length) * 100}%`,
              }} />
            </View>
          )}
        </View>

        {/* ── Task list ────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          {dayTasks.length === 0 ? (
            <EmptyDay theme={theme} isToday={isToday} />
          ) : (
            dayTasks.map(task => {
              const goal = goals.find(g => g.id === task.goalId);
              return (
                <TaskBlock
                  key={task.id}
                  task={task}
                  goal={goal}
                  isCompleted={!!task.completedAt}
                  onComplete={() => handleComplete(task)}
                  onReschedule={() => handleReschedule(task)}
                />
              );
            })
          )}
        </View>

        {/* ── Long press hint ──────────────────────────────────────────── */}
        {dayTasks.length > 0 && (
          <Text style={{ textAlign: 'center', color: theme.colors.textMuted, fontSize: 11, marginTop: 8, fontWeight: '400' }}>
            Tap to complete · Long press to reschedule
          </Text>
        )}

        {/* ── Week overview ─────────────────────────────────────────────── */}
        <WeekOverview weekStats={weekStats} weekDays={weekDays} theme={theme} />

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Empty day ────────────────────────────────────────────────────────────────

function EmptyDay({ theme, isToday }: { theme: any; isToday: boolean }) {
  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: 20, padding: 32,
      alignItems: 'center',
      borderWidth: 1, borderColor: theme.colors.border,
    }}>
      <Text style={{ fontSize: 36, marginBottom: 12 }}>
        {isToday ? '✨' : '📅'}
      </Text>
      <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '500', marginBottom: 6, textAlign: 'center' }}>
        {isToday ? 'Nothing scheduled today' : 'No tasks this day'}
      </Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
        {isToday
          ? 'Add a goal and Surgo will schedule tasks at your preferred time.'
          : 'Tasks from your goals will appear here when scheduled.'}
      </Text>
    </View>
  );
}

// ─── Week overview card ───────────────────────────────────────────────────────

function WeekOverview({ weekStats, weekDays, theme }: {
  weekStats: Array<{ date: string; total: number; done: number }>;
  weekDays: Date[];
  theme: any;
}) {
  const totalWeek = weekStats.reduce((s, d) => s + d.total, 0);
  const doneWeek  = weekStats.reduce((s, d) => s + d.done,  0);
  if (totalWeek === 0) return null;

  return (
    <View style={{
      marginHorizontal: 20, marginTop: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 20, padding: 18,
      borderWidth: 1, borderColor: theme.colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '500' }}>
          This week
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '400' }}>
          {doneWeek}/{totalWeek} tasks
        </Text>
      </View>

      {/* Mini bar chart */}
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 40 }}>
        {weekStats.map((stat, i) => {
          const pct = stat.total > 0 ? stat.done / stat.total : 0;
          const barH = Math.max(4, Math.round(pct * 36));
          const isToday = stat.date === toDateString(new Date());
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 40 }}>
              <View style={{
                width: '100%', height: barH,
                backgroundColor: pct === 1
                  ? theme.colors.primary
                  : pct > 0
                  ? theme.colors.primary + '55'
                  : theme.colors.border,
                borderRadius: 4,
                borderWidth: isToday ? 1.5 : 0,
                borderColor: theme.colors.primary,
              }} />
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {weekDays.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontWeight: '400' }}>
              {['M','T','W','T','F','S','S'][i]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
