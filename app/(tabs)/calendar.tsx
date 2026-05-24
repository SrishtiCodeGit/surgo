import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useGoalStore } from '@/stores/goalStore';
import { Task, Goal } from '@/types';
import { toDateString } from '@/lib/streak';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const HOUR_HEIGHT = 72;   // px per hour in the grid
const START_HOUR  = 6;    // 6 AM
const END_HOUR    = 22;   // 10 PM
const TIME_COL_W  = 62;   // width of the left time-label column
const GRID_H      = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const HOURS       = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

// ─── Category soft-tint colours ──────────────────────────────────────────────

const CAT_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  fitness:       { bg: '#FFF3E0', accent: '#F97316', text: '#7C3600' },
  career:        { bg: '#EEF2FF', accent: '#6366F1', text: '#312E81' },
  learning:      { bg: '#E0F2FE', accent: '#0EA5E9', text: '#075985' },
  finance:       { bg: '#DCFCE7', accent: '#22C55E', text: '#14532D' },
  health:        { bg: '#FCE7F3', accent: '#EC4899', text: '#831843' },
  relationships: { bg: '#FFE4E6', accent: '#F43F5E', text: '#9F1239' },
  creativity:    { bg: '#F3E8FF', accent: '#A855F7', text: '#581C87' },
  other:         { bg: '#F1F5F9', accent: '#94A3B8', text: '#334155' },
};

function catStyle(category?: string) {
  return CAT_COLORS[category ?? 'other'] ?? CAT_COLORS.other;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHour(h: number): string {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:00 ${suffix}`;
}

function to12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function addMinutes(t: string, mins: number): string {
  const total = timeToMinutes(t) + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function nowToTop(): number {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const startMins = START_HOUR * 60;
  return ((mins - startMins) / 60) * HOUR_HEIGHT;
}

function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const RESCHEDULE_SLOTS = [
  { label: 'Morning',  icon: '🌅', startTime: '06:00' },
  { label: 'Midday',   icon: '☀️', startTime: '12:00' },
  { label: 'Evening',  icon: '🌆', startTime: '17:00' },
  { label: 'Night',    icon: '🌙', startTime: '20:00' },
];

// ─── Live clock ───────────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { goals, isLoaded, load, getTasksForDate, completeTask, uncompleteTask, rescheduleTask } = useGoalStore();

  const now         = useClock();
  const todayStr    = toDateString(new Date());
  const [selected, setSelected]   = useState(new Date());
  const [anchor, setAnchor]       = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const gridRef = useRef<ScrollView>(null);

  const selectedStr = toDateString(selected);
  const isToday     = selectedStr === todayStr;
  const weekDays    = getWeekDays(anchor);

  useEffect(() => { if (!isLoaded) load(); }, []);

  // Auto-scroll to current time on mount / when switching to today
  useEffect(() => {
    if (isToday) {
      const top = Math.max(0, nowToTop() - HOUR_HEIGHT * 1.5);
      setTimeout(() => gridRef.current?.scrollTo({ y: top, animated: true }), 400);
    }
  }, [isToday]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  // Tasks for selected day, sorted by time
  const rawTasks = getTasksForDate(selectedStr);
  const scheduled   = rawTasks.filter(t =>  t.scheduledTime).sort((a, b) => timeToMinutes(a.scheduledTime!) - timeToMinutes(b.scheduledTime!));
  const unscheduled = rawTasks.filter(t => !t.scheduledTime);

  const handleComplete = async (task: Task) => {
    task.completedAt ? await uncompleteTask(task.id) : await completeTask(task.id);
  };

  const handleReschedule = (task: Task) => {
    Alert.alert(
      'Move to a different time?',
      task.title,
      [
        { text: 'Cancel', style: 'cancel' },
        ...RESCHEDULE_SLOTS.map(s => ({
          text: `${s.icon} ${s.label}`,
          onPress: () => rescheduleTask(task.id, s.startTime, addMinutes(s.startTime, task.estimatedMinutes ?? 30)),
        })),
      ],
    );
  };

  // Clock string
  const clockStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Date range label for week
  const rangeLabel = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${weekDays[6].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        stickyHeaderIndices={[0]}
      >

        {/* ── Sticky header ──────────────────────────────────────────── */}
        <View style={{ backgroundColor: theme.colors.background, paddingBottom: 2 }}>

          {/* Title row */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6,
          }}>
            <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '600', letterSpacing: -0.3 }}>
              Calendar
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {/* Live clock */}
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '400', fontVariant: ['tabular-nums'] }}>
                {clockStr}
              </Text>
              {/* Bell */}
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={theme.colors.textMuted} strokeWidth="1.8" strokeLinecap="round" />
                <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={theme.colors.textMuted} strokeWidth="1.8" strokeLinecap="round" />
              </Svg>
            </View>
          </View>

          {/* Range sub-label */}
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '400', paddingHorizontal: 20, marginBottom: 14 }}>
            {rangeLabel}
          </Text>

          {/* ── Week strip ─────────────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            {/* Week nav */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <TouchableOpacity onPress={() => { const d=new Date(anchor); d.setDate(d.getDate()-7); setAnchor(d); }} hitSlop={{top:10,bottom:10,left:12,right:12}}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 22, lineHeight: 24 }}>‹</Text>
              </TouchableOpacity>
              {/* Day letters */}
              <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-around', marginHorizontal: 4 }}>
                {DAY_LETTERS.map((l, i) => (
                  <Text key={i} style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '400', width: 34, textAlign: 'center' }}>{l}</Text>
                ))}
              </View>
              <TouchableOpacity onPress={() => { const d=new Date(anchor); d.setDate(d.getDate()+7); setAnchor(d); }} hitSlop={{top:10,bottom:10,left:12,right:12}}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 22, lineHeight: 24 }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Date numbers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 22 }}>
              {weekDays.map((d, i) => {
                const ds = toDateString(d);
                const isSel  = ds === selectedStr;
                const isCurrentDay = ds === todayStr;
                const dayTasks = getTasksForDate(ds);
                const hasDone = dayTasks.some(t => !!t.completedAt);
                const hasOpen = dayTasks.some(t => !t.completedAt);

                return (
                  <TouchableOpacity
                    key={ds}
                    onPress={() => setSelected(d)}
                    activeOpacity={0.7}
                    style={{ alignItems: 'center', width: 34 }}
                  >
                    <View style={{
                      width: 34, height: 34, borderRadius: 17,
                      backgroundColor: isSel ? theme.colors.primary : 'transparent',
                      borderWidth: isCurrentDay && !isSel ? 1.5 : 0,
                      borderColor: theme.colors.primary,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: isSel ? '600' : '400',
                        color: isSel ? '#fff' : isCurrentDay ? theme.colors.primary : theme.colors.text,
                      }}>
                        {d.getDate()}
                      </Text>
                    </View>
                    {/* Activity dot */}
                    <View style={{ height: 5, marginTop: 3, alignItems: 'center', justifyContent: 'center' }}>
                      {dayTasks.length > 0 && (
                        <View style={{
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: hasOpen
                            ? theme.colors.primary + '66'
                            : theme.colors.primary,
                        }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: theme.colors.border, marginHorizontal: 20 }} />
        </View>

        {/* ── Unscheduled tasks (if any) ──────────────────────────────── */}
        {unscheduled.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Unscheduled
            </Text>
            {unscheduled.map(task => {
              const goal = goals.find(g => g.id === task.goalId);
              const cs = catStyle(goal?.category);
              return (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => handleComplete(task)}
                  onLongPress={() => handleReschedule(task)}
                  activeOpacity={0.78}
                  style={{
                    backgroundColor: cs.bg,
                    borderRadius: 14, padding: 14,
                    marginBottom: 8,
                    opacity: task.completedAt ? 0.5 : 1,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: cs.text, fontSize: 14, fontWeight: '400', textDecorationLine: task.completedAt ? 'line-through' : 'none' }}>
                      {task.title}
                    </Text>
                    {goal && (
                      <Text style={{ color: cs.accent, fontSize: 11, fontWeight: '400', marginTop: 3 }} numberOfLines={1}>
                        {goal.title}
                      </Text>
                    )}
                  </View>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: task.completedAt ? cs.accent : 'transparent',
                    borderWidth: 1.5, borderColor: cs.accent + '88',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {task.completedAt && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Time grid ───────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', paddingTop: 8 }}>

          {/* Left: hour labels */}
          <View style={{ width: TIME_COL_W, paddingLeft: 20 }}>
            {HOURS.map((h, i) => (
              <View key={h} style={{ height: HOUR_HEIGHT, justifyContent: 'flex-start', paddingTop: 0 }}>
                {/* Only show label, not for the last hour which is just a terminal line */}
                {i < HOURS.length - 1 && (
                  <Text style={{
                    color: theme.colors.textMuted,
                    fontSize: 10,
                    fontWeight: '400',
                    lineHeight: 12,
                    marginTop: -6,
                  }}>
                    {formatHour(h)}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Right: grid + blocks */}
          <View style={{ flex: 1, paddingRight: 20, position: 'relative', height: GRID_H + HOUR_HEIGHT }}>

            {/* Hour lines */}
            {HOURS.map((h, i) => (
              <View
                key={h}
                style={{
                  position: 'absolute',
                  top: i * HOUR_HEIGHT,
                  left: 0, right: 0,
                  height: 1,
                  backgroundColor: theme.colors.border,
                  opacity: 0.7,
                }}
              />
            ))}

            {/* Half-hour lines (subtle) */}
            {HOURS.slice(0, -1).map((h, i) => (
              <View
                key={`half-${h}`}
                style={{
                  position: 'absolute',
                  top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                  left: 0, right: 0,
                  height: 1,
                  backgroundColor: theme.colors.border,
                  opacity: 0.35,
                }}
              />
            ))}

            {/* ── Current time indicator ─────────────────────────────── */}
            {isToday && (() => {
              const top = nowToTop();
              if (top < 0 || top > GRID_H) return null;
              return (
                <View
                  style={{
                    position: 'absolute',
                    top,
                    left: -6,
                    right: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  <View style={{
                    width: 10, height: 10, borderRadius: 5,
                    backgroundColor: theme.colors.primary,
                  }} />
                  <View style={{
                    flex: 1, height: 1.5,
                    backgroundColor: theme.colors.primary,
                  }} />
                </View>
              );
            })()}

            {/* ── Task blocks ───────────────────────────────────────── */}
            {scheduled.map(task => {
              const goal = goals.find(g => g.id === task.goalId);
              const cs   = catStyle(goal?.category);
              const mins = task.estimatedMinutes ?? 30;

              const startM = timeToMinutes(task.scheduledTime!);
              const topPx  = ((startM - START_HOUR * 60) / 60) * HOUR_HEIGHT;
              const heightPx = Math.max(48, (mins / 60) * HOUR_HEIGHT);

              // Clamp to grid bounds
              if (topPx < 0 || topPx > GRID_H) return null;

              const isCompleted = !!task.completedAt;

              return (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => handleComplete(task)}
                  onLongPress={() => handleReschedule(task)}
                  activeOpacity={0.78}
                  style={{
                    position: 'absolute',
                    top: topPx + 2,
                    left: 6,
                    right: 0,
                    height: heightPx - 4,
                    backgroundColor: isCompleted ? theme.colors.surfaceAlt : cs.bg,
                    borderRadius: 12,
                    padding: 10,
                    opacity: isCompleted ? 0.55 : 1,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: isCompleted ? theme.colors.border : cs.accent + '30',
                  }}
                >
                  {/* Title */}
                  <Text
                    style={{
                      color: isCompleted ? theme.colors.textMuted : cs.text,
                      fontSize: 13,
                      fontWeight: '400',
                      lineHeight: 18,
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                    }}
                    numberOfLines={heightPx > 60 ? 2 : 1}
                  >
                    {task.title}
                  </Text>

                  {/* Goal / project name */}
                  {goal && heightPx > 46 && (
                    <Text
                      style={{
                        color: isCompleted ? theme.colors.textMuted : cs.accent,
                        fontSize: 10,
                        fontWeight: '400',
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {goal.title}
                    </Text>
                  )}

                  {/* Time label for taller blocks */}
                  {heightPx > 72 && task.scheduledEndTime && (
                    <Text style={{
                      position: 'absolute',
                      bottom: 8, right: 10,
                      color: cs.accent,
                      fontSize: 10,
                      fontWeight: '400',
                    }}>
                      {to12h(task.scheduledTime!)} – {to12h(task.scheduledEndTime)}
                    </Text>
                  )}

                  {/* Check badge in corner */}
                  {isCompleted && (
                    <View style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 18, height: 18, borderRadius: 9,
                      backgroundColor: cs.accent + '33',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ color: cs.accent, fontSize: 10 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

          </View>
        </View>

        {/* ── Empty day ───────────────────────────────────────────────── */}
        {rawTasks.length === 0 && (
          <View style={{
            marginHorizontal: 20, marginTop: -GRID_H / 2,
            alignItems: 'center', paddingVertical: 40,
          }}>
            <Text style={{ fontSize: 34, marginBottom: 12 }}>{isToday ? '✨' : '📅'}</Text>
            <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '500', marginBottom: 6, textAlign: 'center' }}>
              {isToday ? 'Nothing scheduled today' : 'No tasks this day'}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
              {isToday
                ? 'Add a goal and Surgo will schedule\ntasks at your preferred time.'
                : 'Tasks from your goals will appear\nhere when scheduled.'}
            </Text>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 48 }} />

      </ScrollView>
    </SafeAreaView>
  );
}
