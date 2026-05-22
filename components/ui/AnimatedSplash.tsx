import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// ─── Star positions (fixed layout, animated individually) ─────────────────────

const STARS = [
  { x: 0.12, y: 0.08, size: 18, delay: 0 },
  { x: 0.82, y: 0.06, size: 14, delay: 300 },
  { x: 0.92, y: 0.22, size: 22, delay: 600 },
  { x: 0.05, y: 0.28, size: 12, delay: 150 },
  { x: 0.72, y: 0.15, size: 16, delay: 450 },
  { x: 0.25, y: 0.12, size: 10, delay: 750 },
  { x: 0.88, y: 0.40, size: 14, delay: 200 },
  { x: 0.08, y: 0.48, size: 20, delay: 900 },
  { x: 0.78, y: 0.55, size: 12, delay: 350 },
  { x: 0.18, y: 0.62, size: 16, delay: 550 },
  { x: 0.90, y: 0.68, size: 10, delay: 100 },
  { x: 0.10, y: 0.78, size: 14, delay: 700 },
  { x: 0.85, y: 0.82, size: 18, delay: 250 },
  { x: 0.20, y: 0.88, size: 12, delay: 800 },
  { x: 0.65, y: 0.90, size: 10, delay: 400 },
];

// ─── Flower positions (left and right of mascot) ──────────────────────────────

const FLOWERS = [
  // Left side
  { x: 0.05, y: 0.50, emoji: '🌸', size: 28, delay: 400 },
  { x: 0.12, y: 0.58, emoji: '🌼', size: 22, delay: 700 },
  { x: 0.04, y: 0.65, emoji: '🌷', size: 26, delay: 1000 },
  { x: 0.15, y: 0.70, emoji: '🌿', size: 20, delay: 600 },
  { x: 0.08, y: 0.75, emoji: '🌸', size: 18, delay: 1200 },
  { x: 0.18, y: 0.44, emoji: '✿',  size: 16, delay: 800 },
  // Right side
  { x: 0.82, y: 0.50, emoji: '🌼', size: 28, delay: 500 },
  { x: 0.75, y: 0.58, emoji: '🌸', size: 22, delay: 800 },
  { x: 0.88, y: 0.65, emoji: '🌷', size: 26, delay: 300 },
  { x: 0.78, y: 0.72, emoji: '🌿', size: 20, delay: 1100 },
  { x: 0.86, y: 0.78, emoji: '🌸', size: 18, delay: 650 },
  { x: 0.72, y: 0.44, emoji: '✿',  size: 16, delay: 900 },
];

// ─── Single animated star ─────────────────────────────────────────────────────

function AnimatedStar({
  x, y, size, delay,
}: { x: number; y: number; size: number; delay: number }) {
  const opacity  = useRef(new Animated.Value(0.2)).current;
  const rotate   = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1,   duration: 800, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(rotate,  { toValue: 1,   duration: 1600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 0.8, duration: 800, useNativeDriver: true }),
        ]),
      ]),
    );
    twinkle.start();
    return () => twinkle.stop();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x * width - size / 2,
        top:  y * height - size / 2,
        fontSize: size,
        opacity,
        transform: [{ scale }, { rotate: spin }],
        color: '#F5C842',
      }}
    >
      ✦
    </Animated.Text>
  );
}

// ─── Single animated flower ───────────────────────────────────────────────────

function AnimatedFlower({
  x, y, emoji, size, delay,
}: { x: number; y: number; emoji: string; size: number; delay: number }) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sway    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bloom in
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Gentle sway after bloom
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay + 600),
        Animated.timing(sway, { toValue:  1, duration: 1800, useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 1800, useNativeDriver: true }),
        Animated.timing(sway, { toValue:  0, duration: 1800, useNativeDriver: true }),
      ]),
    );
    swayLoop.start();
    return () => swayLoop.stop();
  }, []);

  const swayDeg = sway.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left:  x * width  - size / 2,
        top:   y * height - size / 2,
        fontSize: size,
        opacity,
        transform: [{ scale }, { rotate: swayDeg }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

// ─── Main AnimatedSplash component ────────────────────────────────────────────

export function AnimatedSplash({ onFinish }: { onFinish?: () => void }) {
  const mascotScale    = useRef(new Animated.Value(0.7)).current;
  const mascotOpacity  = useRef(new Animated.Value(0)).current;
  const mascotFloat    = useRef(new Animated.Value(0)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(16)).current;
  const bgOpacity      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Background fade in
    Animated.timing(bgOpacity, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();

    // Mascot pops in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(mascotScale, {
          toValue: 1, useNativeDriver: true, tension: 50, friction: 7,
        }),
        Animated.timing(mascotOpacity, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // SURGO text slides up
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(textOpacity,    { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // Continuous mascot float
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloat, { toValue: -12, duration: 1800, useNativeDriver: true }),
        Animated.timing(mascotFloat, { toValue:   0, duration: 1800, useNativeDriver: true }),
      ]),
    );
    Animated.delay(900).start(() => floatLoop.start());

    // Auto-dismiss after 3.2s
    if (onFinish) {
      const timer = setTimeout(onFinish, 3200);
      return () => {
        clearTimeout(timer);
        floatLoop.stop();
      };
    }
    return () => floatLoop.stop();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>

      {/* Stars layer */}
      {STARS.map((s, i) => (
        <AnimatedStar key={`star-${i}`} {...s} />
      ))}

      {/* Flowers layer */}
      {FLOWERS.map((f, i) => (
        <AnimatedFlower key={`flower-${i}`} {...f} />
      ))}

      {/* Mascot image */}
      <Animated.View
        style={[
          styles.mascotWrapper,
          {
            opacity: mascotOpacity,
            transform: [
              { scale: mascotScale },
              { translateY: mascotFloat },
            ],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/splash-mascot.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
      </Animated.View>

      {/* SURGO text */}
      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTranslateY }],
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <Text style={styles.title}>SURGO</Text>
        <Text style={styles.subtitle}>Rise every day ✦</Text>
      </Animated.View>

    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrapper: {
    width: width * 0.72,
    height: width * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 10,
    color: '#C8830A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#E8B84A',
    fontWeight: '600',
    letterSpacing: 2,
  },
});
