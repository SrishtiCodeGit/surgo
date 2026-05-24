import { View, Text, ScrollView, Dimensions } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText, Line } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useStreakStore } from '@/stores/streakStore';
import { useGoalStore } from '@/stores/goalStore';
import { StreakDay, ThemeKey } from '@/types';
import { WelcomeMascot } from '@/components/ui/WelcomeMascot';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 40;

// ─── Design tokens ────────────────────────────────────────────────────────────

const D = {
  dark:    '#1C1C1E',
  muted:   '#999999',
  light:   '#F5F5F5',
  border:  'rgba(0,0,0,0.07)',
  green:   '#22C55E',
  orange:  '#F59E0B',
  purple:  '#A78BFA',
  missed:  '#EBEBEB',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: string, primary: string) {
  if (status === 'completed') return D.green;
  if (status === 'frozen')    return D.purple;
  if (status === 'missed')    return D.orange;
  return D.missed;
}

function getLast7(history: StreakDay[]) {
  const days: (StreakDay | null)[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found   = history.find(h => h.date === dateStr) ?? null;
    days.push(found ? found : { date: dateStr, status: 'empty' as any, tasksCompleted: 0, tasksTotal: 0 });
  }
  return days;
}

function getLast30(history: StreakDay[]) {
  const days: (StreakDay | null)[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found   = history.find(h => h.date === dateStr) ?? null;
    days.push(found ?? { date: dateStr, status: 'empty' as any, tasksCompleted: 0, tasksTotal: 0 });
  }
  return days;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Streak ring ─────────────────────────────────────────────────────────────

function StreakRing({
  current, longest, primary, themeKey,
}: { current: number; longest: number; primary: string; themeKey: ThemeKey }) {
  const size     = 210;
  const sw       = 18;
  const r        = (size - sw) / 2;
  const circ     = 2 * Math.PI * r;
  const pct      = longest > 0 ? Math.min(current / longest, 1) : current > 0 ? 1 : 0;
  const offset   = circ * (1 - pct);
  const mascotSz = 112;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Ring track */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={D.missed} strokeWidth={sw} fill="none"
        />
        {/* Ring progress arc */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={current > 0 ? primary : D.missed}
          strokeWidth={sw} fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
      </Svg>

      {/* Surgo + fire — centred inside rings */}
      <View style={{
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* 🔥 flames above Surgo's head */}
        <Text style={{
          fontSize: 38,
          marginBottom: -18,
          zIndex: 2,
          textAlign: 'center',
        }}>
          🔥
        </Text>

        {/* Surgo mascot */}
        <WelcomeMascot themeKey={themeKey} size={mascotSz} pose="motivating" />

        {/* Streak count below mascot */}
        <Text style={{
          color: D.dark,
          fontSize: 15,
          fontWeight: '800',
          letterSpacing: -0.4,
          marginTop: -10,
        }}>
          {current} {current === 1 ? 'day' : 'days'}
        </Text>
      </View>
    </View>
  );
}

// ─── Completion rate mini-ring ────────────────────────────────────────────────

function RateRing({ rate, primary }: { rate: number; primary: string }) {
  const size  = 64;
  const sw    = 7;
  const r     = (size - sw) / 2;
  const circ  = 2 * Math.PI * r;
  const offset = circ * (1 - rate / 100);

  return (
    <Svg width={size} height={size}>
      <Circle cx={size/2} cy={size/2} r={r} stroke={D.missed} strokeWidth={sw} fill="none" />
      <Circle cx={size/2} cy={size/2} r={r}
        stroke={primary} strokeWidth={sw} fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size/2},${size/2}`}
      />
      <SvgText
        x={size/2} y={size/2 + 4.5}
        textAnchor="middle"
        fontSize="13" fontWeight="700"
        fill={D.dark}
      >
        {rate}%
      </SvgText>
    </Svg>
  );
}

// ─── 7-day bar chart ─────────────────────────────────────────────────────────

function WeekChart({ days, primary }: { days: (StreakDay | null)[]; primary: string }) {
  const chartH = 90;
  const barW   = 28;
  const gap    = (CARD_W - 40 - 7 * barW) / 6;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartH, gap }}>
        {days.map((day, i) => {
          const status = (day as any)?.status ?? 'empty';
          const pct    = status === 'completed'
            ? (day!.tasksTotal > 0 ? day!.tasksCompleted / day!.tasksTotal : 1)
            : status === 'frozen' ? 0.5
            : 0.06;
          const barH   = Math.max(chartH * pct, 5);
          const color  =
            status === 'completed' ? primary
            : status === 'frozen'  ? D.purple
            : status === 'missed'  ? D.orange
            : D.missed;

          return (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{
                width: barW, height: barH,
                backgroundColor: color,
                borderRadius: 8,
              }} />
            </View>
          );
        })}
      </View>

      {/* Day labels */}
      <View style={{ flexDirection: 'row', gap, marginTop: 8 }}>
        {days.map((day, i) => {
          const date = day ? new Date(day.date + 'T00:00:00') : new Date();
          const label = date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
          const isToday = day?.date === new Date().toISOString().split('T')[0];
          return (
            <View key={i} style={{ width: barW, alignItems: 'center' }}>
              <Text style={{
                color: isToday ? primary : D.muted,
                fontSize: 10,
                fontWeight: isToday ? '800' : '500',
              }}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── 30-day heatmap ───────────────────────────────────────────────────────────

function Heatmap({ days, primary }: { days: (StreakDay | null)[]; primary: string }) {
  const cellSize = Math.floor((CARD_W - 40 - 9 * 4) / 10);

  return (
    <View>
      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { color: D.green,  label: 'Completed' },
          { color: D.orange, label: 'Missed'    },
          { color: D.purple, label: 'Frozen'    },
          { color: D.missed, label: 'No data'   },
        ].map(l => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: l.color }} />
            <Text style={{ color: D.muted, fontSize: 10, fontWeight: '500' }}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Grid — 10 cols × 3 rows */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {days.map((day, i) => {
          const status = (day as any)?.status ?? 'empty';
          const color  =
            status === 'completed' ? D.green
            : status === 'missed'  ? D.orange
            : status === 'frozen'  ? D.purple
            : D.missed;
          const isToday = day?.date === new Date().toISOString().split('T')[0];
          return (
            <View
              key={i}
              style={{
                width: cellSize, height: cellSize,
                borderRadius: 4,
                backgroundColor: color,
                borderWidth: isToday ? 2 : 0,
                borderColor: D.dark,
              }}
            />
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ color: D.muted, fontSize: 10 }}>30 days ago</Text>
        <Text style={{ color: D.muted, fontSize: 10 }}>Today</Text>
      </View>
    </View>
  );
}

// ─── Surgo chart pointer banner ──────────────────────────────────────────────

function SurgoChartBanner({
  themeKey,
}: {
  themeKey: 'soft' | 'balanced' | 'hardcore';
  primary: string;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 6,
      paddingHorizontal: 4,
    }}>
      {/* Mascot with 📊 peeking out behind from the right */}
      <View style={{ width: 90, height: 90 }}>
        {/* 📊 sits behind Surgo — rendered first so mascot paints over it */}
        <Text style={{
          position: 'absolute',
          right: -16,
          bottom: 6,
          fontSize: 42,
          opacity: 0.88,
          zIndex: 0,
        }}>
          📊
        </Text>
        <WelcomeMascot themeKey={themeKey} size={90} pose="happy" />
      </View>

      {/* Speech bubble */}
      <View style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        padding: 14,
        marginLeft: 10,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
      }}>
        {/* Bubble tail pointing left toward Surgo */}
        <View style={{
          position: 'absolute',
          left: -7,
          bottom: 18,
          width: 0, height: 0,
          borderTopWidth: 7,
          borderTopColor: 'transparent',
          borderBottomWidth: 7,
          borderBottomColor: 'transparent',
          borderRightWidth: 7,
          borderRightColor: '#FFFFFF',
        }} />
        <Text style={{
          color: D.dark,
          fontSize: 13,
          fontWeight: '800',
          lineHeight: 19,
          letterSpacing: -0.2,
        }}>
          See your progress here!
        </Text>
        <Text style={{
          color: D.muted,
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
          lineHeight: 16,
        }}>
          Look how far you've come ✨
        </Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const { theme, themeKey }                    = useTheme();
  const { streak, isLoaded, loadStreak }       = useStreakStore();
  const { goals, isLoaded: goalsLoaded, load } = useGoalStore();

  useEffect(() => { if (!isLoaded)    loadStreak('local'); }, []);
  useEffect(() => { if (!goalsLoaded) load(); }, []);

  const s           = streak;
  const history     = s?.history ?? [];
  const current     = s?.currentStreak ?? 0;
  const longest     = s?.longestStreak ?? 0;
  const totalDays   = history.length;
  const completed   = history.filter(d => d.status === 'completed').length;
  const missed      = history.filter(d => d.status === 'missed').length;
  const frozen      = history.filter(d => d.status === 'frozen').length;
  const rate        = totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0;
  const activeGoals = goals.filter(g => g.isActive).length;
  const primary     = theme.colors.primary;

  const last7  = getLast7(history);
  const last30 = getLast30(history);

  const card = (children: React.ReactNode, mb = 12) => (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      marginBottom: mb,
      borderWidth: 1, borderColor: D.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    }}>
      {children}
    </View>
  );

  const cardTitle = (title: string) => (
    <Text style={{
      color: D.dark, fontSize: 15, fontWeight: '700',
      letterSpacing: -0.2, marginBottom: 16,
    }}>
      {title}
    </Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: D.dark, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
            Progress
          </Text>
          <Text style={{ color: D.muted, fontSize: 12, marginTop: 3, fontWeight: '500' }}>
            Your consistency story at a glance
          </Text>
        </View>

        {/* ── Streak ring ───────────────────────────────────────────── */}
        {card(
          <View style={{ alignItems: 'center' }}>
            <StreakRing current={current} longest={longest} primary={primary} themeKey={themeKey} />
            <View style={{ flexDirection: 'row', gap: 28, marginTop: 16 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: D.dark, fontSize: 20, fontWeight: '800' }}>{longest}</Text>
                <Text style={{ color: D.muted, fontSize: 11, marginTop: 2 }}>Best streak</Text>
              </View>
              <View style={{ width: 1, backgroundColor: D.border }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: D.dark, fontSize: 20, fontWeight: '800' }}>{s?.totalCheckIns ?? 0}</Text>
                <Text style={{ color: D.muted, fontSize: 11, marginTop: 2 }}>Total check-ins</Text>
              </View>
              <View style={{ width: 1, backgroundColor: D.border }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: D.dark, fontSize: 20, fontWeight: '800' }}>{activeGoals}</Text>
                <Text style={{ color: D.muted, fontSize: 11, marginTop: 2 }}>Active goals</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Surgo pointing at chart ───────────────────────────────── */}
        <SurgoChartBanner themeKey={themeKey} primary={primary} />

        {/* ── 7-day bar chart ───────────────────────────────────────── */}
        {card(
          <>
            {cardTitle('Last 7 Days')}
            <WeekChart days={last7} primary={primary} />
          </>
        )}

        {/* ── 30-day heatmap ────────────────────────────────────────── */}
        {card(
          <>
            {cardTitle('30-Day Activity')}
            <Heatmap days={last30} primary={primary} />
          </>
        )}

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          {/* Completion rate */}
          <View style={{
            flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18,
            alignItems: 'center', borderWidth: 1, borderColor: D.border,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
          }}>
            <RateRing rate={rate} primary={primary} />
            <Text style={{ color: D.dark, fontSize: 12, fontWeight: '700', marginTop: 8 }}>
              Completion
            </Text>
          </View>

          {/* Breakdown */}
          <View style={{
            flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18,
            borderWidth: 1, borderColor: D.border,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
            justifyContent: 'center', gap: 10,
          }}>
            {[
              { label: 'Completed', value: completed, color: D.green  },
              { label: 'Missed',    value: missed,    color: D.orange },
              { label: 'Frozen',    value: frozen,    color: D.purple },
            ].map(item => (
              <View key={item.label}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: D.muted, fontSize: 11, fontWeight: '500' }}>{item.label}</Text>
                  <Text style={{ color: D.dark, fontSize: 11, fontWeight: '700' }}>{item.value}d</Text>
                </View>
                <View style={{ height: 4, backgroundColor: D.missed, borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{
                    width: `${totalDays > 0 ? (item.value / totalDays) * 100 : 0}%`,
                    height: 4, backgroundColor: item.color, borderRadius: 2,
                  }} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Freeze cards remaining ────────────────────────────────── */}
        {card(
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: '#EEF2FF',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 22 }}>❄️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: D.dark, fontWeight: '700', fontSize: 14 }}>
                Freeze Cards
              </Text>
              <Text style={{ color: D.muted, fontSize: 12, marginTop: 2 }}>
                {s?.freezeCardsAvailable ?? 0} card{s?.freezeCardsAvailable !== 1 ? 's' : ''} available to protect your streak
              </Text>
            </View>
            <Text style={{ color: primary, fontSize: 28, fontWeight: '800' }}>
              {s?.freezeCardsAvailable ?? 0}
            </Text>
          </View>
        , 0)}

      </ScrollView>
    </SafeAreaView>
  );
}
