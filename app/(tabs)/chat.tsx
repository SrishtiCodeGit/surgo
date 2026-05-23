import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, Animated, Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { useTheme } from '@/context/ThemeContext';
import { useGoalStore } from '@/stores/goalStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSurgoMemoryStore } from '@/stores/surgoMemoryStore';
import { WelcomeMascot } from '@/components/ui/WelcomeMascot';
import {
  chatWithSurgo, transcribeAudio,
  ApiTurn, SurgoAction, PlanTask,
} from '@/lib/surgoChat';
import { toDateString } from '@/lib/streak';

// ─── Design tokens (overrides theme for a premium neutral palette) ────────────

const D = {
  userBubble:   '#1C1C1E',
  userText:     '#FFFFFF',
  surgoBubble:  '#F2F2F2',
  surgoText:    '#1C1C1E',
  sendBtn:      '#1C1C1E',
  inputBg:      '#FFFFFF',
  inputBorder:  'rgba(0,0,0,0.10)',
  chipBorder:   'rgba(0,0,0,0.12)',
  chipText:     '#555555',
  muted:        '#999999',
  success:      '#2E7D32',
  successBg:    '#EDF7EE',
  planBorder:   'rgba(0,0,0,0.08)',
  planNumBg:    '#EBEBEB',
  planNumText:  '#555555',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMsg {
  id:          string;
  role:        'user' | 'surgo';
  text:        string;
  action?:     SurgoAction;
  planCreated?: boolean;
}

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  tasks, created, onConfirm, theme,
}: {
  tasks:     PlanTask[];
  created:   boolean;
  onConfirm: () => void;
  theme:     any;
}) {
  if (created) {
    return (
      <View style={{
        marginTop: 10,
        backgroundColor: D.successBg,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke={D.success} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={{ color: D.success, fontWeight: '700', fontSize: 13 }}>
            {tasks.length} tasks added!
          </Text>
        </View>
        {tasks.map((t, i) => (
          <Text key={i} style={{ color: D.success, fontSize: 12, marginLeft: 2, marginBottom: 3, opacity: 0.85 }}>
            · {t.title}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View style={{
      marginTop: 10,
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: D.planBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    }}>
      <Text style={{ color: D.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
        Your Plan
      </Text>

      {tasks.map((t, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <View style={{
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: D.planNumBg,
            alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
          }}>
            <Text style={{ color: D.planNumText, fontSize: 10, fontWeight: '700' }}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: D.surgoText, fontSize: 13.5, fontWeight: '600', lineHeight: 19 }}>
              {t.title}
            </Text>
            <Text style={{ color: D.muted, fontSize: 11, marginTop: 2 }}>
              ~{t.estimatedMinutes} min
            </Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        onPress={onConfirm}
        activeOpacity={0.85}
        style={{
          marginTop: 4,
          backgroundColor: D.sendBtn,
          borderRadius: 10,
          paddingVertical: 11,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 7,
        }}
      >
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.2 }}>
          Yes, create these tasks
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Single task chip ─────────────────────────────────────────────────────────

function TaskChip({ task }: { task: PlanTask }) {
  return (
    <View style={{
      marginTop: 7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: D.successBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
    }}>
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" stroke={D.success} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={{ color: D.success, fontSize: 12, fontWeight: '600', flex: 1 }}>
        {task.title}
      </Text>
    </View>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────

function Bubble({
  msg, photoUri, themeKey, onConfirmPlan,
}: {
  msg:           ChatMsg;
  photoUri:      string;
  themeKey:      string;
  onConfirmPlan: (msgId: string, tasks: PlanTask[]) => void;
}) {
  const isUser = msg.role === 'user';

  return (
    <View style={{
      flexDirection:     isUser ? 'row-reverse' : 'row',
      alignItems:        'flex-end',
      gap:               8,
      marginBottom:      14,
      paddingHorizontal: 4,
    }}>
      {/* Avatar */}
      <View style={{
        width: 28, height: 28, borderRadius: 14,
        overflow: 'hidden', flexShrink: 0,
        backgroundColor: isUser ? D.userBubble : '#EBEBEB',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser ? (
          photoUri ? (
            <Image source={{ uri: photoUri }} style={{ width: 28, height: 28 }} />
          ) : (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" />
              <Path d="M4 20C4 16.13 7.58 13 12 13c4.42 0 8 3.13 8 7"
                stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" />
            </Svg>
          )
        ) : (
          <WelcomeMascot themeKey={themeKey as any} size={28} />
        )}
      </View>

      {/* Content */}
      <View style={{ maxWidth: '80%' }}>
        {/* Sender label */}
        {!isUser && (
          <Text style={{
            color: D.muted, fontSize: 10, fontWeight: '600',
            letterSpacing: 0.5, marginBottom: 4, marginLeft: 2,
          }}>
            SURGO
          </Text>
        )}

        {/* Bubble */}
        <View style={{
          backgroundColor:         isUser ? D.userBubble : D.surgoBubble,
          borderRadius:            18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius:  isUser ? 18 : 4,
          paddingHorizontal:       14,
          paddingVertical:         11,
          shadowColor:             '#000',
          shadowOffset:            { width: 0, height: 1 },
          shadowOpacity:           isUser ? 0 : 0.05,
          shadowRadius:            6,
          elevation:               isUser ? 0 : 1,
        }}>
          <Text style={{
            color:      isUser ? D.userText : D.surgoText,
            fontSize:   14.5,
            lineHeight: 21,
            fontWeight: '400',
          }}>
            {msg.text}
          </Text>
        </View>

        {/* Task chip */}
        {msg.action?.type === 'create_task' && msg.action.task && (
          <TaskChip task={msg.action.task} />
        )}

        {/* Plan card */}
        {msg.action?.type === 'suggest_plan' && msg.action.tasks && (
          <PlanCard
            tasks={msg.action.tasks}
            created={!!msg.planCreated}
            onConfirm={() => onConfirmPlan(msg.id, msg.action!.tasks!)}
            theme={null}
          />
        )}
      </View>
    </View>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 6, paddingVertical: 8 }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{
          width: 5, height: 5, borderRadius: 2.5,
          backgroundColor: D.muted,
          opacity: 0.4 + i * 0.25,
        }} />
      ))}
    </View>
  );
}

// ─── Welcome messages ─────────────────────────────────────────────────────────

const WELCOME: Record<string, string> = {
  soft:     "Hi there 🌸 I'm Surgo, your personal assistant. I'll ask you a few things before building your plan — so it's made just for you. What are you working towards?",
  balanced: "Hey, I'm Surgo — your personal AI coach. Before I build anything, I'll ask the right questions so your plan actually fits your life. What's the goal?",
  hardcore: "Surgo here. I'm not guessing — I'll ask you what I need to know, then give you a real plan built for your situation. What are we fixing?",
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { theme, themeKey } = useTheme();
  const { goals, isLoaded, load, addTasks }                          = useGoalStore();
  const { profile, isLoaded: profileLoaded, load: loadProfile }      = useProfileStore();
  const { getFactsText, learnFacts }                                 = useSurgoMemoryStore();

  const [messages,  setMessages]  = useState<ChatMsg[]>([
    { id: 'welcome', role: 'surgo', text: WELCOME[themeKey] ?? WELCOME.balanced },
  ]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [micState,  setMicState]  = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const scrollRef = useRef<ScrollView>(null);

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (micState === 'recording') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.3, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [micState]);

  useEffect(() => { if (!isLoaded)      load(); },        []);
  useEffect(() => { if (!profileLoaded) loadProfile(); }, []);
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, loading]);

  const activeGoals = goals.filter(g => g.isActive);
  const goalTitles  = activeGoals.map(g => g.title);

  const buildHistory = (): ApiTurn[] =>
    messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

  // ── Plan confirmation ──────────────────────────────────────────────────────

  const confirmPlan = async (msgId: string, tasks: PlanTask[]) => {
    const targetGoal = activeGoals[0];
    if (!targetGoal) {
      Alert.alert('No active goal', 'Add a goal first in the Goals tab, then I can create tasks for it.');
      return;
    }
    try {
      await addTasks(
        tasks.map(t => ({
          goalId:           targetGoal.id,
          userId:           'local',
          title:            t.title,
          dueDate:          toDateString(new Date()),
          estimatedMinutes: t.estimatedMinutes,
          aiGenerated:      true,
          isStretchTask:    false,
        }))
      );
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, planCreated: true } : m));
    } catch {
      Alert.alert('Could not create tasks', 'Check your internet and try again.');
    }
  };

  // ── Mic ───────────────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert('Mic permission needed'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setMicState('recording');
    } catch (e) {
      Alert.alert('Could not start recording', String(e));
    }
  };

  const stopAndTranscribe = async () => {
    if (!recording) return;
    setMicState('transcribing');
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('No audio captured');
      const text = await transcribeAudio(uri);
      if (text) {
        setInput(text);
        setMicState('idle');
        setTimeout(() => { sendText(text); setInput(''); }, 900);
      } else {
        setMicState('idle');
        Alert.alert('Nothing heard', "Try again.");
      }
    } catch {
      setMicState('idle');
      setRecording(null);
      Alert.alert('Transcription failed', 'Check your internet and try again.');
    }
  };

  const handleMicPress = () => {
    if (micState === 'idle')           startRecording();
    else if (micState === 'recording') stopAndTranscribe();
  };

  // ── Send ──────────────────────────────────────────────────────────────────

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendText(text);
  };

  const sendText = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { id: uid(), role: 'user', text }]);
    setLoading(true);

    try {
      const history    = buildHistory();
      const knownFacts = getFactsText();
      const res        = await chatWithSurgo(text, history, themeKey, goalTitles, knownFacts);

      // Persist any newly learned facts
      if (res.learn && Object.keys(res.learn).length > 0) {
        learnFacts(res.learn);
      }

      let finalAction: SurgoAction | undefined;

      if (res.action?.type === 'create_task' && res.action.task) {
        const targetGoal = activeGoals[0];
        if (targetGoal) {
          await addTasks([{
            goalId:           targetGoal.id,
            userId:           'local',
            title:            res.action.task.title,
            dueDate:          toDateString(new Date()),
            estimatedMinutes: res.action.task.estimatedMinutes,
            aiGenerated:      true,
            isStretchTask:    false,
          }]);
          finalAction = res.action;
        }
      } else if (res.action?.type === 'suggest_plan') {
        finalAction = res.action;
      }

      setMessages(prev => [...prev, {
        id: uid(), role: 'surgo', text: res.message, action: finalAction,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id:   uid(),
        role: 'surgo',
        text: "Sorry, I had trouble connecting. Check your internet and try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={{
          flexDirection:   'row',
          alignItems:      'center',
          gap:             12,
          paddingHorizontal: 20,
          paddingVertical:   14,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.07)',
          backgroundColor:   theme.colors.surface,
        }}>
          <View style={{ width: 36, height: 36 }}>
            <WelcomeMascot themeKey={themeKey} size={36} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#1C1C1E', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 }}>
              Surgo
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' }} />
              <Text style={{ color: D.muted, fontSize: 11, fontWeight: '500' }}>
                Personal assistant
              </Text>
            </View>
          </View>
        </View>

        {/* ── Messages ───────────────────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {messages.map(m => (
            <Bubble
              key={m.id}
              msg={m}
              photoUri={profile.photoUri}
              themeKey={themeKey}
              onConfirmPlan={confirmPlan}
            />
          ))}

          {/* Typing indicator */}
          {loading && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14, paddingHorizontal: 4 }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                overflow: 'hidden', backgroundColor: '#EBEBEB',
              }}>
                <WelcomeMascot themeKey={themeKey} size={28} />
              </View>
              <View>
                <Text style={{ color: D.muted, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4, marginLeft: 2 }}>
                  SURGO
                </Text>
                <View style={{
                  backgroundColor: D.surgoBubble,
                  borderRadius: 18, borderBottomLeftRadius: 4,
                  paddingHorizontal: 14, paddingVertical: 8,
                }}>
                  <TypingDots />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Suggestion chips ───────────────────────────────────────────── */}
        {input.length === 0 && messages.length <= 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            {[
              "I want to get slim",
              "Help me study better",
              "I want to sleep earlier",
              "Remind me to drink water",
            ].map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setInput(s)}
                style={{
                  backgroundColor:   '#FFFFFF',
                  borderRadius:      20,
                  paddingHorizontal: 14,
                  paddingVertical:   8,
                  borderWidth:       1,
                  borderColor:       D.chipBorder,
                }}
              >
                <Text style={{ color: D.chipText, fontSize: 12.5, fontWeight: '500' }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Recording banner ───────────────────────────────────────────── */}
        {micState !== 'idle' && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            paddingVertical: 10,
            backgroundColor: 'rgba(0,0,0,0.03)',
            borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)',
          }}>
            {micState === 'recording' ? (
              <>
                <Animated.View style={{
                  width: 7, height: 7, borderRadius: 3.5,
                  backgroundColor: '#FF3B30',
                  transform: [{ scale: pulse }],
                }} />
                <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: '600' }}>
                  Listening — tap mic to send
                </Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="small" color={D.muted} />
                <Text style={{ color: D.muted, fontSize: 13, fontWeight: '500' }}>
                  Transcribing…
                </Text>
              </>
            )}
          </View>
        )}

        {/* ── Input bar ──────────────────────────────────────────────────── */}
        <View style={{
          flexDirection:    'row',
          alignItems:       'flex-end',
          gap:              8,
          paddingHorizontal: 14,
          paddingVertical:   12,
          borderTopWidth:    micState === 'idle' ? 1 : 0,
          borderTopColor:    'rgba(0,0,0,0.07)',
          backgroundColor:   theme.colors.surface,
        }}>

          {/* Mic button */}
          <TouchableOpacity
            onPress={handleMicPress}
            disabled={micState === 'transcribing' || loading}
            activeOpacity={0.7}
            style={{
              width: 42, height: 42, borderRadius: 21,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: micState === 'recording' ? '#FF3B30' : 'rgba(0,0,0,0.05)',
            }}
          >
            {micState === 'transcribing' ? (
              <ActivityIndicator size="small" color={D.muted} />
            ) : (
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                  stroke={micState === 'recording' ? '#fff' : '#555'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                <Path
                  d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
                  stroke={micState === 'recording' ? '#fff' : '#555'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </Svg>
            )}
          </TouchableOpacity>

          {/* Text input */}
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={micState === 'recording' ? "Listening…" : "Message Surgo…"}
            placeholderTextColor={D.muted}
            multiline
            editable={micState === 'idle'}
            style={{
              flex:              1,
              color:             '#1C1C1E',
              fontSize:          15,
              backgroundColor:   D.inputBg,
              borderRadius:      22,
              borderWidth:       1,
              borderColor:       micState !== 'idle' ? 'rgba(0,0,0,0.05)' : D.inputBorder,
              paddingHorizontal: 16,
              paddingVertical:   10,
              maxHeight:         100,
              fontWeight:        '400',
              opacity:           micState !== 'idle' ? 0.4 : 1,
            }}
            onSubmitEditing={send}
            blurOnSubmit={false}
          />

          {/* Send button */}
          <TouchableOpacity
            onPress={send}
            disabled={!input.trim() || loading || micState !== 'idle'}
            activeOpacity={0.8}
            style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: input.trim() && !loading && micState === 'idle'
                ? D.sendBtn
                : 'rgba(0,0,0,0.08)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#888" />
            ) : (
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M22 2L11 13" stroke="white" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M22 2L15 22L11 13L2 9L22 2z" stroke="white" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
