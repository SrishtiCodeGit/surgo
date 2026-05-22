import { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import Svg, {
  Circle, Ellipse, Path, G, Defs, Polygon,
  RadialGradient as SvgRadialGrad,
  LinearGradient as SvgLinearGrad,
  Stop, Line,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// ─── Star positions ───────────────────────────────────────────────────────────

const STARS = [
  { x: 0.10, y: 0.07, size: 13, delay: 0   },
  { x: 0.84, y: 0.06, size: 10, delay: 280 },
  { x: 0.93, y: 0.21, size: 18, delay: 560 },
  { x: 0.04, y: 0.26, size: 9,  delay: 140 },
  { x: 0.76, y: 0.13, size: 14, delay: 420 },
  { x: 0.21, y: 0.11, size: 8,  delay: 700 },
  { x: 0.89, y: 0.39, size: 11, delay: 210 },
  { x: 0.05, y: 0.46, size: 16, delay: 840 },
  { x: 0.81, y: 0.53, size: 9,  delay: 340 },
  { x: 0.13, y: 0.61, size: 13, delay: 500 },
  { x: 0.91, y: 0.67, size: 8,  delay: 90  },
  { x: 0.07, y: 0.76, size: 12, delay: 660 },
  { x: 0.86, y: 0.83, size: 16, delay: 230 },
  { x: 0.18, y: 0.87, size: 9,  delay: 780 },
];

// ─── Flower positions ─────────────────────────────────────────────────────────

const FLOWERS = [
  // left
  { x: 0.03, y: 0.48, size: 58, petal: '#FF9EB5', delay: 350,  rot: -12 },
  { x: 0.11, y: 0.58, size: 44, petal: '#FFCBDC', delay: 650,  rot:  10 },
  { x: 0.02, y: 0.68, size: 50, petal: '#FFB0C8', delay: 950,  rot:  -7 },
  { x: 0.13, y: 0.74, size: 34, petal: '#FFD6E8', delay: 550,  rot:  18 },
  { x: 0.05, y: 0.82, size: 38, petal: '#FF9EB5', delay: 800,  rot:  -4 },
  // right
  { x: 0.85, y: 0.48, size: 58, petal: '#FFD07A', delay: 450,  rot:  12 },
  { x: 0.77, y: 0.58, size: 44, petal: '#FFE4A8', delay: 750,  rot: -10 },
  { x: 0.87, y: 0.68, size: 50, petal: '#FFCA6A', delay: 280,  rot:   7 },
  { x: 0.75, y: 0.74, size: 34, petal: '#FFEDD4', delay: 1050, rot: -18 },
  { x: 0.82, y: 0.82, size: 38, petal: '#FFD07A', delay: 620,  rot:   4 },
];

// ─── 4-pointed star SVG ───────────────────────────────────────────────────────

function StarSVG({ size, color = '#F5C842' }: { size: number; color?: string }) {
  const s = size;
  const c = s / 2;
  const R = s * 0.5;   // outer radius
  const r = s * 0.2;   // inner radius

  // 8 vertices alternating outer/inner at 45° increments, starting at top
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${c + rad * Math.cos(angle)},${c + rad * Math.sin(angle)}`);
  }

  return (
    <Svg width={s} height={s}>
      <Polygon points={pts.join(' ')} fill={color} />
    </Svg>
  );
}

// ─── 3D Flower SVG ────────────────────────────────────────────────────────────

function FlowerSVG({ size, petalColor, idx }: { size: number; petalColor: string; idx: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const stemH = size * 0.55;
  const totalH = size + stemH;
  const gradId   = `pg${idx}`;
  const cGradId  = `cg${idx}`;
  const shId     = `sh${idx}`;

  // Petal: ellipse offset upward from centre, rotated by angle
  const numPetals = 6;
  const petalRx = size * 0.14;
  const petalRy = size * 0.28;
  const petalOffset = size * 0.22; // distance from center to near edge of petal

  return (
    <Svg width={size} height={totalH}>
      <Defs>
        {/* Petal gradient – lighter at tip, richer at base */}
        <SvgRadialGrad id={gradId} cx="50%" cy="85%" r="70%">
          <Stop offset="0%"   stopColor={petalColor} stopOpacity="1" />
          <Stop offset="60%"  stopColor={petalColor} stopOpacity="0.92" />
          <Stop offset="100%" stopColor="#FFFFFF"    stopOpacity="0.85" />
        </SvgRadialGrad>
        {/* Centre gradient – golden sphere */}
        <SvgRadialGrad id={cGradId} cx="35%" cy="30%" r="65%">
          <Stop offset="0%"   stopColor="#FFF3B0" stopOpacity="1" />
          <Stop offset="60%"  stopColor="#F5C030" stopOpacity="1" />
          <Stop offset="100%" stopColor="#C8860A" stopOpacity="1" />
        </SvgRadialGrad>
        {/* Petal shadow (back-layer petals) */}
        <SvgRadialGrad id={shId} cx="50%" cy="85%" r="70%">
          <Stop offset="0%"   stopColor={petalColor} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={petalColor} stopOpacity="0.25" />
        </SvgRadialGrad>
      </Defs>

      {/* Stem */}
      <Path
        d={`M ${cx} ${cy + size * 0.18} Q ${cx + size*0.08} ${cy + stemH*0.5} ${cx} ${totalH - 2}`}
        stroke="#5A8A3A"
        strokeWidth={size * 0.055}
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaf left */}
      <Ellipse
        cx={cx - size * 0.14}
        cy={cy + stemH * 0.45}
        rx={size * 0.16}
        ry={size * 0.07}
        fill="#6AAA44"
        transform={`rotate(-38 ${cx - size*0.14} ${cy + stemH*0.45})`}
      />

      {/* Back-layer petals (shadow) */}
      {Array.from({ length: numPetals }).map((_, i) => {
        const angle = (i * 60 + 30) * (Math.PI / 180);
        const ex = cx + (petalOffset + petalRy) * Math.sin(angle);
        const ey = cy - (petalOffset + petalRy) * Math.cos(angle);
        return (
          <Ellipse
            key={`bs${i}`}
            cx={ex}
            cy={ey}
            rx={petalRx * 0.85}
            ry={petalRy * 0.85}
            fill={`url(#${shId})`}
            transform={`rotate(${i * 60 + 30} ${cx} ${cy})`}
          />
        );
      })}

      {/* Front petals */}
      {Array.from({ length: numPetals }).map((_, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const ex = cx + (petalOffset + petalRy) * Math.sin(angle);
        const ey = cy - (petalOffset + petalRy) * Math.cos(angle);
        return (
          <Ellipse
            key={`fp${i}`}
            cx={ex}
            cy={ey}
            rx={petalRx}
            ry={petalRy}
            fill={`url(#${gradId})`}
            transform={`rotate(${i * 60} ${cx} ${cy})`}
          />
        );
      })}

      {/* Centre circle */}
      <Circle cx={cx} cy={cy} r={size * 0.16} fill={`url(#${cGradId})`} />
      {/* Centre specular */}
      <Circle cx={cx - size*0.05} cy={cy - size*0.05} r={size * 0.055} fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}

// ─── Surgo 3D mascot (Soft mode — pink/lavender blob character) ───────────────

function SurgoMascot({ size }: { size: number }) {
  const s   = size;
  const cx  = s * 0.5;
  const bCy = s * 0.47;   // body centre y (slightly above mid so feet show)

  const bRx = s * 0.30;   // body half-width
  const bRy = s * 0.36;   // body half-height

  // Eye geometry
  const eyeY  = bCy - bRy * 0.14;
  const eyeLx = cx - s * 0.135;
  const eyeRx = cx + s * 0.135;
  const eR    = s * 0.112;   // eye-white radius
  const iR    = s * 0.074;   // iris radius
  const pR    = s * 0.050;   // pupil radius

  return (
    <Svg width={s} height={s}>
      <Defs>
        {/* Body: bright yellow highlight → rich golden → deep amber */}
        <SvgRadialGrad id="mBody" cx="30%" cy="22%" r="78%">
          <Stop offset="0%"   stopColor="#FFF5A0" />
          <Stop offset="35%"  stopColor="#F5C030" />
          <Stop offset="100%" stopColor="#C07800" />
        </SvgRadialGrad>

        {/* Belly lighter oval */}
        <SvgRadialGrad id="mBelly" cx="50%" cy="65%" r="55%">
          <Stop offset="0%"   stopColor="#FFFFF0" stopOpacity="0.72" />
          <Stop offset="100%" stopColor="#FFFFF0" stopOpacity="0"    />
        </SvgRadialGrad>

        {/* Iris: warm amber → deep brown */}
        <SvgRadialGrad id="mIris" cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor="#FFD080" />
          <Stop offset="100%" stopColor="#5A2800" />
        </SvgRadialGrad>

        {/* Arms: bright yellow sphere */}
        <SvgRadialGrad id="mArm" cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor="#FFE870" />
          <Stop offset="100%" stopColor="#C07200" />
        </SvgRadialGrad>

        {/* Feet: deeper golden sphere */}
        <SvgRadialGrad id="mFoot" cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor="#FFD840" />
          <Stop offset="100%" stopColor="#A05C00" />
        </SvgRadialGrad>

        {/* Ear bumps */}
        <SvgRadialGrad id="mEar" cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor="#FFE870" />
          <Stop offset="100%" stopColor="#C07800" />
        </SvgRadialGrad>

        {/* Ground shadow */}
        <SvgRadialGrad id="mGnd" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="rgba(180,120,0,0.22)" />
          <Stop offset="100%" stopColor="rgba(180,120,0,0)"    />
        </SvgRadialGrad>
      </Defs>

      {/* Ground shadow */}
      <Ellipse cx={cx} cy={bCy + bRy * 1.08} rx={bRx * 0.85} ry={bRy * 0.12} fill="url(#mGnd)" />

      {/* Feet (peeking below body) */}
      <Ellipse cx={cx - s*0.105} cy={bCy + bRy*0.90} rx={s*0.090} ry={s*0.065} fill="url(#mFoot)" />
      <Ellipse cx={cx + s*0.105} cy={bCy + bRy*0.90} rx={s*0.090} ry={s*0.065} fill="url(#mFoot)" />
      {/* Foot gloss */}
      <Ellipse cx={cx - s*0.118} cy={bCy + bRy*0.85} rx={s*0.034} ry={s*0.022} fill="rgba(255,255,255,0.34)" />
      <Ellipse cx={cx + s*0.092} cy={bCy + bRy*0.85} rx={s*0.034} ry={s*0.022} fill="rgba(255,255,255,0.34)" />

      {/* Ear bumps — drawn before body so body overlaps their base */}
      <Circle cx={cx - bRx*0.50} cy={bCy - bRy*0.88} r={s*0.068} fill="url(#mEar)" />
      <Circle cx={cx + bRx*0.50} cy={bCy - bRy*0.88} r={s*0.068} fill="url(#mEar)" />
      {/* Ear inner (inner colour lighter) */}
      <Ellipse cx={cx - bRx*0.50} cy={bCy - bRy*0.91} rx={s*0.032} ry={s*0.028} fill="#FFF5A0" opacity="0.7" />
      <Ellipse cx={cx + bRx*0.50} cy={bCy - bRy*0.91} rx={s*0.032} ry={s*0.028} fill="#FFF5A0" opacity="0.7" />

      {/* Body */}
      <Ellipse cx={cx} cy={bCy} rx={bRx} ry={bRy} fill="url(#mBody)" />

      {/* Belly patch */}
      <Ellipse cx={cx} cy={bCy + bRy*0.28} rx={bRx*0.68} ry={bRy*0.52} fill="url(#mBelly)" />

      {/* Arms — round nub stubs */}
      <Circle cx={cx - bRx*1.02} cy={bCy - bRy*0.04} r={s*0.090} fill="url(#mArm)" />
      <Circle cx={cx + bRx*1.02} cy={bCy - bRy*0.04} r={s*0.090} fill="url(#mArm)" />
      {/* Arm gloss */}
      <Circle cx={cx - bRx*1.06} cy={bCy - bRy*0.10} r={s*0.038} fill="rgba(255,255,255,0.36)" />
      <Circle cx={cx + bRx*0.98} cy={bCy - bRy*0.10} r={s*0.038} fill="rgba(255,255,255,0.36)" />

      {/* ── Eyes ── */}
      <Circle cx={eyeLx} cy={eyeY} r={eR} fill="white" />
      <Circle cx={eyeRx} cy={eyeY} r={eR} fill="white" />
      {/* Iris */}
      <Circle cx={eyeLx} cy={eyeY + eR*0.06} r={iR} fill="url(#mIris)" />
      <Circle cx={eyeRx} cy={eyeY + eR*0.06} r={iR} fill="url(#mIris)" />
      {/* Pupil */}
      <Circle cx={eyeLx} cy={eyeY + eR*0.09} r={pR} fill="#08041A" />
      <Circle cx={eyeRx} cy={eyeY + eR*0.09} r={pR} fill="#08041A" />
      {/* Large eye shine */}
      <Circle cx={eyeLx - iR*0.32} cy={eyeY - iR*0.38} r={s*0.030} fill="white" />
      <Circle cx={eyeRx - iR*0.32} cy={eyeY - iR*0.38} r={s*0.030} fill="white" />
      {/* Small eye shine */}
      <Circle cx={eyeLx + iR*0.28} cy={eyeY + iR*0.08} r={s*0.016} fill="rgba(255,255,255,0.68)" />
      <Circle cx={eyeRx + iR*0.28} cy={eyeY + iR*0.08} r={s*0.016} fill="rgba(255,255,255,0.68)" />

      {/* ── Face ── */}
      {/* Blush cheeks */}
      <Ellipse cx={eyeLx - eR*0.62} cy={bCy + bRy*0.06} rx={eR*0.80} ry={eR*0.50} fill="#FFAA30" opacity="0.55" />
      <Ellipse cx={eyeRx + eR*0.62} cy={bCy + bRy*0.06} rx={eR*0.80} ry={eR*0.50} fill="#FFAA30" opacity="0.55" />
      {/* Blush dots */}
      <Circle cx={eyeLx - eR*0.30} cy={bCy + bRy*0.10} r={s*0.016} fill="#FF9010" opacity="0.50" />
      <Circle cx={eyeRx + eR*0.30} cy={bCy + bRy*0.10} r={s*0.016} fill="#FF9010" opacity="0.50" />

      {/* Smile */}
      <Path
        d={`M ${cx - s*0.145} ${bCy + bRy*0.22} Q ${cx} ${bCy + bRy*0.43} ${cx + s*0.145} ${bCy + bRy*0.22}`}
        stroke="#8A5000"
        strokeWidth={s * 0.023}
        fill="none"
        strokeLinecap="round"
      />

      {/* ── 3D gloss highlights ── */}
      {/* Top gloss streak */}
      <Ellipse
        cx={cx - bRx*0.16}
        cy={bCy - bRy*0.60}
        rx={bRx*0.52}
        ry={bRy*0.16}
        fill="rgba(255,255,255,0.44)"
        transform={`rotate(-16 ${cx - bRx*0.16} ${bCy - bRy*0.60})`}
      />
      {/* Side gloss */}
      <Ellipse
        cx={cx - bRx*0.62}
        cy={bCy - bRy*0.22}
        rx={bRx*0.18}
        ry={bRy*0.36}
        fill="rgba(255,255,255,0.20)"
        transform={`rotate(-10 ${cx - bRx*0.62} ${bCy - bRy*0.22})`}
      />
    </Svg>
  );
}

// ─── Animated helpers ─────────────────────────────────────────────────────────

function AnimatedStar({ x, y, size, delay }: typeof STARS[0]) {
  const opacity = useRef(new Animated.Value(0.15)).current;
  const scale   = useRef(new Animated.Value(0.7)).current;
  const rotate  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1.3, duration: 700, useNativeDriver: true }),
          Animated.timing(rotate,  { toValue: 1,   duration: 1400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.15, duration: 700, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 0.7,  duration: 700, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x * width  - size / 2,
        top:  y * height - size / 2,
        opacity,
        transform: [
          { scale },
          { rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
        ],
      }}
    >
      <StarSVG size={size} color="#F5C842" />
    </Animated.View>
  );
}

function AnimatedFlower({ x, y, size, petal, delay, rot, idx }: typeof FLOWERS[0] & { idx: number }) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sway    = useRef(new Animated.Value(0)).current;
  const spinIn  = useRef(new Animated.Value(-0.25)).current;

  useEffect(() => {
    // Bloom: spin+scale into existence
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 55, friction: 7 }),
        Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(spinIn,  { toValue: 0, useNativeDriver: true, tension: 55, friction: 7 }),
      ]),
    ]).start();

    // Gentle sway after bloom
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay + 500),
        Animated.timing(sway, { toValue:  1, duration: 2200, useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 2200, useNativeDriver: true }),
        Animated.timing(sway, { toValue:  0, duration: 2200, useNativeDriver: true }),
      ]),
    );
    swayLoop.start();
    return () => swayLoop.stop();
  }, []);

  const swayDeg = sway.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] });
  const spinDeg = spinIn.interpolate({ inputRange: [-0.25, 0], outputRange: ['-90deg', `${rot}deg`] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left:    x * width  - size / 2,
        top:     y * height - size / 2,
        opacity,
        transform: [{ scale }, { rotate: swayDeg }, { rotate: spinDeg }],
      }}
    >
      <FlowerSVG size={size} petalColor={petal} idx={idx} />
    </Animated.View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnimatedSplash({ onFinish }: { onFinish?: () => void }) {
  const mascotScale   = useRef(new Animated.Value(0.6)).current;
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const mascotFloat   = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textY         = useRef(new Animated.Value(20)).current;
  const bgOpacity     = useRef(new Animated.Value(0)).current;

  const MASCOT_SIZE = width * 0.58;

  useEffect(() => {
    Animated.timing(bgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();

    // Mascot spring pop
    Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.spring(mascotScale,   { toValue: 1, useNativeDriver: true, tension: 48, friction: 7 }),
        Animated.timing(mascotOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();

    // SURGO text slide up
    Animated.sequence([
      Animated.delay(750),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 550, useNativeDriver: true }),
      ]),
    ]).start();

    // Float loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloat, { toValue: -14, duration: 1900, useNativeDriver: true }),
        Animated.timing(mascotFloat, { toValue:   0, duration: 1900, useNativeDriver: true }),
      ]),
    );
    Animated.delay(850).start(() => floatLoop.start());

    if (onFinish) {
      const t = setTimeout(onFinish, 3400);
      return () => { clearTimeout(t); floatLoop.stop(); };
    }
    return () => floatLoop.stop();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>

      {/* Stars */}
      {STARS.map((s, i) => <AnimatedStar key={i} {...s} />)}

      {/* Flowers */}
      {FLOWERS.map((f, i) => <AnimatedFlower key={i} {...f} idx={i} />)}

      {/* Mascot */}
      <Animated.View
        style={{
          opacity: mascotOpacity,
          transform: [{ scale: mascotScale }, { translateY: mascotFloat }],
        }}
      >
        <SurgoMascot size={MASCOT_SIZE} />
      </Animated.View>

      {/* SURGO — single, in code only */}
      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], alignItems: 'center', marginTop: 4 }}>
        <Text style={styles.title}>SURGO</Text>
        <Text style={styles.sub}>Rise every day ✦</Text>
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
  title: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 11,
    color: '#C8830A',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: '#E8B84A',
    fontWeight: '600',
    letterSpacing: 2.5,
  },
});
