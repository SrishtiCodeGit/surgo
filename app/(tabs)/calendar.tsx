import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, RefreshControl, Dimensions, Modal, KeyboardAvoidingView,
  Platform, Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Defs, Pattern, Line } from 'react-native-svg';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useGoalStore } from '@/stores/goalStore';
import { useBlockedSlotStore } from '@/stores/blockedSlotStore';
import { Task, Goal, BlockedSlot, BlockedRepeat } from '@/types';
import { toDateString } from '@/lib/streak';
import { WelcomeMascot } from '@/components/ui/WelcomeMascot';

// ─── Grid constants ───────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const HOUR_H     = 80;
const START_HOUR = 6;
const END_HOUR   = 22;
const TIME_COL_W = 58;
const GRID_H     = (END_HOUR - START_HOUR) * HOUR_H;
const HOURS      = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ─── Category colours ─────────────────────────────────────────────────────────

const CAT: Record<string, { bg: string; bar: string; title: string; sub: string }> = {
  fitness:       { bg:'#FFF7ED', bar:'#FB923C', title:'#9A3412', sub:'#FDBA74' },
  career:        { bg:'#EEF2FF', bar:'#818CF8', title:'#3730A3', sub:'#A5B4FC' },
  learning:      { bg:'#E0F2FE', bar:'#38BDF8', title:'#0C4A6E', sub:'#7DD3FC' },
  finance:       { bg:'#ECFDF5', bar:'#34D399', title:'#065F46', sub:'#6EE7B7' },
  health:        { bg:'#FDF2F8', bar:'#F472B6', title:'#831843', sub:'#F9A8D4' },
  relationships: { bg:'#FFF1F2', bar:'#FB7185', title:'#881337', sub:'#FDA4AF' },
  creativity:    { bg:'#FAF5FF', bar:'#C084FC', title:'#6B21A8', sub:'#D8B4FE' },
  other:         { bg:'#F8FAFC', bar:'#94A3B8', title:'#475569', sub:'#CBD5E1' },
};
const cs = (cat?: string) => CAT[cat ?? 'other'] ?? CAT.other;

// ─── Blocked-slot accent colours ─────────────────────────────────────────────

const SLOT_PRESETS: { emoji: string; label: string; color: string }[] = [
  { emoji:'🏢', label:'Office',  color:'#6366F1' },
  { emoji:'🏋️', label:'Gym',     color:'#F97316' },
  { emoji:'🏫', label:'School',  color:'#0EA5E9' },
  { emoji:'😴', label:'Sleep',   color:'#8B5CF6' },
  { emoji:'🍽️', label:'Meals',   color:'#22C55E' },
  { emoji:'✈️', label:'Travel',  color:'#F43F5E' },
  { emoji:'👨‍👩‍👧', label:'Family',  color:'#EC4899' },
  { emoji:'🏠', label:'Home',    color:'#94A3B8' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const toMins = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const addMins = (t: string, n: number) => {
  const tot = toMins(t)+n;
  return `${String(Math.floor(tot/60)%24).padStart(2,'0')}:${String(tot%60).padStart(2,'0')}`;
};
const hrLabel = (h: number) =>
  h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`;
const nowTop = () => {
  const d = new Date();
  return ((d.getHours()*60 + d.getMinutes() - START_HOUR*60) / 60) * HOUR_H;
};
const getWeek = (anchor: Date) => {
  const dow = anchor.getDay();
  const mon = new Date(anchor);
  mon.setDate(anchor.getDate() - ((dow+6)%7));
  return Array.from({length:7},(_,i) => { const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
};

const RESCHEDULE_SLOTS = [
  {label:'Morning', icon:'🌅', t:'06:00'},
  {label:'Midday',  icon:'☀️', t:'12:00'},
  {label:'Evening', icon:'🌆', t:'17:00'},
  {label:'Night',   icon:'🌙', t:'20:00'},
];

// ─── Surgo calendar-load analysis ────────────────────────────────────────────

function getLoadAnalysis(
  tasks: Task[],
  blocked: BlockedSlot[],
  themeKey: string,
): { show: boolean; pose: any; headline: string; sub: string } | null {
  const totalDayMins = (END_HOUR - START_HOUR) * 60;
  const blockedMins  = blocked.reduce((s, b) => s + Math.max(0, toMins(b.endTime) - toMins(b.startTime)), 0);
  const freeMins     = Math.max(1, totalDayMins - blockedMins);
  const taskMins     = tasks.reduce((s, t) => s + (t.estimatedMinutes ?? 30), 0);
  const ratio        = taskMins / freeMins;
  const taskCount    = tasks.length;

  const overloaded = ratio > 0.65 || taskCount > 5;
  const veryFull   = ratio > 0.85 || taskCount > 7;

  if (!overloaded) return null;

  if (themeKey === 'hardcore') {
    return {
      show: true,
      pose: 'motivating',
      headline: veryFull ? 'Maximum load. Let\'s go.' : 'Calendar\'s stacked.',
      sub: 'You said hardcore. Are you ready to lock in and execute every single one of these? No excuses.',
    };
  }

  if (themeKey === 'soft') {
    return {
      show: true,
      pose: 'sad',
      headline: veryFull ? 'This is a lot, friend.' : 'Your day looks very full.',
      sub: 'You deserve rest too. Doing fewer things with full attention beats rushing through everything. What can wait until tomorrow? 🌸',
    };
  }

  // balanced
  return {
    show: true,
    pose: 'motivating',
    headline: veryFull ? 'Your calendar is maxed out.' : 'Pretty packed day ahead.',
    sub: 'Focus beats multitasking every time. Pick your top 3 priorities and protect your energy — push the rest to tomorrow.',
  };
}

// ─── Live clock hook ──────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return now;
}

// ─── Add-blocked-slot bottom sheet ───────────────────────────────────────────

const HOURS_PICK = Array.from({length: END_HOUR - START_HOUR + 1}, (_, i) => i + START_HOUR);
const MINUTES_PICK = [0, 15, 30, 45];
const REPEAT_OPTS: {key: BlockedRepeat; label: string}[] = [
  {key:'daily',    label:'Every day'},
  {key:'weekdays', label:'Weekdays'},
  {key:'weekends', label:'Weekends'},
];

function AddSlotSheet({
  visible, onClose, onSave, theme, themeKey,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (s: Omit<BlockedSlot,'id'>) => void;
  theme: any;
  themeKey: string;
}) {
  const [preset, setPreset]       = useState(SLOT_PRESETS[0]);
  const [label, setLabel]         = useState('');
  const [startH, setStartH]       = useState(9);
  const [startM, setStartM]       = useState(0);
  const [endH, setEndH]           = useState(17);
  const [endM, setEndM]           = useState(0);
  const [repeat, setRepeat]       = useState<BlockedRepeat>('weekdays');

  const handleSave = () => {
    const finalLabel = label.trim() || preset.label;
    const st = `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`;
    const et = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
    if (toMins(et) <= toMins(st)) {
      Alert.alert('Oops', 'End time must be after start time.'); return;
    }
    onSave({ label: finalLabel, emoji: preset.emoji, color: preset.color, startTime: st, endTime: et, repeat });
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: 24, paddingBottom: 40,
          shadowColor: '#000', shadowOffset: {width:0,height:-4},
          shadowOpacity: 0.12, shadowRadius: 20, elevation: 16,
        }}>
          {/* Handle bar */}
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 20 }} />

          <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '600', marginBottom: 18 }}>
            Block time on your calendar
          </Text>

          {/* Emoji/type presets */}
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SLOT_PRESETS.map((p) => {
                const isSel = preset.emoji === p.emoji;
                return (
                  <TouchableOpacity
                    key={p.emoji}
                    onPress={() => { setPreset(p); if (!label.trim()) setLabel(p.label); }}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
                      backgroundColor: isSel ? p.color + '20' : theme.colors.surfaceAlt,
                      borderWidth: 1.5, borderColor: isSel ? p.color : 'transparent',
                      alignItems: 'center', gap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
                    <Text style={{ color: isSel ? p.color : theme.colors.textMuted, fontSize: 10, fontWeight: isSel ? '500' : '400' }}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Label */}
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Label (optional)
          </Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder={preset.label}
            placeholderTextColor={theme.colors.textMuted}
            style={{
              backgroundColor: theme.colors.background,
              borderWidth: 1, borderColor: theme.colors.border,
              borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
              color: theme.colors.text, fontSize: 15, fontWeight: '400',
              marginBottom: 18,
            }}
          />

          {/* Time pickers */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 18 }}>
            {/* Start */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>From</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {HOURS_PICK.map(h => (
                    <TouchableOpacity key={h} onPress={() => setStartH(h)} style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: startH === h ? theme.colors.primary : theme.colors.surfaceAlt,
                    }}>
                      <Text style={{ color: startH === h ? '#fff' : theme.colors.text, fontSize: 11, fontWeight: '400' }}>
                        {hrLabel(h)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {MINUTES_PICK.map(m => (
                  <TouchableOpacity key={m} onPress={() => setStartM(m)} style={{
                    flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
                    backgroundColor: startM === m ? theme.colors.primary : theme.colors.surfaceAlt,
                  }}>
                    <Text style={{ color: startM === m ? '#fff' : theme.colors.text, fontSize: 11 }}>:{String(m).padStart(2,'0')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* End */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>To</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {HOURS_PICK.map(h => (
                    <TouchableOpacity key={h} onPress={() => setEndH(h)} style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: endH === h ? theme.colors.primary : theme.colors.surfaceAlt,
                    }}>
                      <Text style={{ color: endH === h ? '#fff' : theme.colors.text, fontSize: 11, fontWeight: '400' }}>
                        {hrLabel(h)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {MINUTES_PICK.map(m => (
                  <TouchableOpacity key={m} onPress={() => setEndM(m)} style={{
                    flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
                    backgroundColor: endM === m ? theme.colors.primary : theme.colors.surfaceAlt,
                  }}>
                    <Text style={{ color: endM === m ? '#fff' : theme.colors.text, fontSize: 11 }}>:{String(m).padStart(2,'0')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Repeat */}
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Repeats</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
            {REPEAT_OPTS.map(r => (
              <TouchableOpacity
                key={r.key}
                onPress={() => setRepeat(r.key)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                  backgroundColor: repeat === r.key ? theme.colors.primary : theme.colors.surfaceAlt,
                  borderWidth: 1, borderColor: repeat === r.key ? theme.colors.primary : 'transparent',
                }}
              >
                <Text style={{ color: repeat === r.key ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '400' }}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: theme.colors.primary, borderRadius: 16,
              paddingVertical: 16, alignItems: 'center',
              shadowColor: theme.colors.primary, shadowOffset: {width:0,height:4},
              shadowOpacity: 0.28, shadowRadius: 12, elevation: 6,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>
              Block this time
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main calendar screen ─────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { theme, themeKey } = useTheme();
  const { goals, isLoaded, load, getTasksForDate, completeTask, uncompleteTask, rescheduleTask } = useGoalStore();
  const { slots: allSlots, isLoaded: slotsLoaded, load: loadSlots, addSlot, removeSlot, getSlotsForDay } = useBlockedSlotStore();
  const insets = useSafeAreaInsets();

  const now      = useClock();
  const todayStr = toDateString(new Date());

  const [sel, setSel]             = useState(new Date());
  const [anchor, setAnchor]       = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const selStr  = toDateString(sel);
  const isToday = selStr === todayStr;
  const week    = getWeek(anchor);
  const selDow  = sel.getDay(); // 0=Sun

  useEffect(() => { if (!isLoaded) load(); }, []);
  useEffect(() => { if (!slotsLoaded) loadSlots(); }, []);

  useEffect(() => {
    if (isToday) {
      const y = Math.max(0, nowTop() - HOUR_H * 2);
      setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 350);
    }
  }, [isToday]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), loadSlots()]);
    setRefreshing(false);
  }, []);

  const dayTasks    = getTasksForDate(selStr);
  const blockedToday = getSlotsForDay(selDow);
  const sched       = [...dayTasks.filter(t => t.scheduledTime)].sort((a,b) => toMins(a.scheduledTime!) - toMins(b.scheduledTime!));
  const unsched     = dayTasks.filter(t => !t.scheduledTime);
  const doneCount   = dayTasks.filter(t => !!t.completedAt).length;
  const progress    = dayTasks.length > 0 ? doneCount / dayTasks.length : 0;

  const analysis = getLoadAnalysis(dayTasks, blockedToday, themeKey);

  const handleComplete   = async (t: Task) => { t.completedAt ? await uncompleteTask(t.id) : await completeTask(t.id); };
  const handleReschedule = (t: Task) => Alert.alert('Reschedule', t.title, [
    { text: 'Cancel', style: 'cancel' },
    ...RESCHEDULE_SLOTS.map(s => ({ text: `${s.icon} ${s.label}`, onPress: () => rescheduleTask(t.id, s.t, addMins(s.t, t.estimatedMinutes ?? 30)) })),
  ]);
  const handleRemoveSlot = (s: BlockedSlot) => Alert.alert('Remove block?', `"${s.emoji} ${s.label}" won't appear on your calendar anymore.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => removeSlot(s.id) },
  ]);

  const clockStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false });
  const selLabel = sel.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>

      {/* ── Fixed header + week strip ─────────────────────────────────── */}
      <View style={{
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1, borderBottomColor: theme.colors.border,
        shadowColor: '#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:8, elevation:3,
      }}>
        {/* Title row */}
        <View style={{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', paddingHorizontal:22, paddingTop:10, paddingBottom:4 }}>
          <View>
            <Text style={{ color:theme.colors.text, fontSize:24, fontWeight:'600', letterSpacing:-0.3 }}>Calendar</Text>
            <Text style={{ color:theme.colors.textMuted, fontSize:12, fontWeight:'400', marginTop:2 }}>{selLabel}</Text>
          </View>
          <View style={{ alignItems:'flex-end', gap:6 }}>
            <Text style={{ color:theme.colors.text, fontSize:16, fontWeight:'300', letterSpacing:1 }}>{clockStr}</Text>
            {!isToday && (
              <TouchableOpacity onPress={() => { setSel(new Date()); setAnchor(new Date()); }} style={{ backgroundColor:theme.colors.primaryLight, paddingHorizontal:10, paddingVertical:4, borderRadius:8 }}>
                <Text style={{ color:theme.colors.primary, fontSize:11, fontWeight:'500' }}>Today</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Progress bar */}
        {dayTasks.length > 0 && (
          <View style={{ paddingHorizontal:22, paddingBottom:10 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
              <Text style={{ color:theme.colors.textMuted, fontSize:11 }}>{doneCount} of {dayTasks.length} tasks</Text>
              <Text style={{ color:theme.colors.primary, fontSize:11 }}>{Math.round(progress*100)}%</Text>
            </View>
            <View style={{ height:3, backgroundColor:theme.colors.border, borderRadius:2, overflow:'hidden' }}>
              <View style={{ height:3, borderRadius:2, backgroundColor:theme.colors.primary, width:`${progress*100}%` }} />
            </View>
          </View>
        )}

        {/* Week strip */}
        <View style={{ paddingHorizontal:22, paddingBottom:14 }}>
          <View style={{ flexDirection:'row', alignItems:'center', marginBottom:10 }}>
            <TouchableOpacity onPress={() => { const d=new Date(anchor); d.setDate(d.getDate()-7); setAnchor(d); }} hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18l-6-6 6-6" stroke={theme.colors.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <View style={{ flex:1, flexDirection:'row', justifyContent:'space-around', paddingHorizontal:4 }}>
              {DAY_LABELS.map((l,i) => <Text key={i} style={{ color:theme.colors.textMuted, fontSize:10, fontWeight:'400', width:34, textAlign:'center', letterSpacing:0.4 }}>{l}</Text>)}
            </View>
            <TouchableOpacity onPress={() => { const d=new Date(anchor); d.setDate(d.getDate()+7); setAnchor(d); }} hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M9 18l6-6-6-6" stroke={theme.colors.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-around' }}>
            {week.map((d,i) => {
              const ds       = toDateString(d);
              const isSel    = ds === selStr;
              const isCur    = ds === todayStr;
              const dt       = getTasksForDate(ds);
              const allDone  = dt.length > 0 && dt.every(t => !!t.completedAt);
              return (
                <TouchableOpacity key={ds} onPress={() => setSel(d)} activeOpacity={0.72} style={{ alignItems:'center', width:34 }}>
                  <View style={{ width:34, height:34, borderRadius:10, backgroundColor:isSel ? theme.colors.primary : isCur ? theme.colors.primaryLight : 'transparent', borderWidth:isCur&&!isSel?1:0, borderColor:theme.colors.primary+'60', alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:14, fontWeight:isSel?'600':isCur?'500':'400', color:isSel?'#fff':isCur?theme.colors.primary:theme.colors.text }}>
                      {d.getDate()}
                    </Text>
                  </View>
                  <View style={{ height:5, marginTop:3 }}>
                    {dt.length > 0 && <View style={{ width:4, height:4, borderRadius:2, backgroundColor:allDone?theme.colors.primary:theme.colors.primary+'50' }} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

        {/* ── Surgo load analysis bubble ─────────────────────────────── */}
        {analysis && (
          <View style={{ paddingHorizontal:22, paddingTop:18 }}>
            <View style={{
              backgroundColor: themeKey === 'hardcore' ? '#1A0505' : theme.colors.surface,
              borderRadius:20, padding:16,
              flexDirection:'row', alignItems:'flex-start', gap:12,
              borderWidth:1,
              borderColor: themeKey === 'hardcore' ? '#FF2800' + '30' : theme.colors.border,
              shadowColor: themeKey === 'hardcore' ? '#FF2800' : theme.colors.primary,
              shadowOffset:{width:0,height:4}, shadowOpacity:0.10, shadowRadius:12, elevation:3,
            }}>
              <WelcomeMascot themeKey={themeKey} size={64} pose={analysis.pose} />
              <View style={{ flex:1 }}>
                <Text style={{ color:themeKey==='hardcore'?'#FF2800':theme.colors.text, fontSize:14, fontWeight:'500', marginBottom:4 }}>
                  {analysis.headline}
                </Text>
                <Text style={{ color:themeKey==='hardcore'?'#FF8080':theme.colors.textMuted, fontSize:12, lineHeight:18 }}>
                  {analysis.sub}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Unscheduled tasks ──────────────────────────────────────── */}
        {unsched.length > 0 && (
          <View style={{ paddingHorizontal:22, paddingTop:18, paddingBottom:4 }}>
            <Text style={{ color:theme.colors.textMuted, fontSize:10, textTransform:'uppercase', letterSpacing:1.2, marginBottom:10 }}>
              Not yet scheduled
            </Text>
            {unsched.map(task => {
              const goal = goals.find(g => g.id === task.goalId);
              const c = cs(goal?.category);
              return (
                <TouchableOpacity key={task.id} onPress={() => handleComplete(task)} onLongPress={() => handleReschedule(task)} activeOpacity={0.8} style={{ backgroundColor:c.bg, borderRadius:14, marginBottom:8, flexDirection:'row', alignItems:'center', overflow:'hidden', opacity:task.completedAt?0.5:1, shadowColor:c.bar, shadowOffset:{width:0,height:2}, shadowOpacity:0.10, shadowRadius:6, elevation:2 }}>
                  <View style={{ width:4, backgroundColor:c.bar, alignSelf:'stretch' }} />
                  <View style={{ flex:1, padding:14 }}>
                    <Text style={{ color:c.title, fontSize:14, fontWeight:'400', textDecorationLine:task.completedAt?'line-through':'none' }}>{task.title}</Text>
                    {goal && <Text style={{ color:c.sub, fontSize:11, marginTop:2 }} numberOfLines={1}>{goal.title}</Text>}
                  </View>
                  <View style={{ width:22, height:22, borderRadius:11, marginRight:14, backgroundColor:task.completedAt?c.bar:'transparent', borderWidth:1.5, borderColor:c.bar+'70', alignItems:'center', justifyContent:'center' }}>
                    {task.completedAt && <Text style={{ color:'#fff', fontSize:11 }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Time grid ──────────────────────────────────────────────── */}
        <View style={{ flexDirection:'row', paddingTop:12 }}>

          {/* Hour labels */}
          <View style={{ width:TIME_COL_W, paddingLeft:22 }}>
            {HOURS.slice(0,-1).map(h => (
              <View key={h} style={{ height:HOUR_H, justifyContent:'flex-start' }}>
                <Text style={{ color:theme.colors.textMuted, fontSize:9.5, fontWeight:'400', letterSpacing:0.2, marginTop:-5, opacity:0.75 }}>
                  {hrLabel(h)}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View style={{ flex:1, paddingRight:22, position:'relative', height:GRID_H }}>

            {/* Hour lines */}
            {HOURS.map((_,i) => (
              <View key={i} style={{ position:'absolute', top:i*HOUR_H, left:0, right:0, height:1, backgroundColor:theme.colors.border, opacity:0.6 }} />
            ))}
            {/* Half-hour lines */}
            {HOURS.slice(0,-1).map((_,i) => (
              <View key={`h${i}`} style={{ position:'absolute', top:i*HOUR_H+HOUR_H/2, left:0, right:0, height:1, backgroundColor:theme.colors.border, opacity:0.25 }} />
            ))}

            {/* ── Blocked slot overlays ──────────────────────────────── */}
            {blockedToday.map(slot => {
              const rawTop = ((toMins(slot.startTime) - START_HOUR*60) / 60) * HOUR_H;
              const rawH   = ((toMins(slot.endTime) - toMins(slot.startTime)) / 60) * HOUR_H;
              // Clamp to visible grid range
              const topPx  = Math.max(0, rawTop);
              const hPx    = rawH - (topPx - rawTop);
              if (topPx >= GRID_H || hPx <= 0) return null;
              const visH   = Math.min(hPx, GRID_H - topPx);
              return (
                <TouchableOpacity
                  key={slot.id}
                  onLongPress={() => handleRemoveSlot(slot)}
                  activeOpacity={0.85}
                  style={{
                    position:'absolute', top:topPx, left:0, right:0, height:visH,
                    backgroundColor: slot.color + '26',
                    borderLeftWidth: 4, borderLeftColor: slot.color + 'CC',
                    borderTopWidth: topPx === 0 ? 0 : 1,
                    borderBottomWidth: 1,
                    borderRightWidth: 1,
                    borderColor: slot.color + '40',
                    borderRadius: 10,
                    overflow:'hidden',
                  }}
                >
                  {/* Diagonal stripe fill */}
                  <Svg style={{ position:'absolute', top:0, left:0, right:0, bottom:0 }} width="100%" height={visH}>
                    <Defs>
                      <Pattern id={`stripe-${slot.id}`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <Line x1="0" y1="0" x2="0" y2="12" stroke={slot.color} strokeWidth="2" strokeOpacity="0.18" />
                      </Pattern>
                    </Defs>
                    <Rect width="100%" height={visH} fill={`url(#stripe-${slot.id})`} />
                  </Svg>
                  {/* Label chip — always visible */}
                  <View style={{
                    flexDirection:'row', alignItems:'center', gap:5,
                    marginLeft:10, marginTop:7,
                    backgroundColor: slot.color + '33',
                    alignSelf:'flex-start',
                    paddingHorizontal:8, paddingVertical:3,
                    borderRadius:8,
                  }}>
                    <Text style={{ fontSize:12 }}>{slot.emoji}</Text>
                    <Text style={{ color:slot.color, fontSize:11, fontWeight:'600' }}>{slot.label}</Text>
                  </View>
                  {visH > 50 && (
                    <Text style={{ color:slot.color, fontSize:10, marginLeft:14, marginTop:4, opacity:0.85, fontWeight:'400' }}>
                      {fmt12(slot.startTime)} – {fmt12(slot.endTime)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* ── Current time line ─────────────────────────────────── */}
            {isToday && (() => {
              const top = nowTop();
              if (top < 0 || top > GRID_H) return null;
              return (
                <View style={{ position:'absolute', top, left:-8, right:0, flexDirection:'row', alignItems:'center', zIndex:20, pointerEvents:'none' }}>
                  <View style={{ width:9, height:9, borderRadius:5, backgroundColor:theme.colors.primary }} />
                  <View style={{ flex:1, height:1.5, backgroundColor:theme.colors.primary, opacity:0.8 }} />
                </View>
              );
            })()}

            {/* ── Scheduled task blocks ─────────────────────────────── */}
            {sched.map(task => {
              const goal  = goals.find(g => g.id === task.goalId);
              const c     = cs(goal?.category);
              const mins  = task.estimatedMinutes ?? 30;
              const startM = toMins(task.scheduledTime!);
              const top    = ((startM - START_HOUR*60) / 60) * HOUR_H;
              const h      = Math.max(44, (mins/60) * HOUR_H);
              if (top < 0 || top > GRID_H) return null;
              const done   = !!task.completedAt;
              return (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => handleComplete(task)}
                  onLongPress={() => handleReschedule(task)}
                  activeOpacity={0.8}
                  style={{
                    position:'absolute', top:top+2, left:4, right:4, height:h-4,
                    borderRadius:14, overflow:'hidden', opacity:done?0.5:1,
                    backgroundColor:done?theme.colors.surfaceAlt:c.bg,
                    shadowColor:c.bar, shadowOffset:{width:0,height:2},
                    shadowOpacity:done?0:0.12, shadowRadius:6, elevation:done?0:3,
                    flexDirection:'row',
                  }}
                >
                  <View style={{ width:3.5, backgroundColor:done?theme.colors.textMuted:c.bar }} />
                  <View style={{ flex:1, paddingHorizontal:10, paddingVertical:8, justifyContent:'center' }}>
                    <Text style={{ color:done?theme.colors.textMuted:c.title, fontSize:13, fontWeight:'400', lineHeight:17, textDecorationLine:done?'line-through':'none' }} numberOfLines={h>58?2:1}>
                      {task.title}
                    </Text>
                    {goal && h > 46 && <Text style={{ color:done?theme.colors.textMuted:c.sub, fontSize:10, marginTop:2 }} numberOfLines={1}>{goal.title}</Text>}
                    {h > 70 && task.scheduledEndTime && (
                      <Text style={{ color:c.sub, fontSize:9, marginTop:4 }}>{fmt12(task.scheduledTime!)} – {fmt12(task.scheduledEndTime)}</Text>
                    )}
                  </View>
                  {done && (
                    <View style={{ justifyContent:'center', paddingRight:10 }}>
                      <View style={{ width:18, height:18, borderRadius:9, backgroundColor:c.bar+'30', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color:c.bar, fontSize:9 }}>✓</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Empty state ────────────────────────────────────────────── */}
        {dayTasks.length === 0 && blockedToday.length === 0 && (
          <View style={{ alignItems:'center', paddingTop:48, paddingHorizontal:40 }}>
            <View style={{ width:72, height:72, borderRadius:36, backgroundColor:theme.colors.primaryLight, alignItems:'center', justifyContent:'center', marginBottom:18 }}>
              <Text style={{ fontSize:32 }}>{isToday ? '✨' : '📅'}</Text>
            </View>
            <Text style={{ color:theme.colors.text, fontSize:16, fontWeight:'500', marginBottom:8, textAlign:'center' }}>
              {isToday ? 'Nothing scheduled today' : 'Free day'}
            </Text>
            <Text style={{ color:theme.colors.textMuted, fontSize:13, textAlign:'center', lineHeight:20 }}>
              {isToday ? 'Create a goal and Surgo will fill this calendar.' : 'No tasks here. Enjoy the free time!'}
            </Text>
          </View>
        )}

        {dayTasks.length > 0 && (
          <Text style={{ textAlign:'center', color:theme.colors.textMuted, fontSize:10, marginTop:20, letterSpacing:0.3 }}>
            Tap to complete  ·  Hold to reschedule
          </Text>
        )}

        {/* ── Blocked time section ───────────────────────────────────── */}
        <View style={{ paddingHorizontal:22, paddingTop:32 }}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <View>
              <Text style={{ color:theme.colors.text, fontSize:15, fontWeight:'500' }}>Blocked Time</Text>
              <Text style={{ color:theme.colors.textMuted, fontSize:11, fontWeight:'400', marginTop:2 }}>
                Surgo won't schedule tasks during these hours
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAdd(true)}
              style={{
                width:36, height:36, borderRadius:18,
                backgroundColor:theme.colors.primary,
                alignItems:'center', justifyContent:'center',
                shadowColor:theme.colors.primary, shadowOffset:{width:0,height:4},
                shadowOpacity:0.25, shadowRadius:10, elevation:5,
              }}
            >
              <Text style={{ color:'#fff', fontSize:22, lineHeight:28, fontWeight:'300' }}>+</Text>
            </TouchableOpacity>
          </View>

          {allSlots.length === 0 ? (
            <View style={{ backgroundColor:theme.colors.surface, borderRadius:16, padding:20, alignItems:'center', borderWidth:1, borderColor:theme.colors.border, borderStyle:'dashed' }}>
              <Text style={{ color:theme.colors.textMuted, fontSize:13, textAlign:'center', lineHeight:19 }}>
                No blocked slots yet.{'\n'}Tap + to add Office, Gym, School or anything that takes your time.
              </Text>
            </View>
          ) : (
            <View style={{ gap:8 }}>
              {allSlots.map(slot => (
                <TouchableOpacity
                  key={slot.id}
                  onLongPress={() => handleRemoveSlot(slot)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: slot.color + '12',
                    borderRadius:14, padding:14,
                    flexDirection:'row', alignItems:'center', gap:12,
                    borderWidth:1, borderColor: slot.color + '25',
                  }}
                >
                  <View style={{ width:42, height:42, borderRadius:12, backgroundColor: slot.color + '20', alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:20 }}>{slot.emoji}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ color:theme.colors.text, fontSize:14, fontWeight:'400' }}>{slot.label}</Text>
                    <Text style={{ color:slot.color, fontSize:11, marginTop:2 }}>
                      {fmt12(slot.startTime)} – {fmt12(slot.endTime)} · {slot.repeat === 'daily' ? 'Every day' : slot.repeat === 'weekdays' ? 'Weekdays' : 'Weekends'}
                    </Text>
                  </View>
                  {/* Active indicator */}
                  {getSlotsForDay(selDow).some(s => s.id === slot.id) && (
                    <View style={{ backgroundColor:slot.color+'20', paddingHorizontal:8, paddingVertical:3, borderRadius:8 }}>
                      <Text style={{ color:slot.color, fontSize:9, fontWeight:'500' }}>TODAY</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              <Text style={{ color:theme.colors.textMuted, fontSize:10, textAlign:'center', marginTop:4 }}>
                Hold any block to remove it
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── FAB ───────────────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => setShowAdd(true)}
        style={{
          position:'absolute', right:22, bottom: insets.bottom + 18,
          width:54, height:54, borderRadius:27,
          backgroundColor:theme.colors.primary,
          alignItems:'center', justifyContent:'center',
          shadowColor:theme.colors.primary, shadowOffset:{width:0,height:6},
          shadowOpacity:0.35, shadowRadius:14, elevation:8,
        }}
        activeOpacity={0.85}
      >
        <Text style={{ color:'#fff', fontSize:28, lineHeight:34, fontWeight:'300', marginTop:-2 }}>+</Text>
      </TouchableOpacity>

      {/* ── Add blocked slot sheet ─────────────────────────────────── */}
      <AddSlotSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(s) => addSlot(s)}
        theme={theme}
        themeKey={themeKey}
      />

    </SafeAreaView>
  );
}
