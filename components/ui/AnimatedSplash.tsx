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

// ─── Surgo 3D mascot ──────────────────────────────────────────────────────────

function SurgoMascot({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2 + size * 0.03;
  const R  = size * 0.38;

  return (
    <Svg width={size} height={size}>
      <Defs>
        {/* Body – 3D sphere with radial gradient */}
        <SvgRadialGrad id="mBody" cx="36%" cy="30%" r="68%">
          <Stop offset="0%"   stopColor="#FFEC80" stopOpacity="1" />
          <Stop offset="45%"  stopColor="#F5C030" stopOpacity="1" />
          <Stop offset="100%" stopColor="#C8820A" stopOpacity="1" />
        </SvgRadialGrad>
        {/* Body sheen highlight */}
        <SvgRadialGrad id="mSheen" cx="32%" cy="28%" r="42%">
          <Stop offset="0%"   stopColor="rgba(255,255,255,0.88)" />
          <Stop offset="100%" stopColor="rgba(255,255,255,0)"    />
        </SvgRadialGrad>
        {/* Belly lighter patch */}
        <SvgRadialGrad id="mBelly" cx="50%" cy="60%" r="55%">
          <Stop offset="0%"   stopColor="#FFF4CC" stopOpacity="0.5" />
          <Stop offset="100%" stopColor="#FFF4CC" stopOpacity="0"   />
        </SvgRadialGrad>
        {/* Drop shadow */}
        <SvgRadialGrad id="mShadow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="rgba(160,100,0,0.22)" />
          <Stop offset="100%" stopColor="rgba(160,100,0,0)"    />
        </SvgRadialGrad>
      </Defs>

      {/* Ground shadow */}
      <Ellipse cx={cx} cy={cy + R * 1.08} rx={R * 0.72} ry={R * 0.13} fill="rgba(180,120,0,0.13)" />

      {/* Body */}
      <Circle cx={cx} cy={cy} r={R} fill="url(#mBody)" />
      {/* Belly patch */}
      <Ellipse cx={cx} cy={cy + R * 0.28} rx={R * 0.72} ry={R * 0.5} fill="url(#mBelly)" />
      {/* Sheen */}
      <Ellipse cx={cx - R*0.28} cy={cy - R*0.3} rx={R*0.32} ry={R*0.22} fill="url(#mSheen)" />

      {/* Left arm */}
      <Ellipse
        cx={cx - R * 1.05}
        cy={cy + R * 0.08}
        rx={R * 0.22}
        ry={R * 0.13}
        fill="#F5C030"
        transform={`rotate(-28 ${cx - R*1.05} ${cy + R*0.08})`}
      />
      {/* Right arm */}
      <Ellipse
        cx={cx + R * 1.05}
        cy={cy + R * 0.08}
        rx={R * 0.22}
        ry={R * 0.13}
        fill="#F5C030"
        transform={`rotate(28 ${cx + R*1.05} ${cy + R*0.08})`}
      />

      {/* Eye whites */}
      <Circle cx={cx - R*0.28} cy={cy - R*0.06} r={R * 0.22} fill="white" />
      <Circle cx={cx + R*0.28} cy={cy - R*0.06} r={R * 0.22} fill="white" />
      {/* Pupils */}
      <Circle cx={cx - R*0.25} cy={cy - R*0.04} r={R * 0.14} fill="#18182E" />
      <Circle cx={cx + R*0.31} cy={cy - R*0.04} r={R * 0.14} fill="#18182E" />
      {/* Eye shine large */}
      <Circle cx={cx - R*0.20} cy={cy - R*0.10} r={R * 0.054} fill="white" />
      <Circle cx={cx + R*0.36} cy={cy - R*0.10} r={R * 0.054} fill="white" />
      {/* Eye shine small */}
      <Circle cx={cx - R*0.30} cy={cy + R*0.02} r={R * 0.030} fill="rgba(255,255,255,0.65)" />
      <Circle cx={cx + R*0.26} cy={cy + R*0.02} r={R * 0.030} fill="rgba(255,255,255,0.65)" />

      {/* Blush cheeks */}
      <Ellipse cx={cx - R*0.60} cy={cy + R*0.18} rx={R*0.18} ry={R*0.11} fill="#FFB3C6" opacity="0.78" />
      <Ellipse cx={cx + R*0.60} cy={cy + R*0.18} rx={R*0.18} ry={R*0.11} fill="#FFB3C6" opacity="0.78" />

      {/* Cheek sparkles */}
      <Polygon
        points={`${cx-R*0.72},${cy+R*0.10} ${cx-R*0.70},${cy+R*0.05} ${cx-R*0.68},${cy+R*0.10} ${cx-R*0.70},${cy+R*0.15}`}
        fill="#FF88AA" opacity="0.82"
      />
      <Polygon
        points={`${cx+R*0.68},${cy+R*0.10} ${cx+R*0.70},${cy+R*0.05} ${cx+R*0.72},${cy+R*0.10} ${cx+R*0.70},${cy+R*0.15}`}
        fill="#FF88AA" opacity="0.82"
      />

      {/* Smile */}
      <Path
        d={`M ${cx - R*0.26} ${cy + R*0.22} Q ${cx} ${cy + R*0.43} ${cx + R*0.26} ${cy + R*0.22}`}
        stroke="#B87208"
        strokeWidth={R * 0.07}
        fill="none"
        strokeLinecap="round"
      />

      {/* Tiny blush dots */}
      <Circle cx={cx - R*0.68} cy={cy+R*0.26} r={R*0.038} fill="#FF8FAF" opacity="0.7" />
      <Circle cx={cx + R*0.68} cy={cy+R*0.26} r={R*0.038} fill="#FF8FAF" opacity="0.7" />
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
