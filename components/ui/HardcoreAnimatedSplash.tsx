import { useEffect, useRef } from 'react';
import { Text, Animated, Dimensions, StyleSheet } from 'react-native';
import Svg, {
  Circle, Ellipse, Path, Defs, Rect,
  RadialGradient as SvgRadialGrad,
  LinearGradient as SvgLinearGrad,
  Stop,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// ─── Flame positions ──────────────────────────────────────────────────────────

const FLAMES = [
  { xf: 0.12, flameH: 210, flameW: 75,  delay: 0,   dur: 420 },
  { xf: 0.25, flameH: 295, flameW: 102, delay: 160, dur: 380 },
  { xf: 0.36, flameH: 255, flameW: 90,  delay: 80,  dur: 450 },
  { xf: 0.50, flameH: 345, flameW: 122, delay: 0,   dur: 360 },
  { xf: 0.64, flameH: 262, flameW: 94,  delay: 200, dur: 410 },
  { xf: 0.75, flameH: 285, flameW: 100, delay: 100, dur: 390 },
  { xf: 0.88, flameH: 225, flameW: 82,  delay: 50,  dur: 440 },
];

// ─── Ember positions ──────────────────────────────────────────────────────────

const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  xf:      0.12 + (i * 0.058) % 0.76,
  size:    3 + (i * 2) % 5,
  delay:   (i * 190) % 1800,
  duration: 1500 + (i * 140) % 1100,
}));

// ─── Flame SVG shape ──────────────────────────────────────────────────────────

function FlameSVG({ w, h, id }: { w: number; h: number; id: string }) {
  // cx is the horizontal centre of the SVG — all coords stay within [0, w]
  const cx = w / 2;
  const hw = w / 2;
  const d = [
    `M ${cx} ${h}`,
    `C ${cx - hw} ${h * 0.72}  ${cx - hw * 0.88} ${h * 0.46}  ${cx - hw * 0.22} ${h * 0.28}`,
    `Q ${cx - hw * 0.08} ${h * 0.13}  ${cx} 0`,
    `Q ${cx + hw * 0.08} ${h * 0.13}  ${cx + hw * 0.22} ${h * 0.28}`,
    `C ${cx + hw * 0.88} ${h * 0.46}  ${cx + hw} ${h * 0.72}  ${cx} ${h}`,
    'Z',
  ].join(' ');

  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgLinearGrad id={id} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%"   stopColor="#FF1A00" stopOpacity="1"   />
          <Stop offset="38%"  stopColor="#FF6600" stopOpacity="1"   />
          <Stop offset="72%"  stopColor="#FFD000" stopOpacity="0.92" />
          <Stop offset="100%" stopColor="#FFFFFF"  stopOpacity="0.25" />
        </SvgLinearGrad>
      </Defs>
      <Path d={d} fill={`url(#${id})`} />
    </Svg>
  );
}

// ─── Animated flame ───────────────────────────────────────────────────────────

function AnimatedFlame({
  xf, flameH, flameW, delay, dur, idx,
}: typeof FLAMES[0] & { idx: number }) {
  const scaleY  = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const tx      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleY,  { toValue: 1, useNativeDriver: true, tension: 38, friction: 8 }),
        Animated.timing(opacity, { toValue: 0.90, duration: 480, useNativeDriver: true }),
      ]),
    ]).start();

    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleY, { toValue: 1.12, duration: dur * 0.38, useNativeDriver: true }),
        Animated.timing(scaleY, { toValue: 0.79, duration: dur * 0.34, useNativeDriver: true }),
        Animated.timing(scaleY, { toValue: 1.0,  duration: dur * 0.28, useNativeDriver: true }),
      ])
    );
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(tx, { toValue:  flameW * 0.09, duration: dur * 1.3, useNativeDriver: true }),
        Animated.timing(tx, { toValue: -flameW * 0.09, duration: dur * 1.3, useNativeDriver: true }),
        Animated.timing(tx, { toValue: 0,              duration: dur * 0.8, useNativeDriver: true }),
      ])
    );

    const t = setTimeout(() => { flicker.start(); sway.start(); }, delay + 520);
    return () => { clearTimeout(t); flicker.stop(); sway.stop(); };
  }, []);

  // keep flame bottom anchored while scaleY changes
  const translateY = scaleY.interpolate({
    inputRange:  [0.7, 1.0, 1.15],
    outputRange: [flameH * 0.15, 0, -flameH * 0.075],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: xf * width - flameW / 2,
        top:  height - flameH,
        opacity,
        transform: [{ scaleY }, { translateX: tx }, { translateY }],
      }}
    >
      <FlameSVG w={flameW} h={flameH} id={`hfl${idx}`} />
    </Animated.View>
  );
}

// ─── Floating ember ───────────────────────────────────────────────────────────

function AnimatedEmber({ xf, size, delay, duration }: typeof EMBERS[0]) {
  const ty      = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const runCycle = () => {
      ty.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(ty,      { toValue: -(height * 0.58), duration, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: Math.floor(duration * 0.20), useNativeDriver: true }),
        ]),
      ]).start(({ finished }) => {
        if (finished) {
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => runCycle());
        }
      });
    };
    runCycle();
    return () => { ty.stopAnimation(); opacity.stopAnimation(); };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: xf * width,
        top: height * 0.76,
        opacity,
        transform: [{ translateY: ty }],
      }}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="#FF8C00" />
      </Svg>
    </Animated.View>
  );
}

// ─── Hardcore mascot (aggressive) ─────────────────────────────────────────────

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
        {/* Body: vivid red → dark crimson */}
        <SvgRadialGrad id="hBody" cx="30%" cy="22%" r="78%">
          <Stop offset="0%"   stopColor="#FF8060" />
          <Stop offset="35%"  stopColor="#FF2800" />
          <Stop offset="100%" stopColor="#6A0000" />
        </SvgRadialGrad>
        {/* Belly */}
        <SvgRadialGrad id="hBelly" cx="50%" cy="65%" r="55%">
          <Stop offset="0%"   stopColor="#FF6040" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#FF6040" stopOpacity="0"    />
        </SvgRadialGrad>
        {/* Iris: orange-red */}
        <SvgRadialGrad id="hIris" cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor="#FF9060" />
          <Stop offset="100%" stopColor="#8A0000" />
        </SvgRadialGrad>
        {/* Arms */}
        <SvgRadialGrad id="hArm" cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor="#FF5040" />
          <Stop offset="100%" stopColor="#7A0000" />
        </SvgRadialGrad>
        {/* Feet */}
        <SvgRadialGrad id="hFoot" cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor="#DD3020" />
          <Stop offset="100%" stopColor="#5A0000" />
        </SvgRadialGrad>
        {/* Ear bumps */}
        <SvgRadialGrad id="hEar" cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor="#FF5040" />
          <Stop offset="100%" stopColor="#7A0000" />
        </SvgRadialGrad>
        {/* Ground glow */}
        <SvgRadialGrad id="hGnd" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="rgba(255,60,0,0.35)" />
          <Stop offset="100%" stopColor="rgba(255,60,0,0)"    />
        </SvgRadialGrad>
      </Defs>

      {/* Ground fire glow */}
      <Ellipse cx={cx} cy={bCy + bRy * 1.08} rx={bRx * 1.25} ry={bRy * 0.20} fill="url(#hGnd)" />

      {/* Feet */}
      <Ellipse cx={cx - s*0.105} cy={bCy + bRy*0.90} rx={s*0.090} ry={s*0.065} fill="url(#hFoot)" />
      <Ellipse cx={cx + s*0.105} cy={bCy + bRy*0.90} rx={s*0.090} ry={s*0.065} fill="url(#hFoot)" />
      <Ellipse cx={cx - s*0.118} cy={bCy + bRy*0.85} rx={s*0.034} ry={s*0.022} fill="rgba(255,120,60,0.28)" />
      <Ellipse cx={cx + s*0.092} cy={bCy + bRy*0.85} rx={s*0.034} ry={s*0.022} fill="rgba(255,120,60,0.28)" />

      {/* Ear bumps */}
      <Circle cx={cx - bRx*0.50} cy={bCy - bRy*0.88} r={s*0.068} fill="url(#hEar)" />
      <Circle cx={cx + bRx*0.50} cy={bCy - bRy*0.88} r={s*0.068} fill="url(#hEar)" />
      <Ellipse cx={cx - bRx*0.50} cy={bCy - bRy*0.91} rx={s*0.032} ry={s*0.028} fill="#FF7050" opacity="0.45" />
      <Ellipse cx={cx + bRx*0.50} cy={bCy - bRy*0.91} rx={s*0.032} ry={s*0.028} fill="#FF7050" opacity="0.45" />

      {/* Body */}
      <Ellipse cx={cx} cy={bCy} rx={bRx} ry={bRy} fill="url(#hBody)" />
      {/* Belly patch */}
      <Ellipse cx={cx} cy={bCy + bRy*0.28} rx={bRx*0.68} ry={bRy*0.52} fill="url(#hBelly)" />

      {/* Arms — raised (aggressive) */}
      <Circle cx={cx - bRx*1.02} cy={bCy - bRy*0.14} r={s*0.090} fill="url(#hArm)" />
      <Circle cx={cx + bRx*1.02} cy={bCy - bRy*0.14} r={s*0.090} fill="url(#hArm)" />
      <Circle cx={cx - bRx*1.06} cy={bCy - bRy*0.21} r={s*0.038} fill="rgba(255,160,80,0.26)" />
      <Circle cx={cx + bRx*0.98} cy={bCy - bRy*0.21} r={s*0.038} fill="rgba(255,160,80,0.26)" />

      {/* ── Squinted eyes ── */}
      <Ellipse cx={eyeLx} cy={eyeY} rx={eR} ry={eR * 0.68} fill="white" />
      <Ellipse cx={eyeRx} cy={eyeY} rx={eR} ry={eR * 0.68} fill="white" />
      {/* Iris */}
      <Circle cx={eyeLx} cy={eyeY + eR*0.04} r={iR} fill="url(#hIris)" />
      <Circle cx={eyeRx} cy={eyeY + eR*0.04} r={iR} fill="url(#hIris)" />
      {/* Pupil */}
      <Circle cx={eyeLx} cy={eyeY + eR*0.06} r={pR} fill="#080000" />
      <Circle cx={eyeRx} cy={eyeY + eR*0.06} r={pR} fill="#080000" />
      {/* Eye shine */}
      <Circle cx={eyeLx - iR*0.32} cy={eyeY - iR*0.28} r={s*0.024} fill="white" />
      <Circle cx={eyeRx - iR*0.32} cy={eyeY - iR*0.28} r={s*0.024} fill="white" />

      {/* ── Angry eyebrows (V-shape angled toward nose) ── */}
      <Path
        d={`M ${eyeLx - eR*0.82} ${eyeY - eR*0.76}  L ${eyeLx + eR*0.58} ${eyeY - eR*0.50}`}
        stroke="#2A0000"
        strokeWidth={s * 0.040}
        strokeLinecap="round"
      />
      <Path
        d={`M ${eyeRx - eR*0.58} ${eyeY - eR*0.50}  L ${eyeRx + eR*0.82} ${eyeY - eR*0.76}`}
        stroke="#2A0000"
        strokeWidth={s * 0.040}
        strokeLinecap="round"
      />

      {/* ── Gritted frown ── */}
      <Path
        d={`M ${cx - s*0.145} ${bCy + bRy*0.32} Q ${cx} ${bCy + bRy*0.20} ${cx + s*0.145} ${bCy + bRy*0.32}`}
        stroke="#2A0000"
        strokeWidth={s * 0.022}
        fill="none"
        strokeLinecap="round"
      />
      {/* Teeth bar */}
      <Rect
        x={cx - s*0.100}
        y={bCy + bRy*0.246}
        width={s * 0.200}
        height={s * 0.038}
        rx={s * 0.009}
        fill="white"
      />
      {/* Tooth dividers */}
      <Path
        d={`M ${cx - s*0.034} ${bCy + bRy*0.246}  V ${bCy + bRy*0.246 + s*0.038}`}
        stroke="#BBA0A0" strokeWidth={s * 0.009}
      />
      <Path
        d={`M ${cx + s*0.034} ${bCy + bRy*0.246}  V ${bCy + bRy*0.246 + s*0.038}`}
        stroke="#BBA0A0" strokeWidth={s * 0.009}
      />

      {/* Fire blush (orange glow) */}
      <Ellipse cx={eyeLx - eR*0.62} cy={bCy + bRy*0.06} rx={eR*0.80} ry={eR*0.50} fill="#FF4400" opacity="0.28" />
      <Ellipse cx={eyeRx + eR*0.62} cy={bCy + bRy*0.06} rx={eR*0.80} ry={eR*0.50} fill="#FF4400" opacity="0.28" />

      {/* Body top gloss */}
      <Ellipse
        cx={cx - bRx*0.16}
        cy={bCy - bRy*0.60}
        rx={bRx*0.52}
        ry={bRy*0.16}
        fill="rgba(255,200,120,0.28)"
        transform={`rotate(-16 ${cx - bRx*0.16} ${bCy - bRy*0.60})`}
      />
    </Svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HardcoreAnimatedSplash({ onFinish }: { onFinish?: () => void }) {
  const mascotScale   = useRef(new Animated.Value(0.5)).current;
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const mascotFloat   = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textY         = useRef(new Animated.Value(18)).current;
  const bgOpacity     = useRef(new Animated.Value(0)).current;
  const glowOpacity   = useRef(new Animated.Value(0.06)).current;

  const MASCOT_SIZE = width * 0.58;

  useEffect(() => {
    Animated.timing(bgOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();

    // Pulsing red glow behind mascot
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.18, duration: 750, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.06, duration: 750, useNativeDriver: true }),
      ])
    );
    glow.start();

    // Mascot — aggressive slam in
    Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.spring(mascotScale,   { toValue: 1, useNativeDriver: true, tension: 70, friction: 6 }),
        Animated.timing(mascotOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]),
    ]).start();

    // SURGO text
    Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // Intense float loop (faster than soft)
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloat, { toValue: -10, duration: 1100, useNativeDriver: true }),
        Animated.timing(mascotFloat, { toValue: 0,   duration: 1100, useNativeDriver: true }),
      ])
    );
    Animated.delay(820).start(() => floatLoop.start());

    if (onFinish) {
      const t = setTimeout(onFinish, 3600);
      return () => { clearTimeout(t); floatLoop.stop(); glow.stop(); };
    }
    return () => { floatLoop.stop(); glow.stop(); };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>

      {/* Flames — behind mascot */}
      {FLAMES.map((f, i) => <AnimatedFlame key={i} {...f} idx={i} />)}

      {/* Embers */}
      {EMBERS.map((e, i) => <AnimatedEmber key={i} {...e} />)}

      {/* Red glow halo behind mascot */}
      <Animated.View
        style={{
          position: 'absolute',
          width:        width * 0.80,
          height:       width * 0.80,
          borderRadius: width * 0.40,
          backgroundColor: '#FF1500',
          opacity: glowOpacity,
          alignSelf: 'center',
          top: '20%',
        }}
      />

      {/* Mascot */}
      <Animated.View
        style={{
          opacity: mascotOpacity,
          transform: [{ scale: mascotScale }, { translateY: mascotFloat }],
        }}
      >
        <HardcoreMascot size={MASCOT_SIZE} />
      </Animated.View>

      {/* Text */}
      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], alignItems: 'center', marginTop: 6 }}>
        <Text style={styles.title}>SURGO</Text>
        <Text style={styles.sub}>NO EXCUSES. 🔥</Text>
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
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 11,
    color: '#FF3B30',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#FFD60A',
  },
});
