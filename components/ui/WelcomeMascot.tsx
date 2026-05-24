/**
 * Surgo mascot — fluffy white dog, round glasses, black turtleneck.
 * Inspired by the chubby cartoon dog character.
 * Supports 5 poses × 3 theme tints on the turtleneck.
 */
import { ThemeKey } from '@/types';
import Svg, {
  Circle, Ellipse, Path, Defs,
  RadialGradient as SvgRadialGrad,
  Stop,
} from 'react-native-svg';

export type MascotPose = 'happy' | 'thumbsUp' | 'sad' | 'motivating' | 'crying';

// Turtleneck colour tinted slightly per theme
const NECK = {
  soft:     { dark: '#1E1E32', mid: '#2A2A48', light: '#36365A' },
  balanced: { dark: '#18182C', mid: '#222238', light: '#2E2E4A' },
  hardcore: { dark: '#200A0A', mid: '#2E1010', light: '#3C1818' },
} as const;

function star(x: number, y: number, r: number) {
  const i = r * 0.32;
  return (
    `M ${x} ${y - r} L ${x + i} ${y - i} L ${x + r} ${y} ` +
    `L ${x + i} ${y + i} L ${x} ${y + r} L ${x - i} ${y + i} ` +
    `L ${x - r} ${y} L ${x - i} ${y - i} Z`
  );
}

export function WelcomeMascot({
  themeKey,
  size,
  pose = 'happy',
}: {
  themeKey: ThemeKey;
  size: number;
  pose?: MascotPose;
}) {
  const s  = size;
  const cx = s * 0.500;
  const nc = NECK[themeKey];

  // ── Core geometry ─────────────────────────────────────────────
  const headR  = s * 0.298;          // radius of the big round head
  const headCy = s * 0.358;          // center-y of head

  const bodyRx = s * 0.272;          // turtleneck body
  const bodyRy = s * 0.208;
  const bodyCy = headCy + headR * 0.60;

  // Ears — small rounded triangles poking above the head
  const earLx = cx - headR * 0.50;
  const earRx = cx + headR * 0.50;
  const earTy = headCy - headR * 0.86;

  // Nose — large dark oval, very prominent
  const noseCy = headCy + s * 0.052;
  const noseRx = s * 0.102;
  const noseRy = s * 0.070;

  // Glasses — two circular frames
  const glassR  = s * 0.088;
  const glassCy = headCy - s * 0.042;
  const glassLx = cx - s * 0.098;
  const glassRx = cx + s * 0.098;

  // ── Pose values ───────────────────────────────────────────────
  const isSad = pose === 'sad' || pose === 'crying';
  const armR  = s * 0.076;

  // Left arm position
  const laX = cx - bodyRx * (isSad ? 0.84 : pose === 'motivating' ? 1.22 : 1.06);
  const laY = bodyCy + bodyRy * (
    isSad                 ?  0.35 :
    pose === 'motivating' ? -1.65 :
    pose === 'thumbsUp'   ? -0.45 :
    -0.18
  );

  // Right arm position
  const raX = cx + bodyRx * (isSad ? 0.84 : pose === 'motivating' ? 1.22 : 1.06);
  const raY = bodyCy + bodyRy * (
    isSad                 ?  0.35 :
    pose === 'motivating' ? -1.65 :
    pose === 'thumbsUp'   ? -1.25 :
    -0.18
  );

  // Smile / mouth
  const mouthY1 = noseCy + noseRy + s * 0.026;
  const mouthY2 = noseCy + noseRy + s * 0.050;
  const mouthW  = isSad ? s * 0.035 : pose === 'motivating' ? s * 0.058 : s * 0.030;

  const mouthD = isSad
    ? `M ${cx - mouthW} ${mouthY2} Q ${cx} ${mouthY1} ${cx + mouthW} ${mouthY2}`   // frown
    : `M ${cx - mouthW} ${mouthY1} Q ${cx} ${mouthY2} ${cx + mouthW} ${mouthY1}`;  // smile

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        {/* Head — white fluffy gradient */}
        <SvgRadialGrad id="hGr" cx="36%" cy="28%" r="72%">
          <Stop offset="0%"   stopColor="#FFFFFF" />
          <Stop offset="58%"  stopColor="#F0F0F0" />
          <Stop offset="100%" stopColor="#D4D4D4" />
        </SvgRadialGrad>
        {/* Nose — dark */}
        <SvgRadialGrad id="nGr" cx="34%" cy="28%" r="68%">
          <Stop offset="0%"   stopColor="#505050" />
          <Stop offset="100%" stopColor="#141414" />
        </SvgRadialGrad>
        {/* Body / arms — turtleneck */}
        <SvgRadialGrad id="bGr" cx="48%" cy="28%" r="70%">
          <Stop offset="0%"   stopColor={nc.light} />
          <Stop offset="100%" stopColor={nc.dark}  />
        </SvgRadialGrad>
        {/* Ground shadow */}
        <SvgRadialGrad id="sGr" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="rgba(0,0,0,0.14)" />
          <Stop offset="100%" stopColor="rgba(0,0,0,0)"    />
        </SvgRadialGrad>
      </Defs>

      {/* ── Ground shadow ────────────────────────────── */}
      <Ellipse cx={cx} cy={s * 0.935} rx={s * 0.244} ry={s * 0.036}
        fill="url(#sGr)" />

      {/* ── Feet ─────────────────────────────────────── */}
      <Ellipse cx={cx - s * 0.084} cy={s * 0.874}
        rx={s * 0.064} ry={s * 0.038} fill={nc.dark} />
      <Ellipse cx={cx + s * 0.084} cy={s * 0.874}
        rx={s * 0.064} ry={s * 0.038} fill={nc.dark} />

      {/* ── Ears (behind head) ───────────────────────── */}
      {/* Left ear */}
      <Path
        d={`M ${earLx - s * 0.050} ${earTy + s * 0.050}
            C ${earLx - s * 0.066} ${earTy - s * 0.028}
              ${earLx + s * 0.020} ${earTy - s * 0.060}
              ${earLx + s * 0.048} ${earTy + s * 0.050} Z`}
        fill="#E4E4E4"
      />
      {/* Right ear */}
      <Path
        d={`M ${earRx - s * 0.048} ${earTy + s * 0.050}
            C ${earRx - s * 0.020} ${earTy - s * 0.060}
              ${earRx + s * 0.066} ${earTy - s * 0.028}
              ${earRx + s * 0.050} ${earTy + s * 0.050} Z`}
        fill="#E4E4E4"
      />

      {/* ── Turtleneck body ──────────────────────────── */}
      <Ellipse cx={cx} cy={bodyCy} rx={bodyRx} ry={bodyRy} fill="url(#bGr)" />

      {/* Collar roll at top of turtleneck */}
      <Ellipse cx={cx} cy={bodyCy - bodyRy * 0.88}
        rx={bodyRx * 0.56} ry={s * 0.030} fill={nc.mid} />

      {/* ── Arms ─────────────────────────────────────── */}
      <Circle cx={laX} cy={laY} r={armR} fill={nc.mid} />
      <Circle cx={raX} cy={raY} r={armR} fill={nc.mid} />

      {/* Thumb (thumbsUp) */}
      {pose === 'thumbsUp' && (
        <>
          <Ellipse cx={raX} cy={raY - armR * 1.14}
            rx={armR * 0.46} ry={armR * 0.78} fill={nc.mid} />
          <Circle cx={raX} cy={raY - armR * 2.02}
            r={armR * 0.38} fill={nc.mid} />
          {/* Thumb gloss */}
          <Circle cx={raX - armR * 0.10} cy={raY - armR * 2.15}
            r={armR * 0.12} fill="rgba(255,255,255,0.28)" />
        </>
      )}

      {/* ── Head ─────────────────────────────────────── */}
      <Circle cx={cx} cy={headCy} r={headR} fill="url(#hGr)" />

      {/* Fluffy edge bumps around head perimeter (top arc only) */}
      {[150, 120, 90, 60, 30].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const bx  = cx     + headR * 0.94 * Math.cos(rad);
        const by  = headCy - headR * 0.94 * Math.sin(rad);
        return (
          <Circle key={deg} cx={bx} cy={by}
            r={s * 0.034} fill="#ECECEC" />
        );
      })}

      {/* Head base circle again on top of bumps to smooth the face */}
      <Circle cx={cx} cy={headCy} r={headR * 0.96} fill="url(#hGr)" />

      {/* Head gloss */}
      <Ellipse
        cx={cx - headR * 0.22} cy={headCy - headR * 0.44}
        rx={headR * 0.36} ry={headR * 0.16}
        fill="rgba(255,255,255,0.58)"
        transform={`rotate(-18 ${cx - headR * 0.22} ${headCy - headR * 0.44})`}
      />

      {/* ── Eyes (small dots visible through glasses) ── */}
      <Circle cx={glassLx} cy={glassCy + s * 0.005} r={s * 0.020} fill="#181818" />
      <Circle cx={glassRx} cy={glassCy + s * 0.005} r={s * 0.020} fill="#181818" />
      {/* Eye shine */}
      <Circle cx={glassLx - s * 0.010} cy={glassCy - s * 0.008} r={s * 0.006} fill="rgba(255,255,255,0.78)" />
      <Circle cx={glassRx - s * 0.010} cy={glassCy - s * 0.008} r={s * 0.006} fill="rgba(255,255,255,0.78)" />

      {/* ── Glasses ──────────────────────────────────── */}
      {/* Left frame */}
      <Circle cx={glassLx} cy={glassCy} r={glassR}
        fill="rgba(0,0,0,0.04)" stroke="#0E0E0E" strokeWidth={s * 0.020} />
      {/* Right frame */}
      <Circle cx={glassRx} cy={glassCy} r={glassR}
        fill="rgba(0,0,0,0.04)" stroke="#0E0E0E" strokeWidth={s * 0.020} />
      {/* Bridge between frames */}
      <Path
        d={`M ${glassLx + glassR - s * 0.004} ${glassCy - s * 0.004}
            L ${glassRx - glassR + s * 0.004} ${glassCy - s * 0.004}`}
        stroke="#0E0E0E" strokeWidth={s * 0.015} strokeLinecap="round" />
      {/* Side arms to ears */}
      <Path
        d={`M ${glassLx - glassR} ${glassCy}
            L ${glassLx - glassR - s * 0.030} ${glassCy + s * 0.016}`}
        stroke="#0E0E0E" strokeWidth={s * 0.013} strokeLinecap="round" />
      <Path
        d={`M ${glassRx + glassR} ${glassCy}
            L ${glassRx + glassR + s * 0.030} ${glassCy + s * 0.016}`}
        stroke="#0E0E0E" strokeWidth={s * 0.013} strokeLinecap="round" />

      {/* ── Nose ─────────────────────────────────────── */}
      <Ellipse cx={cx} cy={noseCy} rx={noseRx} ry={noseRy} fill="url(#nGr)" />
      {/* Nose highlight */}
      <Ellipse cx={cx - noseRx * 0.28} cy={noseCy - noseRy * 0.30}
        rx={noseRx * 0.26} ry={noseRy * 0.24}
        fill="rgba(255,255,255,0.22)" />

      {/* ── Mouth ────────────────────────────────────── */}
      <Path d={mouthD}
        stroke="#5A5A5A" strokeWidth={s * 0.016}
        fill="none" strokeLinecap="round" />

      {/* ── Eyebrows ─────────────────────────────────── */}

      {/* Sad: inner corners raised */}
      {isSad && (
        <>
          <Path
            d={`M ${glassLx - glassR * 0.54} ${glassCy - glassR * 0.86}
                L ${glassLx + glassR * 0.44} ${glassCy - glassR * 1.16}`}
            stroke="#2E2E2E" strokeWidth={s * 0.016} strokeLinecap="round" />
          <Path
            d={`M ${glassRx - glassR * 0.44} ${glassCy - glassR * 1.16}
                L ${glassRx + glassR * 0.54} ${glassCy - glassR * 0.86}`}
            stroke="#2E2E2E" strokeWidth={s * 0.016} strokeLinecap="round" />
        </>
      )}

      {/* Motivating: high excited arches */}
      {pose === 'motivating' && (
        <>
          <Path
            d={`M ${glassLx - glassR * 0.65} ${glassCy - glassR * 0.98}
                Q ${glassLx} ${glassCy - glassR * 1.55}
                  ${glassLx + glassR * 0.65} ${glassCy - glassR * 0.98}`}
            stroke="#2E2E2E" strokeWidth={s * 0.016}
            fill="none" strokeLinecap="round" />
          <Path
            d={`M ${glassRx - glassR * 0.65} ${glassCy - glassR * 0.98}
                Q ${glassRx} ${glassCy - glassR * 1.55}
                  ${glassRx + glassR * 0.65} ${glassCy - glassR * 0.98}`}
            stroke="#2E2E2E" strokeWidth={s * 0.016}
            fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── Tears (crying) ───────────────────────────── */}
      {pose === 'crying' && (
        <>
          <Ellipse cx={glassLx + s * 0.013} cy={glassCy + glassR + s * 0.026}
            rx={s * 0.013} ry={s * 0.034} fill="#70C8FF" fillOpacity={0.88} />
          <Ellipse cx={glassLx - s * 0.008} cy={glassCy + glassR + s * 0.058}
            rx={s * 0.010} ry={s * 0.022} fill="#70C8FF" fillOpacity={0.66} />
          <Ellipse cx={glassRx - s * 0.013} cy={glassCy + glassR + s * 0.026}
            rx={s * 0.013} ry={s * 0.034} fill="#70C8FF" fillOpacity={0.88} />
          <Ellipse cx={glassRx + s * 0.008} cy={glassCy + glassR + s * 0.058}
            rx={s * 0.010} ry={s * 0.022} fill="#70C8FF" fillOpacity={0.66} />
        </>
      )}

      {/* ── Sparkles (motivating) ────────────────────── */}
      {pose === 'motivating' && (
        <>
          <Path d={star(cx - s * 0.368, s * 0.215, s * 0.036)} fill="#FFD700" opacity={0.92} />
          <Path d={star(cx + s * 0.372, s * 0.200, s * 0.030)} fill="#FFD700" opacity={0.86} />
          <Path d={star(cx + s * 0.095, s * 0.068, s * 0.022)} fill="#FFD700" opacity={0.74} />
        </>
      )}
    </Svg>
  );
}
