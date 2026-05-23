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
import { WelcomeMascot } from '@/components/ui/WelcomeMascot';
import {
  chatWithSurgo, transcribeAudio,
  ApiTurn, SurgoAction, PlanTask,
} from '@/lib/surgoChat';
import { toDateString } from '@/lib/streak';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMsg {
  id:           string;
  role:         'user' | 'surgo';
  text:         string;
  action?:      SurgoAction;
  planCreated?: boolean;   // true once user confirms the plan
}

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

// ─── Plan card (shown inside Surgo bubble) ────────────────────────────────────

function PlanCard({
  tasks,
  created,
  onConfirm,
  theme,
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
        backgroundColor: theme.colors.success + '15',
        borderWidth: 1,
        borderColor: theme.colors.success + '50',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke={theme.colors.success} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={{ color: theme.colors.success, fontWeight: '800', fontSize: 12 }}>
            {tasks.length} tasks added to your Goals!
          </Text>
        </View>
        {tasks.map((t, i) => (
          <Text key={i} style={{ color: theme.colors.success, fontSize: 11, marginLeft: 4, marginBottom: 2 }}>
            • {t.title}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View style={{
      marginTop: 10,
      backgroundColor: theme.colors.primaryLight,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    }}>
      <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 12, marginBottom: 8 }}>
        📋 Your Plan
      </Text>
      {tasks.map((t, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <View style={{
            width: 20, height: 20, borderRadius: 10,
            backgroundColor: theme.colors.primary + '25',
            borderWidth: 1, borderColor: theme.colors.primary + '60',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
          }}>
            <Text style={{ color: theme.colors.primary, fontSize: 9, fontWeight: '800' }}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{t.title}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 1 }}>
              ~{t.estimatedMinutes} min
            </Text>
          </View>
        </View>
      ))}

      {/* Confirm button */}
      <TouchableOpacity
        onPress={onConfirm}
        activeOpacity={0.85}
        style={{
          marginTop: 10,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
          Yes, create these tasks!
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Single-task chip ─────────────────────────────────────────────────────────

function TaskChip({ action, theme }: { action: SurgoAction; theme: any }) {
  if (action.type !== 'create_task' || !action.task) return null;
  return (
    <View style={{
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.success + '18',
      borderWidth: 1,
      borderColor: theme.colors.success + '50',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    }}>
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path d="M9 11l3 3L22 4" stroke={theme.colors.success} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
          stroke={theme.colors.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={{ color: theme.colors.success, fontSize: 12, fontWeight: '700' }}>
        Task added — {action.task.title}
      </Text>
    </View>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────

function Bubble({
  msg, theme, photoUri, themeKey, onConfirmPlan,
}: {
  msg:           ChatMsg;
  theme:         any;
  photoUri:      string;
  themeKey:      string;
  onConfirmPlan: (msgId: string, tasks: PlanTask[]) => void;
}) {
  const isUser = msg.role === 'user';

  return (
    <View style={{
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems:    'flex-end',
      gap:           8,
      marginBottom:  12,
      paddingHorizontal: 4,
    }}>
      {/* Avatar */}
      <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
        {isUser ? (
          photoUri ? (
            <Image source={{ uri: photoUri }} style={{ width: 32, height: 32 }} />
          ) : (
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: theme.colors.surfaceAlt,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="8" r="4" stroke={theme.colors.textMuted} strokeWidth="1.8" />
                <Path d="M4 20C4 16.13 7.58 13 12 13c4.42 0 8 3.13 8 7"
                  stroke={theme.colors.textMuted} strokeWidth="1.8" strokeLinecap="round" />
              </Svg>
            </View>
          )
        ) : (
          <View style={{ width: 32, height: 32 }}>
            <WelcomeMascot themeKey={themeKey as any} size={32} />
          </View>
        )}
      </View>

      {/* Bubble content */}
      <View style={{ maxWidth: '78%' }}>
        <View style={{
          backgroundColor:     isUser ? theme.colors.primary : theme.colors.surface,
          borderRadius:        18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius:  isUser ? 18 : 4,
          paddingHorizontal:   14,
          paddingVertical:     10,
          borderWidth:         isUser ? 0 : 1,
          borderColor:         theme.colors.border,
        }}>
          <Text style={{
            color:      isUser ? theme.colors.textInverse : theme.colors.text,
            fontSize:   14,
            lineHeight: 20,
            fontWeight: '500',
          }}>
            {msg.text}
          </Text>
        </View>

        {/* Single task chip */}
        {msg.action?.type === 'create_task' && (
          <TaskChip action={msg.action} theme={theme} />
        )}

        {/* Plan card */}
        {msg.action?.type === 'suggest_plan' && msg.action.tasks && (
          <PlanCard
            tasks={msg.action.tasks}
            created={!!msg.planCreated}
            onConfirm={() => onConfirmPlan(msg.id, msg.action!.tasks!)}
            theme={theme}
          />
        )}
      </View>
    </View>
  );
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 4, paddingVertical: 6 }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: color,
          opacity: 0.4 + i * 0.2,
        }} />
      ))}
    </View>
  );
}

// ─── Welcome messages ─────────────────────────────────────────────────────────

const WELCOME: Record<string, string> = {
  soft:     "Hey! I'm Surgo 🌸 Tell me what you want to achieve and I'll build a plan for you. What's on your mind?",
  balanced: "Hey — I'm Surgo. Tell me your goal and I'll break it down into tasks. What are we working on?",
  hardcore: "Surgo here. Give me your goal, I'll give you a plan. No fluff. Go.",
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { theme, themeKey } = useTheme();
  const { goals, isLoaded, load, addTasks } = useGoalStore();
  const { profile, isLoaded: profileLoaded, load: loadProfile } = useProfileStore();

  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'welcome', role: 'surgo', text: WELCOME[themeKey] ?? WELCOME.balanced },
  ]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [micState,  setMicState]  = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const scrollRef = useRef<ScrollView>(null);

  // Pulsing animation for recording
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (micState === 'recording') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.35, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.00, duration: 600, useNativeDriver: true }),
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

  // ── Plan confirmation ────────────────────────────────────────────────────────

  const confirmPlan = async (msgId: string, tasks: PlanTask[]) => {
    const targetGoal = activeGoals[0];
    if (!targetGoal) {
      Alert.alert('No active goal', 'Add a goal first in the Goals tab, then I can create tasks for it!');
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

      // Mark the message's plan as created
      setMessages(prev =>
        prev.map(m => m.id === msgId ? { ...m, planCreated: true } : m)
      );
    } catch {
      Alert.alert('Could not create tasks', 'Check your internet and try again.');
    }
  };

  // ── Mic handlers ─────────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Mic permission needed', 'Allow microphone access to talk to Surgo.');
        return;
      }
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
        setTimeout(() => {
          sendText(text);
          setInput('');
        }, 900);
      } else {
        setMicState('idle');
        Alert.alert('Nothing heard', "Surgo couldn't catch that. Try again.");
      }
    } catch {
      setMicState('idle');
      setRecording(null);
      Alert.alert('Transcription failed', 'Check your internet and try again.');
    }
  };

  const handleMicPress = () => {
    if (micState === 'idle')          startRecording();
    else if (micState === 'recording') stopAndTranscribe();
  };

  // ── Core send ────────────────────────────────────────────────────────────────

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendText(text);
  };

  const sendText = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMsg = { id: uid(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = buildHistory();
      const res     = await chatWithSurgo(text, history, themeKey, goalTitles);

      let finalAction: SurgoAction | undefined;

      if (res.action?.type === 'create_task' && res.action.task) {
        // Auto-create single task immediately
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
        // Show plan card — user must confirm
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

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <View style={{
          flexDirection:   'row',
          alignItems:      'center',
          gap:             12,
          paddingHorizontal: 20,
          paddingVertical:   14,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor:   theme.colors.surface,
        }}>
          <View style={{ width: 38, height: 38 }}>
            <WelcomeMascot themeKey={themeKey} size={38} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }}>Surgo</Text>
            <Text style={{ color: theme.colors.success, fontSize: 11, fontWeight: '600', marginTop: 1 }}>
              ● Online — ready to help
            </Text>
          </View>
          <View style={{
            backgroundColor: theme.colors.primaryLight,
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
          }}>
            <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>AI</Text>
          </View>
        </View>

        {/* ── Messages ─────────────────────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {messages.map(m => (
            <Bubble
              key={m.id}
              msg={m}
              theme={theme}
              photoUri={profile.photoUri}
              themeKey={themeKey}
              onConfirmPlan={confirmPlan}
            />
          ))}

          {/* Typing indicator */}
          {loading && (
            <View style={{
              flexDirection: 'row', alignItems: 'flex-end',
              gap: 8, marginBottom: 12, paddingHorizontal: 4,
            }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden' }}>
                <WelcomeMascot themeKey={themeKey} size={32} />
              </View>
              <View style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 18, borderBottomLeftRadius: 4,
                paddingHorizontal: 14, paddingVertical: 8,
                borderWidth: 1, borderColor: theme.colors.border,
              }}>
                <TypingDots color={theme.colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Suggestion chips ─────────────────────────────────────────────── */}
        {input.length === 0 && messages.length <= 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            {[
              "Help me get fit this month",
              "I want to learn a new skill",
              "Add a task to drink more water",
              "Help me study for my exam",
            ].map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setInput(s)}
                style={{
                  backgroundColor:  theme.colors.primaryLight,
                  borderRadius:     20,
                  paddingHorizontal: 14,
                  paddingVertical:   8,
                  borderWidth:      1,
                  borderColor:      theme.colors.primary + '30',
                }}
              >
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Recording banner ─────────────────────────────────────────────── */}
        {micState !== 'idle' && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            paddingVertical: 10,
            backgroundColor: micState === 'recording' ? '#FF3B3015' : theme.colors.primaryLight,
            borderTopWidth: 1, borderTopColor: theme.colors.border,
          }}>
            {micState === 'recording' ? (
              <>
                <Animated.View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: '#FF3B30',
                  transform: [{ scale: pulse }],
                }} />
                <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: '700' }}>
                  Listening… tap mic to send
                </Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '700' }}>
                  Transcribing…
                </Text>
              </>
            )}
          </View>
        )}

        {/* ── Input bar ────────────────────────────────────────────────────── */}
        <View style={{
          flexDirection:  'row',
          alignItems:     'flex-end',
          gap:            8,
          paddingHorizontal: 14,
          paddingVertical:   12,
          borderTopWidth:    micState === 'idle' ? 1 : 0,
          borderTopColor:    theme.colors.border,
          backgroundColor:   theme.colors.surface,
        }}>
          {/* Mic button */}
          <TouchableOpacity
            onPress={handleMicPress}
            disabled={micState === 'transcribing' || loading}
            activeOpacity={0.8}
            style={{ alignItems: 'center', justifyContent: 'center' }}
          >
            <Animated.View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: micState === 'recording' ? '#FF3B30' : theme.colors.primaryLight,
              alignItems: 'center', justifyContent: 'center',
              transform: [{ scale: micState === 'recording' ? pulse : 1 }],
            }}>
              {micState === 'transcribing' ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                    stroke={micState === 'recording' ? '#fff' : theme.colors.primary}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                  <Path
                    d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
                    stroke={micState === 'recording' ? '#fff' : theme.colors.primary}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                </Svg>
              )}
            </Animated.View>
          </TouchableOpacity>

          {/* Text input */}
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={
              micState === 'recording'
                ? "Listening…"
                : "Tell Surgo your goal or task…"
            }
            placeholderTextColor={theme.colors.textMuted}
            multiline
            editable={micState === 'idle'}
            style={{
              flex:       1,
              color:      theme.colors.text,
              fontSize:   15,
              backgroundColor: theme.colors.background,
              borderRadius:    22,
              borderWidth:     1,
              borderColor:     micState !== 'idle' ? theme.colors.border + '60' : theme.colors.border,
              paddingHorizontal: 16,
              paddingVertical:   10,
              maxHeight:         100,
              fontWeight:        '500',
              opacity:           micState !== 'idle' ? 0.5 : 1,
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
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: input.trim() && !loading && micState === 'idle'
                ? theme.colors.primary
                : theme.colors.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M22 2L15 22L11 13L2 9L22 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
