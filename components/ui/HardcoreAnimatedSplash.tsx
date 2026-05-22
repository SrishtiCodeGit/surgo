import { useEffect, useRef } from 'react';
import { Text, Animated, Dimensions, StyleSheet, Easing, View } from 'react-native';
import Svg, {
  Circle, Ellipse, Path, Defs, Rect,
  RadialGradient as SvgRadialGrad,
  Stop,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// ─── Shockwave ring ───────────────────────────────────────────────────────────
// Expands from mascot center and fades — clean, tactical, no fire

function ShockwaveRing({ delay, size }: { delay: number; size: number }) {
  const scale   = useRef(new Animated.Value(0.35)).current;
  const opacity = useRef(new Animated.Value(0.80)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.6,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Rings are centered at mascot centre ≈ height * 0.41
  const cy = height * 0.41;
  const cx = width * 0.50;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top:  cy - size / 2,
        left: cx - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 0.8,
        borderColor: '#FF3B30',
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ─── Crosshair lines ──────────────────────────────────────────────────────────

function HorizontalLine({ delay }: { delay: number }) {
  const scaleX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(scaleX, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: height * 0.41,
        left: 0,
        width,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255, 59, 48, 0.18)',
        transform: [{ scaleX }],
      }}
    />
  );
}

function VerticalLine({ delay }: { delay: number }) {
  const scaleY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(scaleY, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: width * 0.50,
        width: StyleSheet.hairlineWidth,
        height,
        backgroundColor: 'rgba(255, 59, 48, 0.18)',
        transform: [{ scaleY }],
      }}
    />
  );
}

// ─── Corner bracket decorations ───────────────────────────────────────────────

function Corners({ opacity }: { opacity: Animated.Value }) {
  const c = 'rgba(255,59,48,0.45)';
  const L = 18;
  const T = 2;
  const pad = 40;
  return (
    <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity }}>
      {/* Top-left */}
      <View style={{ position: 'absolute', top: pad, left: pad }}>
        <View style={{ width: L, height: T, backgroundColor: c }} />
        <View style={{ width: T, height: L, backgroundColor: c }} />
      </View>
      {/* Top-right */}
      <View style={{ position: 'absolute', top: pad, right: pad, alignItems: 'flex-end' }}>
        <View style={{ width: L, height: T, backgroundColor: c }} />
        <View style={{ position: 'absolute', right: 0, width: T, height: L, backgroundColor: c }} />
      </View>
      {/* Bottom-left */}
      <View style={{ position: 'absolute', bottom: pad, left: pad, justifyContent: 'flex-end' }}>
        <View style={{ width: T, height: L, backgroundColor: c }} />
        <View style={{ width: L, height: T, backgroundColor: c }} />
      </View>
      {/* Bottom-right */}
      <View style={{ position: 'absolute', bottom: pad, right: pad, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <View style={{ position: 'absolute', right: 0, bottom: 0, width: T, height: L, backgroundColor: c }} />
        <View style={{ position: 'absolute', bottom: 0, width: L, height: T, backgroundColor: c }} />
      </View>
    </Animated.View>
  );
}

// ─── Hardcore mascot (unchanged) ──────────────────────────────────────────────

function HardcoreMascot({ size }: { size: number }) {
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
        <SvgRadialGrad id="hBody" cx="30%" cy="22%" r="78%">
          <Stop offset="0%"   stopColor="#FF8060" />
          <Stop offset="35%"  stopColor="#FF2800" />
          <Stop offset="100%" stopColor="#6A0000" />
        </SvgRadialGrad>
        <SvgRadialGrad id="hBelly" cx="50%" cy="65%" r="55%">
          <Stop offset="0%"   stopColor="#FF6040" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#FF6040" stopOpacity="0"    />
        </SvgRadialGrad>
        <SvgRadialGrad id="hIris" cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor="#FF9060" />
          <Stop offset="100%" stopColor="#8A0000" />
        </SvgRadialGrad>
        <SvgRadialGrad id="hArm" cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor="#FF5040" />
          <Stop offset="100%" stopColor="#7A0000" />
        </SvgRadialGrad>
        <SvgRadialGrad id="hFoot" cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor="#DD3020" />
          <Stop offset="100%" stopColor="#5A0000" />
        </SvgRadialGrad>
        <SvgRadialGrad id="hEar" cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor="#FF5040" />
          <Stop offset="100%" stopColor="#7A0000" />
        </SvgRadialGrad>
        <SvgRadialGrad id="hGnd" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="rgba(255,60,0,0.22)" />
          <Stop offset="100%" stopColor="rgba(255,60,0,0)"    />
        </SvgRadialGrad>
      </Defs>

      <Ellipse cx={cx} cy={bCy + bRy * 1.08} rx={bRx * 1.25} ry={bRy * 0.20} fill="url(#hGnd)" />

      <Ellipse cx={cx - s*0.105} cy={bCy + bRy*0.90} rx={s*0.090} ry={s*0.065} fill="url(#hFoot)" />
      <Ellipse cx={cx + s*0.105} cy={bCy + bRy*0.90} rx={s*0.090} ry={s*0.065} fill="url(#hFoot)" />

      <Circle cx={cx - bRx*0.50} cy={bCy - bRy*0.88} r={s*0.068} fill="url(#hEar)" />
      <Circle cx={cx + bRx*0.50} cy={bCy - bRy*0.88} r={s*0.068} fill="url(#hEar)" />
      <Ellipse cx={cx - bRx*0.50} cy={bCy - bRy*0.91} rx={s*0.032} ry={s*0.028} fill="#FF7050" opacity="0.45" />
      <Ellipse cx={cx + bRx*0.50} cy={bCy - bRy*0.91} rx={s*0.032} ry={s*0.028} fill="#FF7050" opacity="0.45" />

      <Ellipse cx={cx} cy={bCy} rx={bRx} ry={bRy} fill="url(#hBody)" />
      <Ellipse cx={cx} cy={bCy + bRy*0.28} rx={bRx*0.68} ry={bRy*0.52} fill="url(#hBelly)" />

      <Circle cx={cx - bRx*1.02} cy={bCy - bRy*0.14} r={s*0.090} fill="url(#hArm)" />
      <Circle cx={cx + bRx*1.02} cy={bCy - bRy*0.14} r={s*0.090} fill="url(#hArm)" />

      <Ellipse cx={eyeLx} cy={eyeY} rx={eR} ry={eR * 0.68} fill="white" />
      <Ellipse cx={eyeRx} cy={eyeY} rx={eR} ry={eR * 0.68} fill="white" />
      <Circle  cx={eyeLx} cy={eyeY + eR*0.04} r={iR} fill="url(#hIris)" />
      <Circle  cx={eyeRx} cy={eyeY + eR*0.04} r={iR} fill="url(#hIris)" />
      <Circle  cx={eyeLx} cy={eyeY + eR*0.06} r={pR} fill="#080000" />
      <Circle  cx={eyeRx} cy={eyeY + eR*0.06} r={pR} fill="#080000" />
      <Circle  cx={eyeLx - iR*0.32} cy={eyeY - iR*0.28} r={s*0.024} fill="white" />
      <Circle  cx={eyeRx - iR*0.32} cy={eyeY - iR*0.28} r={s*0.024} fill="white" />

      <Path
        d={`M ${eyeLx - eR*0.82} ${eyeY - eR*0.76} L ${eyeLx + eR*0.58} ${eyeY - eR*0.50}`}
        stroke="#2A0000" strokeWidth={s * 0.040} strokeLinecap="round"
      />
      <Path
        d={`M ${eyeRx - eR*0.58} ${eyeY - eR*0.50} L ${eyeRx + eR*0.82} ${eyeY - eR*0.76}`}
        stroke="#2A0000" strokeWidth={s * 0.040} strokeLinecap="round"
      />

      <Path
        d={`M ${cx - s*0.145} ${bCy + bRy*0.32} Q ${cx} ${bCy + bRy*0.20} ${cx + s*0.145} ${bCy + bRy*0.32}`}
        stroke="#2A0000" strokeWidth={s * 0.022} fill="none" strokeLinecap="round"
      />
      <Rect
        x={cx - s*0.100} y={bCy + bRy*0.246}
        width={s * 0.200} height={s * 0.038}
        rx={s * 0.009} fill="white"
      />
      <Path d={`M ${cx - s*0.034} ${bCy + bRy*0.246} V ${bCy + bRy*0.246 + s*0.038}`} stroke="#BBA0A0" strokeWidth={s * 0.009} />
      <Path d={`M ${cx + s*0.034} ${bCy + bRy*0.246} V ${bCy + bRy*0.246 + s*0.038}`} stroke="#BBA0A0" strokeWidth={s * 0.009} />

      <Ellipse cx={cx - bRx*0.16} cy={bCy - bRy*0.60} rx={bRx*0.52} ry={bRy*0.16}
        fill="rgba(255,200,120,0.22)" transform={`rotate(-16 ${cx - bRx*0.16} ${bCy - bRy*0.60})`} />
    </Svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HardcoreAnimatedSplash({ onFinish }: { onFinish?: () => void }) {
  const mascotScale   = useRef(new Animated.Value(0.28)).current;
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textY         = useRef(new Animated.Value(18)).current;
  const bgOpacity     = useRef(new Animated.Value(0)).current;
  const cornerOpacity = useRef(new Animated.Value(0)).current;

  const MASCOT_SIZE = width * 0.52;
  const RING_SIZE   = width * 0.46;

  useEffect(() => {
    // Bg
    Animated.timing(bgOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();

    // Corner brackets
    Animated.sequence([
      Animated.delay(60),
      Animated.timing(cornerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Mascot slams in
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(mascotScale,   { toValue: 1, useNativeDriver: true, tension: 90, friction: 6 }),
        Animated.timing(mascotOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]),
    ]).start();

    // Text
    Animated.sequence([
      Animated.delay(860),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 360, useNativeDriver: true }),
      ]),
    ]).start();

    if (onFinish) {
      const t = setTimeout(onFinish, 3400);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>

      {/* Crosshair lines */}
      <HorizontalLine delay={50} />
      <VerticalLine   delay={90} />

      {/* Shockwave rings */}
      <ShockwaveRing delay={80}  size={RING_SIZE} />
      <ShockwaveRing delay={300} size={RING_SIZE} />
      <ShockwaveRing delay={520} size={RING_SIZE} />

      {/* Corner brackets */}
      <Corners opacity={cornerOpacity} />

      {/* Mascot */}
      <Animated.View
        style={{
          opacity:   mascotOpacity,
          transform: [{ scale: mascotScale }],
          marginBottom: 0,
        }}
      >
        <HardcoreMascot size={MASCOT_SIZE} />
      </Animated.View>

      {/* Text */}
      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], alignItems: 'center', marginTop: 10 }}>
        <Text style={styles.title}>SURGO</Text>
        <View style={styles.divider} />
        <Text style={styles.sub}>NO EXCUSES.</Text>
      </Animated.View>

    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  divider: {
    width: 32,
    height: 1.5,
    backgroundColor: '#FF3B30',
    marginBottom: 8,
  },
  sub: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#FF3B30',
  },
});
