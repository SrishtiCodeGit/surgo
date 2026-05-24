import {
  Modal, View, Text, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { WelcomeMascot } from './WelcomeMascot';
import { useTheme } from '@/context/ThemeContext';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Messages ─────────────────────────────────────────────────────────────────

function getHeadline(remaining: number, themeKey: string): string {
  if (remaining === 0) {
    if (themeKey === 'hardcore') return "DONE. ALL OF THEM.";
    if (themeKey === 'soft')     return "You did it! 🌸";
    return "All tasks crushed! 🔥";
  }
  if (themeKey === 'hardcore') return "KEEP GOING.";
  if (themeKey === 'soft')     return "Way to go! 🌸";
  return "Let's go! 💪";
}

function getBody(remaining: number, completed: number, total: number, themeKey: string): string {
  if (remaining === 0) {
    if (themeKey === 'hardcore') return `${total} for ${total}. That's the standard.`;
    if (themeKey === 'soft')     return `Every single task done. I'm so proud of you!`;
    return `${total} out of ${total} — you're unstoppable today.`;
  }
  if (remaining === 1) {
    if (themeKey === 'hardcore') return `ONE left. Finish it. No stopping now.`;
    if (themeKey === 'soft')     return `Just 1 more to go — you're almost there, keep shining!`;
    return `Just 1 task left — you're this close. Finish strong!`;
  }
  if (themeKey === 'hardcore')
    return `${completed} done. ${remaining} left. Don't slow down.`;
  if (themeKey === 'soft')
    return `You're ${remaining} tasks away — you're doing beautifully!`;
  return `${completed} down, ${remaining} to go — you're in the zone!`;
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({
  total, completed, primary,
}: { total: number; completed: number; primary: string }) {
  // Cap at 10 dots so it doesn't overflow
  const dots = Math.min(total, 10);
  const doneCount = Math.round((completed / total) * dots);

  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 14 }}>
      {Array.from({ length: dots }).map((_, i) => (
        <View
          key={i}
          style={{
            width:  i < doneCount ? 20 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i < doneCount
              ? primary
              : 'rgba(0,0,0,0.12)',
            // Smooth the "done" dots expanding
            overflow: 'hidden',
          }}
        />
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  visible:   boolean;
  remaining: number;
  total:     number;
  onDismiss: () => void;
}

export function TaskCelebrationModal({ visible, remaining, total, onDismiss }: Props) {
  const { theme, themeKey } = useTheme();
  const completed = total - remaining;

  // Animations
  const backdrop  = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.7)).current;
  const cardY     = useRef(new Animated.Value(40)).current;
  const mascotY   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset
      backdrop.setValue(0);
      cardScale.setValue(0.7);
      cardY.setValue(40);

      // Entrance
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
        Animated.spring(cardY,     { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
      ]).start();

      // Mascot gentle bounce loop
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(mascotY, { toValue: -10, duration: 500, useNativeDriver: true }),
          Animated.timing(mascotY, { toValue:   0, duration: 500, useNativeDriver: true }),
        ])
      );
      bounce.start();

      // Auto-dismiss after 2.5 s
      const timer = setTimeout(() => {
        dismiss();
        bounce.stop();
      }, 2500);

      return () => {
        clearTimeout(timer);
        bounce.stop();
        mascotY.setValue(0);
      };
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(backdrop,  { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.85, duration: 180, useNativeDriver: true }),
      Animated.timing(cardY,     { toValue: 30,   duration: 180, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  const headline = getHeadline(remaining, themeKey);
  const body     = getBody(remaining, completed, total, themeKey);
  const allDone  = remaining === 0;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={dismiss}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={dismiss}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Backdrop */}
        <Animated.View style={{
          ...({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as any),
          backgroundColor: '#000',
          opacity: Animated.multiply(backdrop, 0.45),
        }} />

        {/* Card */}
        <Animated.View
          style={{
            transform: [{ scale: cardScale }, { translateY: cardY }],
            width: SW * 0.82,
            backgroundColor: '#FFFFFF',
            borderRadius: 28,
            paddingHorizontal: 28,
            paddingTop: 32,
            paddingBottom: 28,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.25,
            shadowRadius: 40,
            elevation: 20,
          }}
        >
          {/* Mascot */}
          <Animated.View style={{ transform: [{ translateY: mascotY }], marginBottom: 10 }}>
            <WelcomeMascot themeKey={themeKey} size={110} />
          </Animated.View>

          {/* All-done ring glow */}
          {allDone && (
            <View style={{
              position: 'absolute', top: 16,
              width: 130, height: 130, borderRadius: 65,
              backgroundColor: theme.colors.primary + '15',
            }} />
          )}

          {/* Headline */}
          <Text style={{
            color:      '#1C1C1E',
            fontSize:   themeKey === 'hardcore' ? 22 : 20,
            fontWeight: '900',
            letterSpacing: -0.5,
            textAlign:  'center',
            marginBottom: 8,
          }}>
            {headline}
          </Text>

          {/* Body */}
          <Text style={{
            color:      '#666666',
            fontSize:   14,
            fontWeight: '500',
            textAlign:  'center',
            lineHeight: 20,
          }}>
            {body}
          </Text>

          {/* Progress dots */}
          {total > 0 && (
            <ProgressDots total={total} completed={completed} primary={theme.colors.primary} />
          )}

          {/* Dismiss hint */}
          <Text style={{
            color:      'rgba(0,0,0,0.2)',
            fontSize:   11,
            fontWeight: '500',
            marginTop:  20,
          }}>
            Tap anywhere to continue
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
