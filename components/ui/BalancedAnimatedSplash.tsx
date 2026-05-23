import { useEffect, useRef } from 'react';
import { Text, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import Svg, {
  Circle, Ellipse, Path, Defs, Polygon,
  RadialGradient as SvgRadialGrad,
  Stop,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// ─── Hexagon positions ────────────────────────────────────────────────────────

const HEXES = [
  { x: 0.07, y: 0.11, size: 44, color: '#4F46E5', filled: true,  delay: 200 },
  { x: 0.88, y: 0.09, size: 36, color: '#06B6D4', filled: false, delay: 400 },
  { x: 0.94, y: 0.28, size: 52, color: '#4F46E5', filled: false, delay: 150 },
  { x: 0.05, y: 0.36, size: 30, color: '#06B6D4', filled: true,  delay: 600 },
  { x: 0.91, y: 0.56, size: 46, color: '#4F46E5', filled: true,  delay: 350 },
  { x: 0.06, y: 0.62, size: 38, color: '#06B6D4', filled: false, delay: 500 },
  { x: 0.86, y: 0.80, size: 34, color: '#4F46E5', filled: false, delay: 250 },
  { x: 0.09, y: 0.83, size: 48, color: '#06B6D4', filled: true,  delay: 450 },
];

// ─── Glowing dot positions ────────────────────────────────────────────────────

const DOTS = [
  { x: 0.22, y: 0.07, size: 8,  delay: 100 },
  { x: 0.74, y: 0.16, size: 6,  delay: 350 },
  { x: 0.16, y: 0.50, size: 10, delay: 550 },
  { x: 0.82, y: 0.43, size: 7,  delay: 200 },
  { x: 0.30, y: 0.89, size: 9,  delay: 700 },
  { x: 0.68, y: 0.89, size: 6,  delay: 450 },
];

// ─── Hexagon SVG ──────────────────────────────────────────────────────────────

function HexSVG({ size, color, filled }: { size: number; color: string; filled: boolean }) {
  const c = size / 2;
  const r = c * 0.84;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * (Math.PI / 180);
    return `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`;
  }).join(' ');

  return (
    <Svg width={size} height={size}>
      <Polygon
        points={pts}
        fill={filled ? color : 'transparent'}
        stroke={color}
        strokeWidth={size * 0.08}
        fillOpacity={filled ? 0.55 : 0}
        strokeOpacity={0.75}
      />
    </Svg>
  );
}

// ─── Animated hexagon ─────────────────────────────────────────────────────────

function AnimatedHex({ x, y, size, color, filled, delay, idx }: typeof HEXES[0] & { idx: number }) {
  const rotate  = useRef(new Animated.Value(0)).current;
  const ty      = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 0.80, duration: 700, useNativeDriver: true }),
    ]).start();

    const rot = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 7000 + idx * 850,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(ty, { toValue: -10, duration: 2800 + idx * 350, useNativeDriver: true }),
        Animated.timing(ty, { toValue: 0,   duration: 2800 + idx * 350, useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => { rot.start(); float.start(); }, delay + 400);
    return () => { clearTimeout(t); rot.stop(); float.stop(); };
  }, []);

  const rotateDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x * width  - size / 2,
        top:  y * height - size / 2,
        opacity,
        transform: [{ rotate: rotateDeg }, { translateY: ty }],
      }}
    >
      <HexSVG size={size} color={color} filled={filled} />
    </Animated.View>
  );
}

// ─── Pulsing dot ──────────────────────────────────────────────────────────────

function AnimatedDot({ x, y, size, delay }: typeof DOTS[0]) {
  const scale   = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 0.72, duration: 500, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 1500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => pulse.start(), delay + 300);
    return () => { clearTimeout(t); pulse.stop(); };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x * width  - size / 2,
        top:  y * height - size / 2,
        opacity,
        transform: [{ scale }],
      }}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="#06B6D4" />
      </Svg>
    </Animated.View>
  );
}

// ─── Balanced mascot (focused, professional, glasses) ─────────────────────────

function BalancedMascot({ size }: { size: number }) {
  const s   = size;
  const cx  = s * 0.5;
  const bCy = s * 0.47;
  const bRx = s * 0.30;
  const bRy = s * 0.36;

  const eyeY  = bCy - bRy * 0.14;
  const eyeLx = cx - s * 0.135;
  const eyeRx = cx + s * 0.135;
  const eR    = s * 0.112;
  const iR    = s * 0.074;
  const pR    = s * 0.050;

  return (
    <Svg width={s} height={s}>
      <Defs>
        {/* Body: light blue-lavender → indigo → deep navy */}
        <SvgRadialGrad id="bBody" cx="30%" cy="22%" r="78%">
          <Stop offset="0%"   stopColor="#A0B0FF" />
          <Stop offset="35%"  stopColor="#4050D8" />
          <Stop offset="100%" stopColor="#0A0A70" />
        </SvgRadialGrad>
        {/* Belly */}
        <SvgRadialGrad id="bBelly" cx="50%" cy="65%" r="55%">
          <Stop offset="0%"   stopColor="#C0D0FF" stopOpacity="0.50" />
          <Stop offset="100%" stopColor="#C0D0FF" stopOpacity="0"    />
        </SvgRadialGrad>
        {/* Iris: cyan → deep teal */}
        <SvgRadialGrad id="bIris" cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor="#80E0FF" />
          <Stop offset="100%" stopColor="#004A70" />
        </SvgRadialGrad>
        {/* Arms */}
        <SvgRadialGrad id="bArm" cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor="#7080F8" />
          <Stop offset="100%" stopColor="#1020A0" />
        </SvgRadialGrad>
        {/* Feet */}
        <SvgRadialGrad id="bFoot" cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor="#5060E8" />
          <Stop offset="100%" stopColor="#080870" />
        </SvgRadialGrad>
        {/* Ear bumps */}
        <SvgRadialGrad id="bEar" cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor="#7080F8" />
          <Stop offset="100%" stopColor="#1020A0" />
        </SvgRadialGrad>
        {/* Ground glow */}
        <SvgRadialGrad id="bGnd" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="rgba(60,80,220,0.22)" />
          <Stop offset="100%" stopColor="rgba(60,80,220,0)"    />
        </SvgRadialGrad>
      </Defs>

      {/* Ground shadow */}
      <Ellipse cx={cx} cy={bCy + bRy * 1.08} rx={bRx * 0.85} ry={bRy * 0.12} fill="url(#bGnd)" />

      {/* Feet */}
      <Ellipse cx={cx - s*0.105} cy={bCy + bRy*0.90} rx={s*0.090} ry={s*0.065} fill="url(#bFoot)" />
      <Ellipse cx={cx + s*0.105} cy={bCy + bRy*0.90} rx={s*0.090} ry={s*0.065} fill="url(#bFoot)" />
      <Ellipse cx={cx - s*0.118} cy={bCy + bRy*0.85} rx={s*0.034} ry={s*0.022} fill="rgba(160,180,255,0.30)" />
      <Ellipse cx={cx + s*0.092} cy={bCy + bRy*0.85} rx={s*0.034} ry={s*0.022} fill="rgba(160,180,255,0.30)" />

      {/* Ear bumps */}
      <Circle cx={cx - bRx*0.50} cy={bCy - bRy*0.88} r={s*0.068} fill="url(#bEar)" />
      <Circle cx={cx + bRx*0.50} cy={bCy - bRy*0.88} r={s*0.068} fill="url(#bEar)" />
      <Ellipse cx={cx - bRx*0.50} cy={bCy - bRy*0.91} rx={s*0.032} ry={s*0.028} fill="#A0B0FF" opacity="0.50" />
      <Ellipse cx={cx + bRx*0.50} cy={bCy - bRy*0.91} rx={s*0.032} ry={s*0.028} fill="#A0B0FF" opacity="0.50" />

      {/* Body */}
      <Ellipse cx={cx} cy={bCy} rx={bRx} ry={bRy} fill="url(#bBody)" />
      <Ellipse cx={cx} cy={bCy + bRy*0.28} rx={bRx*0.68} ry={bRy*0.52} fill="url(#bBelly)" />

      {/* Arms */}
      <Circle cx={cx - bRx*1.02} cy={bCy - bRy*0.04} r={s*0.090} fill="url(#bArm)" />
      <Circle cx={cx + bRx*1.02} cy={bCy - bRy*0.04} r={s*0.090} fill="url(#bArm)" />
      <Circle cx={cx - bRx*1.06} cy={bCy - bRy*0.10} r={s*0.038} fill="rgba(180,200,255,0.32)" />
      <Circle cx={cx + bRx*0.98} cy={bCy - bRy*0.10} r={s*0.038} fill="rgba(180,200,255,0.32)" />

      {/* ── Eyes — slightly focused (ry 88%) ── */}
      <Ellipse cx={eyeLx} cy={eyeY} rx={eR} ry={eR * 0.88} fill="white" />
      <Ellipse cx={eyeRx} cy={eyeY} rx={eR} ry={eR * 0.88} fill="white" />
      {/* Iris */}
      <Circle cx={eyeLx} cy={eyeY + eR*0.05} r={iR} fill="url(#bIris)" />
      <Circle cx={eyeRx} cy={eyeY + eR*0.05} r={iR} fill="url(#bIris)" />
      {/* Pupil */}
      <Circle cx={eyeLx} cy={eyeY + eR*0.07} r={pR} fill="#010218" />
      <Circle cx={eyeRx} cy={eyeY + eR*0.07} r={pR} fill="#010218" />
      {/* Eye shine */}
      <Circle cx={eyeLx - iR*0.32} cy={eyeY - iR*0.35} r={s*0.028} fill="white" />
      <Circle cx={eyeRx - iR*0.32} cy={eyeY - iR*0.35} r={s*0.028} fill="white" />
      <Circle cx={eyeLx + iR*0.28} cy={eyeY + iR*0.06} r={s*0.014} fill="rgba(255,255,255,0.65)" />
      <Circle cx={eyeRx + iR*0.28} cy={eyeY + iR*0.06} r={s*0.014} fill="rgba(255,255,255,0.65)" />

      {/* ── Glasses (round professional frames) ── */}
      <Circle cx={eyeLx} cy={eyeY} r={eR * 1.10} fill="none" stroke="#C0D0FF" strokeWidth={s * 0.018} strokeOpacity="0.88" />
      <Circle cx={eyeRx} cy={eyeY} r={eR * 1.10} fill="none" stroke="#C0D0FF" strokeWidth={s * 0.018} strokeOpacity="0.88" />
      {/* Bridge */}
      <Path
        d={`M ${eyeLx + eR*1.10} ${eyeY - eR*0.05} L ${eyeRx - eR*1.10} ${eyeY - eR*0.05}`}
        stroke="#C0D0FF" strokeWidth={s * 0.013} strokeOpacity="0.80"
      />
      {/* Temples */}
      <Path
        d={`M ${eyeLx - eR*1.10} ${eyeY} L ${eyeLx - eR*1.42} ${eyeY + eR*0.28}`}
        stroke="#C0D0FF" strokeWidth={s * 0.012} strokeLinecap="round" strokeOpacity="0.72"
      />
      <Path
        d={`M ${eyeRx + eR*1.10} ${eyeY} L ${eyeRx + eR*1.42} ${eyeY + eR*0.28}`}
        stroke="#C0D0FF" strokeWidth={s * 0.012} strokeLinecap="round" strokeOpacity="0.72"
      />

      {/* ── Determined eyebrows — level, slight inward angle ── */}
      <Path
        d={`M ${eyeLx - eR*0.72} ${eyeY - eR*0.86} L ${eyeLx + eR*0.58} ${eyeY - eR*0.68}`}
        stroke="#0A0A60" strokeWidth={s * 0.030} strokeLinecap="round"
      />
      <Path
        d={`M ${eyeRx - eR*0.58} ${eyeY - eR*0.68} L ${eyeRx + eR*0.72} ${eyeY - eR*0.86}`}
        stroke="#0A0A60" strokeWidth={s * 0.030} strokeLinecap="round"
      />

      {/* ── Confident slight smile ── */}
      <Path
        d={`M ${cx - s*0.125} ${bCy + bRy*0.27} Q ${cx} ${bCy + bRy*0.40} ${cx + s*0.125} ${bCy + bRy*0.27}`}
        stroke="#1A1A80" strokeWidth={s * 0.020} fill="none" strokeLinecap="round"
      />

      {/* ── Body gloss ── */}
      <Ellipse
        cx={cx - bRx*0.16}
        cy={bCy - bRy*0.60}
        rx={bRx*0.52}
        ry={bRy*0.16}
        fill="rgba(200,220,255,0.38)"
        transform={`rotate(-16 ${cx - bRx*0.16} ${bCy - bRy*0.60})`}
      />
      <Ellipse
        cx={cx - bRx*0.62}
        cy={bCy - bRy*0.22}
        rx={bRx*0.18}
        ry={bRy*0.36}
        fill="rgba(200,220,255,0.18)"
        transform={`rotate(-10 ${cx - bRx*0.62} ${bCy - bRy*0.22})`}
      />
    </Svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BalancedAnimatedSplash({ onFinish }: { onFinish?: () => void }) {
  const mascotScale   = useRef(new Animated.Value(0.7)).current;
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const mascotFloat   = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textY         = useRef(new Animated.Value(16)).current;
  const bgOpacity     = useRef(new Animated.Value(0)).current;

  const MASCOT_SIZE = width * 0.58;

  useEffect(() => {
    Animated.timing(bgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();

    // Smooth professional entrance
    Animated.sequence([
      Animated.delay(220),
      Animated.parallel([
        Animated.spring(mascotScale,   { toValue: 1, useNativeDriver: true, tension: 45, friction: 9 }),
        Animated.timing(mascotOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Text slides up
    Animated.sequence([
      Animated.delay(780),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Slow, smooth float (professional feel)
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloat, { toValue: -12, duration: 2200, useNativeDriver: true }),
        Animated.timing(mascotFloat, { toValue: 0,   duration: 2200, useNativeDriver: true }),
      ])
    );
    Animated.delay(920).start(() => floatLoop.start());

    if (onFinish) {
      const t = setTimeout(onFinish, 3600);
      return () => { clearTimeout(t); floatLoop.stop(); };
    }
    return () => floatLoop.stop();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>

      {HEXES.map((h, i) => <AnimatedHex key={i} {...h} idx={i} />)}
      {DOTS.map((d, i) => <AnimatedDot key={i} {...d} />)}

      <Animated.View
        style={{
          opacity: mascotOpacity,
          transform: [{ scale: mascotScale }, { translateY: mascotFloat }],
        }}
      >
        <BalancedMascot size={MASCOT_SIZE} />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], alignItems: 'center', marginTop: 6 }}>
        <Text style={styles.title}>SURGO</Text>
        <Text style={styles.sub}>⚡ Focus. Execute. Win.</Text>
      </Animated.View>

    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 11,
    color: '#1C1C1E',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: '#4F46E5',
  },
});
