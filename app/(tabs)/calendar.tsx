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

// ─── Grid constants ───────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const HOUR_H      = 80;
const START_HOUR  = 6;
const END_HOUR    = 22;
const TIME_COL_W  = 58;
const GRID_H      = (END_HOUR - START_HOUR) * HOUR_H;
const HOURS       = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const DAY_LETTERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ─── Category colours ─────────────────────────────────────────────────────────

const CAT: Record<string, { bg: string; bar: string; title: string; sub: string }> = {
  fitness:       { bg: '#FFF7ED', bar: '#F97316', title: '#92400E', sub: '#FB923C' },
  career:        { bg: '#F0F0FF', bar: '#6366F1', title: '#3730A3', sub: '#818CF8' },
  learning:      { bg: '#E0F7FF', bar: '#0EA5E9', title: '#075985', sub: '#38BDF8' },
  finance:       { bg: '#F0FDF4', bar: '#22C55E', title: '#14532D', sub: '#4ADE80' },
  health:        { bg: '#FFF0F7', bar: '#EC4899', title: '#831843', sub: '#F472B6' },
  relationships: { bg: '#FFF1F2', bar: '#F43F5E', title: '#9F1239', sub: '#FB7185' },
  creativity:    { bg: '#FAF0FF', bar: '#A855F7', title: '#581C87', sub: '#C084FC' },
  other:         { bg: '#F8FAFC', bar: '#94A3B8', title: '#334155', sub: '#94A3B8' },
};
function cs(cat?: string) { return CAT[cat ?? 'other'] ?? CAT.other; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const addMins = (t: string, n: number) => {
  const tot = toMins(t) + n;
  return `${String(Math.floor(tot / 60) % 24).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`;
};
const nowTop = () => {
  const d = new Date();
  return ((d.getHours() * 60 + d.getMinutes() - START_HOUR * 60) / 60) * HOUR_H;
};
const getWeek = (anchor: Date) => {
  const day = anchor.getDay();
  const mon = new Date(anchor);
  mon.setDate(anchor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
};

const SLOTS = [
  { label: 'Morning', icon: '🌅', t: '06:00' },
  { label: 'Midday',  icon: '☀️', t: '12:00' },
  { label: 'Evening', icon: '🌆', t: '17:00' },
  { label: 'Night',   icon: '🌙', t: '20:00' },
];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return now;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { goals, isLoaded, load, getTasksForDate, completeTask, uncompleteTask, rescheduleTask } = useGoalStore();

  const now      = useClock();
  const todayStr = toDateString(new Date());
  const [sel, setSel]         = useState(new Date());
  const [anchor, setAnchor]   = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const selStr  = toDateString(sel);
  const isToday = selStr === todayStr;
  const week    = getWeek(anchor);

  useEffect(() => { if (!isLoaded) load(); }, []);

  useEffect(() => {
    if (isToday) {
      const y = Math.max(0, nowTop() - HOUR_H * 2);
      setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 350);
    }
  }, [isToday]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);

  const dayTasks = getTasksForDate(selStr);
  const sched    = [...dayTasks.filter(t =>  t.scheduledTime)].sort((a,b) => toMins(a.scheduledTime!) - toMins(b.scheduledTime!));
  const unsched  = dayTasks.filter(t => !t.scheduledTime);
  const doneCount = dayTasks.filter(t => !!t.completedAt).length;

  const handleComplete  = async (t: Task) => { t.completedAt ? await uncompleteTask(t.id) : await completeTask(t.id); };
  const handleReschedule = (t: Task) => Alert.alert('Reschedule', t.title, [
    { text: 'Cancel', style: 'cancel' },
    ...SLOTS.map(s => ({ text: `${s.icon} ${s.label}`, onPress: () => rescheduleTask(t.id, s.t, addMins(s.t, t.estimatedMinutes ?? 30)) })),
  ]);

  const clockStr   = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const selLabel   = sel.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const progress   = dayTasks.length > 0 ? doneCount / dayTasks.length : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>

      {/* ── Fixed top section ─────────────────────────────────────────── */}
      <View style={{
        backgroundColor: theme.colors.background,
        paddingBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
      }}>

        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 4 }}>
          <View>
            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '600', letterSpacing: -0.3 }}>
              Calendar
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '400', marginTop: 2 }}>
              {selLabel}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {/* Live clock */}
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '300', letterSpacing: 1 }}>
              {clockStr}
            </Text>
            {/* Today pill */}
            {!isToday && (
              <TouchableOpacity
                onPress={() => { setSel(new Date()); setAnchor(new Date()); }}
                style={{ backgroundColor: theme.colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
              >
                <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '500' }}>Go to Today</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Day progress strip */}
        {dayTasks.length > 0 && (
          <View style={{ paddingHorizontal: 22, paddingBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '400' }}>
                {doneCount} of {dayTasks.length} tasks done
              </Text>
              <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '400' }}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <View style={{ height: 3, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ height: 3, borderRadius: 2, backgroundColor: theme.colors.primary, width: `${progress * 100}%` }} />
            </View>
          </View>
        )}

        {/* ── Week strip ─────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 22, paddingBottom: 14 }}>
          {/* Week nav */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <TouchableOpacity onPress={() => { const d = new Date(anchor); d.setDate(d.getDate()-7); setAnchor(d); }} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18l-6-6 6-6" stroke={theme.colors.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4 }}>
              {DAY_LETTERS.map((l, i) => (
                <Text key={i} style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '400', width: 34, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {l}
                </Text>
              ))}
            </View>
            <TouchableOpacity onPress={() => { const d = new Date(anchor); d.setDate(d.getDate()+7); setAnchor(d); }} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M9 18l6-6-6-6" stroke={theme.colors.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Date buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {week.map((d, i) => {
              const ds          = toDateString(d);
              const isSel       = ds === selStr;
              const isCurDay    = ds === todayStr;
              const dt          = getTasksForDate(ds);
              const hasAny      = dt.length > 0;
              const allDone     = hasAny && dt.every(t => !!t.completedAt);

              return (
                <TouchableOpacity key={ds} onPress={() => setSel(d)} activeOpacity={0.72} style={{ alignItems: 'center', width: 34 }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: isSel ? theme.colors.primary : isCurDay ? theme.colors.primaryLight : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: isCurDay && !isSel ? 1 : 0,
                    borderColor: theme.colors.primary + '60',
                  }}>
                    <Text style={{
                      fontSize: 14, lineHeight: 16,
                      fontWeight: isSel ? '600' : isCurDay ? '500' : '400',
                      color: isSel ? '#fff' : isCurDay ? theme.colors.primary : theme.colors.text,
                    }}>
                      {d.getDate()}
                    </Text>
                  </View>
                  {/* Activity dot */}
                  <View style={{ height: 5, marginTop: 4, alignItems: 'center' }}>
                    {hasAny && (
                      <View style={{
                        width: 4, height: 4, borderRadius: 2,
                        backgroundColor: allDone ? theme.colors.primary : theme.colors.primary + '50',
                      }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Scrollable body ───────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── Unscheduled tasks ──────────────────────────────────────── */}
        {unsched.length > 0 && (
          <View style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 6 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
              Not yet scheduled
            </Text>
            {unsched.map(task => {
              const goal = goals.find(g => g.id === task.goalId);
              const c    = cs(goal?.category);
              return (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => handleComplete(task)}
                  onLongPress={() => handleReschedule(task)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: c.bg,
                    borderRadius: 14, marginBottom: 8,
                    flexDirection: 'row', alignItems: 'center',
                    overflow: 'hidden', opacity: task.completedAt ? 0.5 : 1,
                    shadowColor: c.bar, shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.10, shadowRadius: 6, elevation: 2,
                  }}
                >
                  <View style={{ width: 4, backgroundColor: c.bar, alignSelf: 'stretch' }} />
                  <View style={{ flex: 1, padding: 14 }}>
                    <Text style={{ color: c.title, fontSize: 14, fontWeight: '400', textDecorationLine: task.completedAt ? 'line-through' : 'none' }}>
                      {task.title}
                    </Text>
                    {goal && (
                      <Text style={{ color: c.sub, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{goal.title}</Text>
                    )}
                  </View>
                  {/* Checkbox */}
                  <View style={{
                    width: 22, height: 22, borderRadius: 11, marginRight: 14,
                    backgroundColor: task.completedAt ? c.bar : 'transparent',
                    borderWidth: 1.5, borderColor: c.bar + '70',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {task.completedAt && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Time grid ──────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', paddingTop: 10 }}>

          {/* Hour labels */}
          <View style={{ width: TIME_COL_W, paddingLeft: 22 }}>
            {HOURS.slice(0, -1).map((h, i) => (
              <View key={h} style={{ height: HOUR_H, paddingTop: 0, justifyContent: 'flex-start' }}>
                <Text style={{
                  color: theme.colors.textMuted,
                  fontSize: 9.5,
                  fontWeight: '400',
                  letterSpacing: 0.2,
                  marginTop: -5,
                  opacity: 0.75,
                }}>
                  {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid area */}
          <View style={{ flex: 1, paddingRight: 22, position: 'relative', height: GRID_H }}>

            {/* Hour dividers */}
            {HOURS.map((_, i) => (
              <View key={i} style={{
                position: 'absolute', top: i * HOUR_H, left: 0, right: 0,
                height: 1, backgroundColor: theme.colors.border, opacity: 0.6,
              }} />
            ))}

            {/* Half-hour dividers */}
            {HOURS.slice(0, -1).map((_, i) => (
              <View key={`h${i}`} style={{
                position: 'absolute', top: i * HOUR_H + HOUR_H / 2, left: 0, right: 0,
                height: 1, backgroundColor: theme.colors.border, opacity: 0.25,
              }} />
            ))}

            {/* ── Current time line ────────────────────────────────── */}
            {isToday && (() => {
              const top = nowTop();
              if (top < 0 || top > GRID_H) return null;
              return (
                <View style={{ position: 'absolute', top, left: -8, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 20 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.primary, marginRight: -1 }} />
                  <View style={{ flex: 1, height: 1.5, backgroundColor: theme.colors.primary, opacity: 0.8 }} />
                </View>
              );
            })()}

            {/* ── Scheduled task blocks ─────────────────────────── */}
            {sched.map(task => {
              const goal  = goals.find(g => g.id === task.goalId);
              const c     = cs(goal?.category);
              const mins  = task.estimatedMinutes ?? 30;
              const startM = toMins(task.scheduledTime!);
              const top    = ((startM - START_HOUR * 60) / 60) * HOUR_H;
              const h      = Math.max(44, (mins / 60) * HOUR_H);
              if (top < 0 || top > GRID_H) return null;
              const done   = !!task.completedAt;

              return (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => handleComplete(task)}
                  onLongPress={() => handleReschedule(task)}
                  activeOpacity={0.8}
                  style={{
                    position: 'absolute',
                    top: top + 2, left: 4, right: 4,
                    height: h - 4,
                    borderRadius: 14,
                    overflow: 'hidden',
                    opacity: done ? 0.5 : 1,
                    backgroundColor: done ? theme.colors.surfaceAlt : c.bg,
                    shadowColor: c.bar,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: done ? 0 : 0.12,
                    shadowRadius: 6,
                    elevation: done ? 0 : 3,
                    flexDirection: 'row',
                  }}
                >
                  {/* Left colour bar */}
                  <View style={{ width: 3.5, backgroundColor: done ? theme.colors.textMuted : c.bar }} />

                  {/* Content */}
                  <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'center' }}>
                    <Text style={{
                      color: done ? theme.colors.textMuted : c.title,
                      fontSize: 13, fontWeight: '400', lineHeight: 17,
                      textDecorationLine: done ? 'line-through' : 'none',
                    }} numberOfLines={h > 58 ? 2 : 1}>
                      {task.title}
                    </Text>

                    {goal && h > 46 && (
                      <Text style={{ color: done ? theme.colors.textMuted : c.sub, fontSize: 10, marginTop: 2 }} numberOfLines={1}>
                        {goal.title}
                      </Text>
                    )}

                    {/* Time range on tall blocks */}
                    {h > 70 && task.scheduledEndTime && (
                      <Text style={{ color: c.sub, fontSize: 9, marginTop: 4 }}>
                        {fmt12(task.scheduledTime!)} – {fmt12(task.scheduledEndTime)}
                      </Text>
                    )}
                  </View>

                  {/* Done check */}
                  {done && (
                    <View style={{ justifyContent: 'center', paddingRight: 10 }}>
                      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.bar + '30', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: c.bar, fontSize: 9 }}>✓</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

          </View>
        </View>

        {/* ── Empty state ────────────────────────────────────────────── */}
        {dayTasks.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 56, paddingHorizontal: 40 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: theme.colors.primaryLight,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 18,
            }}>
              <Text style={{ fontSize: 32 }}>{isToday ? '✨' : '📅'}</Text>
            </View>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '500', marginBottom: 8, textAlign: 'center' }}>
              {isToday ? 'Nothing scheduled today' : 'Free day'}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, fontWeight: '400' }}>
              {isToday
                ? 'Create a goal and pick your preferred time — Surgo will fill this calendar.'
                : 'No tasks are scheduled here. Enjoy the free time!'}
            </Text>
          </View>
        )}

        {/* Hint */}
        {dayTasks.length > 0 && (
          <Text style={{ textAlign: 'center', color: theme.colors.textMuted, fontSize: 10, fontWeight: '400', marginTop: 20, letterSpacing: 0.3 }}>
            Tap to complete  ·  Hold to reschedule
          </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
