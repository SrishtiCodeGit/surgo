/**
 * Surgo mascot — fluffy white dog, round glasses.
 * Outfit changes per theme:
 *   soft     → pastel-pink hoodie with pocket + drawstrings
 *   balanced → dark navy turtleneck (clean & classy)
 *   hardcore → black athletic jacket with red accent stripes
 */
import { ThemeKey } from '@/types';
import Svg, {
  Circle, Ellipse, Path, Defs,
  RadialGradient as SvgRadialGrad,
  LinearGradient as SvgLinearGrad,
  Stop,
} from 'react-native-svg';

export type MascotPose = 'happy' | 'thumbsUp' | 'sad' | 'motivating' | 'crying';

// ── Per-theme outfit ─────────────────────────────────────────────────────────
const OUTFIT = {
  soft: {
    // Cosy pastel-pink hoodie
    bodyMain:   '#F9A8D4',
    bodyLight:  '#FDD5E8',
    bodyDark:   '#EC4899',
    armMain:    '#F9A8D4',
    armLight:   '#FDD5E8',
    collarMain: '#FDD5E8',
    accent:     '#DB2777',   // drawstring / pocket outline
    style:      'hoodie'  as const,
  },
  balanced: {
    // Dark navy turtleneck
    bodyMain:   '#1C1C30',
    bodyLight:  '#2A2A48',
    bodyDark:   '#0E0E1E',
    armMain:    '#222238',
    armLight:   '#2E2E4C',
    collarMain: '#282840',
    accent:     '#3A3A5C',
    style:      'turtleneck' as const,
  },
  hardcore: {
    // Black athletic jacket, red stripe
    bodyMain:   '#111111',
    bodyLight:  '#1E1E1E',
    bodyDark:   '#000000',
    armMain:    '#151515',
    armLight:   '#202020',
    collarMain: '#1A1A1A',
    accent:     '#DC2626',   // red stripe
    style:      'athletic' as const,
  },
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────
function star(x: number, y: number, r: number) {
  const i = r * 0.32;
  return (
    `M ${x} ${y - r} L ${x + i} ${y - i} L ${x + r} ${y} ` +
    `L ${x + i} ${y + i} L ${x} ${y + r} L ${x - i} ${y + i} ` +
    `L ${x - r} ${y} L ${x - i} ${y - i} Z`
  );
}

// ── Component ────────────────────────────────────────────────────────────────
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
  const ot = OUTFIT[themeKey];

  // ── Geometry ──────────────────────────────────────────────────
  const headR  = s * 0.296;
  const headCy = s * 0.356;

  const bodyRx = s * 0.270;
  const bodyRy = s * 0.206;
  const bodyCy = headCy + headR * 0.60;

  const earLx = cx - headR * 0.50;
  const earRx = cx + headR * 0.50;
  const earTy  = headCy - headR * 0.86;

  const noseCy = headCy + s * 0.050;
  const noseRx = s * 0.100;
  const noseRy = s * 0.068;

  const glassR  = s * 0.087;
  const glassCy = headCy - s * 0.040;
  const glassLx = cx - s * 0.097;
  const glassRx = cx + s * 0.097;

  // ── Pose ──────────────────────────────────────────────────────
  const isSad = pose === 'sad' || pose === 'crying';
  const armR  = s * 0.075;

  const laX = cx - bodyRx * (isSad ? 0.84 : pose === 'motivating' ? 1.22 : 1.06);
  const laY = bodyCy + bodyRy * (
    isSad                 ?  0.40 :
    pose === 'motivating' ? -1.70 :
    pose === 'thumbsUp'   ? -0.42 :
    -0.16
  );
  const raX = cx + bodyRx * (isSad ? 0.84 : pose === 'motivating' ? 1.22 : 1.06);
  const raY = bodyCy + bodyRy * (
    isSad                 ?  0.40 :
    pose === 'motivating' ? -1.70 :
    pose === 'thumbsUp'   ? -1.28 :
    -0.16
  );

  // Mouth
  const mY1 = noseCy + noseRy + s * 0.024;
  const mY2 = noseCy + noseRy + s * 0.048;
  const mW  = isSad ? s * 0.034 : pose === 'motivating' ? s * 0.056 : s * 0.030;
  const mouthD = isSad
    ? `M ${cx - mW} ${mY2} Q ${cx} ${mY1} ${cx + mW} ${mY2}`
    : `M ${cx - mW} ${mY1} Q ${cx} ${mY2} ${cx + mW} ${mY1}`;

  // Unique gradient IDs per theme (avoids clash when multiple mascots render)
  const uid = `ms_${themeKey}`;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <SvgRadialGrad id={`${uid}_h`} cx="36%" cy="28%" r="72%">
          <Stop offset="0%"   stopColor="#FFFFFF" />
          <Stop offset="56%"  stopColor="#F0F0F0" />
          <Stop offset="100%" stopColor="#D2D2D2" />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${uid}_n`} cx="34%" cy="28%" r="68%">
          <Stop offset="0%"   stopColor="#505050" />
          <Stop offset="100%" stopColor="#141414" />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${uid}_b`} cx="46%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor={ot.bodyLight} />
          <Stop offset="100%" stopColor={ot.bodyDark}  />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${uid}_a`} cx="36%" cy="26%" r="70%">
          <Stop offset="0%"   stopColor={ot.armLight} />
          <Stop offset="100%" stopColor={ot.bodyDark} />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${uid}_sd`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="rgba(0,0,0,0.14)" />
          <Stop offset="100%" stopColor="rgba(0,0,0,0)"    />
        </SvgRadialGrad>
      </Defs>

      {/* ── Ground shadow ──────────────────────────────────── */}
      <Ellipse cx={cx} cy={s * 0.936} rx={s * 0.242} ry={s * 0.035}
        fill={`url(#${uid}_sd)`} />

      {/* ── Feet ───────────────────────────────────────────── */}
      <Ellipse cx={cx - s * 0.082} cy={s * 0.872}
        rx={s * 0.062} ry={s * 0.037} fill={ot.bodyDark} />
      <Ellipse cx={cx + s * 0.082} cy={s * 0.872}
        rx={s * 0.062} ry={s * 0.037} fill={ot.bodyDark} />

      {/* ── Ears (behind head) ─────────────────────────────── */}
      <Path
        d={`M ${earLx - s*0.050} ${earTy + s*0.050}
            C ${earLx - s*0.066} ${earTy - s*0.028}
              ${earLx + s*0.020} ${earTy - s*0.060}
              ${earLx + s*0.048} ${earTy + s*0.050} Z`}
        fill="#E2E2E2" />
      <Path
        d={`M ${earRx - s*0.048} ${earTy + s*0.050}
            C ${earRx - s*0.020} ${earTy - s*0.060}
              ${earRx + s*0.066} ${earTy - s*0.028}
              ${earRx + s*0.050} ${earTy + s*0.050} Z`}
        fill="#E2E2E2" />

      {/* ══════════════════════════════════════════════════════
          OUTFIT — style varies by theme
          ══════════════════════════════════════════════════════ */}

      {/* ── SOFT: pastel-pink hoodie ────────────────────────── */}
      {ot.style === 'hoodie' && (
        <>
          {/* Hood fabric visible behind head — drawn before head */}
          <Path
            d={`M ${cx - bodyRx * 1.02} ${headCy + s*0.010}
                Q ${cx - headR * 0.46} ${headCy - headR * 0.70}
                  ${cx} ${headCy - headR * 0.92}
                Q ${cx + headR * 0.46} ${headCy - headR * 0.70}
                  ${cx + bodyRx * 1.02} ${headCy + s*0.010}
                Q ${cx} ${headCy - s*0.010}
                  ${cx - bodyRx * 1.02} ${headCy + s*0.010} Z`}
            fill={ot.bodyLight} opacity={0.85}
          />

          {/* Body */}
          <Ellipse cx={cx} cy={bodyCy} rx={bodyRx} ry={bodyRy}
            fill={`url(#${uid}_b)`} />

          {/* Hood neckline — U-shaped opening */}
          <Path
            d={`M ${cx - bodyRx * 0.52} ${bodyCy - bodyRy * 0.92}
                Q ${cx} ${bodyCy - bodyRy * 1.28}
                  ${cx + bodyRx * 0.52} ${bodyCy - bodyRy * 0.92}`}
            fill="none" stroke={ot.collarMain}
            strokeWidth={s * 0.018} strokeLinecap="round" />

          {/* Drawstrings */}
          <Path
            d={`M ${cx - s*0.022} ${bodyCy - bodyRy * 0.86}
                Q ${cx - s*0.032} ${bodyCy - bodyRy * 0.40}
                  ${cx - s*0.038} ${bodyCy + bodyRy * 0.10}`}
            fill="none" stroke={ot.accent}
            strokeWidth={s * 0.012} strokeLinecap="round" />
          <Path
            d={`M ${cx + s*0.022} ${bodyCy - bodyRy * 0.86}
                Q ${cx + s*0.032} ${bodyCy - bodyRy * 0.40}
                  ${cx + s*0.038} ${bodyCy + bodyRy * 0.10}`}
            fill="none" stroke={ot.accent}
            strokeWidth={s * 0.012} strokeLinecap="round" />
          {/* Drawstring tips */}
          <Circle cx={cx - s*0.038} cy={bodyCy + bodyRy * 0.10} r={s*0.012}
            fill={ot.accent} />
          <Circle cx={cx + s*0.038} cy={bodyCy + bodyRy * 0.10} r={s*0.012}
            fill={ot.accent} />

          {/* Kangaroo pocket */}
          <Path
            d={`M ${cx - s*0.096} ${bodyCy + bodyRy * 0.16}
                L ${cx - s*0.096} ${bodyCy + bodyRy * 0.66}
                Q ${cx - s*0.096} ${bodyCy + bodyRy * 0.82} ${cx} ${bodyCy + bodyRy * 0.82}
                Q ${cx + s*0.096} ${bodyCy + bodyRy * 0.82} ${cx + s*0.096} ${bodyCy + bodyRy * 0.66}
                L ${cx + s*0.096} ${bodyCy + bodyRy * 0.16}
                Q ${cx} ${bodyCy + bodyRy * 0.06} ${cx - s*0.096} ${bodyCy + bodyRy * 0.16} Z`}
            fill={ot.bodyDark} opacity={0.30}
            stroke={ot.accent} strokeWidth={s * 0.010} />
          {/* Pocket centre seam */}
          <Path
            d={`M ${cx} ${bodyCy + bodyRy * 0.14} L ${cx} ${bodyCy + bodyRy * 0.80}`}
            stroke={ot.accent} strokeWidth={s * 0.009}
            strokeLinecap="round" opacity={0.55} />

          {/* Arms */}
          <Circle cx={laX} cy={laY} r={armR} fill={`url(#${uid}_a)`} />
          <Circle cx={raX} cy={raY} r={armR} fill={`url(#${uid}_a)`} />
        </>
      )}

      {/* ── BALANCED: dark navy turtleneck ─────────────────────── */}
      {ot.style === 'turtleneck' && (
        <>
          {/* Body */}
          <Ellipse cx={cx} cy={bodyCy} rx={bodyRx} ry={bodyRy}
            fill={`url(#${uid}_b)`} />

          {/* High collar roll */}
          <Ellipse cx={cx} cy={bodyCy - bodyRy * 0.88}
            rx={bodyRx * 0.55} ry={s * 0.030} fill={ot.collarMain} />
          {/* Second collar ring for depth */}
          <Ellipse cx={cx} cy={bodyCy - bodyRy * 0.80}
            rx={bodyRx * 0.52} ry={s * 0.018}
            fill="none" stroke={ot.accent}
            strokeWidth={s * 0.008} opacity={0.60} />

          {/* Arms */}
          <Circle cx={laX} cy={laY} r={armR} fill={`url(#${uid}_a)`} />
          <Circle cx={raX} cy={raY} r={armR} fill={`url(#${uid}_a)`} />
        </>
      )}

      {/* ── HARDCORE: black athletic jacket, red stripes ────────── */}
      {ot.style === 'athletic' && (
        <>
          {/* Body */}
          <Ellipse cx={cx} cy={bodyCy} rx={bodyRx} ry={bodyRy}
            fill={`url(#${uid}_b)`} />

          {/* Red accent stripes on left and right sides */}
          <Path
            d={`M ${cx - bodyRx * 0.92} ${bodyCy - bodyRy * 0.55}
                L ${cx - bodyRx * 0.78} ${bodyCy + bodyRy * 0.70}`}
            stroke={ot.accent} strokeWidth={s * 0.022}
            strokeLinecap="round" opacity={0.90} />
          <Path
            d={`M ${cx + bodyRx * 0.92} ${bodyCy - bodyRy * 0.55}
                L ${cx + bodyRx * 0.78} ${bodyCy + bodyRy * 0.70}`}
            stroke={ot.accent} strokeWidth={s * 0.022}
            strokeLinecap="round" opacity={0.90} />
          {/* Thinner inner stripes */}
          <Path
            d={`M ${cx - bodyRx * 0.76} ${bodyCy - bodyRy * 0.48}
                L ${cx - bodyRx * 0.64} ${bodyCy + bodyRy * 0.68}`}
            stroke={ot.accent} strokeWidth={s * 0.010}
            strokeLinecap="round" opacity={0.55} />
          <Path
            d={`M ${cx + bodyRx * 0.76} ${bodyCy - bodyRy * 0.48}
                L ${cx + bodyRx * 0.64} ${bodyCy + bodyRy * 0.68}`}
            stroke={ot.accent} strokeWidth={s * 0.010}
            strokeLinecap="round" opacity={0.55} />

          {/* Crew-neck collar band */}
          <Ellipse cx={cx} cy={bodyCy - bodyRy * 0.90}
            rx={bodyRx * 0.48} ry={s * 0.026}
            fill={ot.collarMain} />

          {/* Zip line down centre */}
          <Path
            d={`M ${cx} ${bodyCy - bodyRy * 0.80} L ${cx} ${bodyCy + bodyRy * 0.85}`}
            stroke={ot.accent} strokeWidth={s * 0.012}
            strokeLinecap="round" opacity={0.70} />

          {/* Arms — with red stripe on each */}
          <Circle cx={laX} cy={laY} r={armR} fill={`url(#${uid}_a)`} />
          <Circle cx={raX} cy={raY} r={armR} fill={`url(#${uid}_a)`} />
          {/* Red dot on arms */}
          <Circle cx={laX} cy={laY} r={armR * 0.38}
            fill={ot.accent} opacity={0.50} />
          <Circle cx={raX} cy={raY} r={armR * 0.38}
            fill={ot.accent} opacity={0.50} />
        </>
      )}

      {/* ── Thumb (thumbsUp, drawn over arm) ───────────────────── */}
      {pose === 'thumbsUp' && (
        <>
          <Ellipse cx={raX} cy={raY - armR * 1.12}
            rx={armR * 0.46} ry={armR * 0.76} fill={ot.armMain} />
          <Circle cx={raX} cy={raY - armR * 1.96}
            r={armR * 0.36} fill={ot.armMain} />
          <Circle cx={raX - armR*0.10} cy={raY - armR*2.08}
            r={armR * 0.11} fill="rgba(255,255,255,0.26)" />
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          HEAD + FACE (same for all themes)
          ══════════════════════════════════════════════════════ */}

      {/* Head base */}
      <Circle cx={cx} cy={headCy} r={headR} fill={`url(#${uid}_h)`} />

      {/* Fluffy edge bumps (top arc) */}
      {[148, 120, 92, 64, 36].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const bx  = cx     + headR * 0.93 * Math.cos(rad);
        const by  = headCy - headR * 0.93 * Math.sin(rad);
        return <Circle key={deg} cx={bx} cy={by} r={s * 0.033} fill="#E8E8E8" />;
      })}
      {/* Smooth face over bumps */}
      <Circle cx={cx} cy={headCy} r={headR * 0.96} fill={`url(#${uid}_h)`} />

      {/* Head gloss */}
      <Ellipse
        cx={cx - headR * 0.22} cy={headCy - headR * 0.44}
        rx={headR * 0.35} ry={headR * 0.16}
        fill="rgba(255,255,255,0.58)"
        transform={`rotate(-18 ${cx - headR * 0.22} ${headCy - headR * 0.44})`} />

      {/* Eyes */}
      <Circle cx={glassLx} cy={glassCy + s*0.005} r={s * 0.020} fill="#181818" />
      <Circle cx={glassRx} cy={glassCy + s*0.005} r={s * 0.020} fill="#181818" />
      <Circle cx={glassLx - s*0.010} cy={glassCy - s*0.008} r={s*0.006}
        fill="rgba(255,255,255,0.76)" />
      <Circle cx={glassRx - s*0.010} cy={glassCy - s*0.008} r={s*0.006}
        fill="rgba(255,255,255,0.76)" />

      {/* Glasses frames */}
      <Circle cx={glassLx} cy={glassCy} r={glassR}
        fill="rgba(0,0,0,0.04)" stroke="#0D0D0D" strokeWidth={s * 0.020} />
      <Circle cx={glassRx} cy={glassCy} r={glassR}
        fill="rgba(0,0,0,0.04)" stroke="#0D0D0D" strokeWidth={s * 0.020} />
      {/* Bridge */}
      <Path
        d={`M ${glassLx + glassR - s*0.003} ${glassCy - s*0.004}
            L ${glassRx - glassR + s*0.003} ${glassCy - s*0.004}`}
        stroke="#0D0D0D" strokeWidth={s * 0.015} strokeLinecap="round" />
      {/* Side arms */}
      <Path d={`M ${glassLx - glassR} ${glassCy} L ${glassLx - glassR - s*0.030} ${glassCy + s*0.016}`}
        stroke="#0D0D0D" strokeWidth={s * 0.013} strokeLinecap="round" />
      <Path d={`M ${glassRx + glassR} ${glassCy} L ${glassRx + glassR + s*0.030} ${glassCy + s*0.016}`}
        stroke="#0D0D0D" strokeWidth={s * 0.013} strokeLinecap="round" />

      {/* Nose */}
      <Ellipse cx={cx} cy={noseCy} rx={noseRx} ry={noseRy} fill={`url(#${uid}_n)`} />
      <Ellipse cx={cx - noseRx*0.28} cy={noseCy - noseRy*0.28}
        rx={noseRx*0.26} ry={noseRy*0.24} fill="rgba(255,255,255,0.22)" />

      {/* Mouth */}
      <Path d={mouthD} stroke="#5A5A5A" strokeWidth={s*0.016}
        fill="none" strokeLinecap="round" />

      {/* Eyebrows — sad */}
      {isSad && (
        <>
          <Path d={`M ${glassLx - glassR*0.52} ${glassCy - glassR*0.86}
                    L ${glassLx + glassR*0.44} ${glassCy - glassR*1.16}`}
            stroke="#2E2E2E" strokeWidth={s*0.016} strokeLinecap="round" />
          <Path d={`M ${glassRx - glassR*0.44} ${glassCy - glassR*1.16}
                    L ${glassRx + glassR*0.52} ${glassCy - glassR*0.86}`}
            stroke="#2E2E2E" strokeWidth={s*0.016} strokeLinecap="round" />
        </>
      )}
      {/* Eyebrows — motivating */}
      {pose === 'motivating' && (
        <>
          <Path d={`M ${glassLx - glassR*0.64} ${glassCy - glassR*0.98}
                    Q ${glassLx} ${glassCy - glassR*1.54}
                      ${glassLx + glassR*0.64} ${glassCy - glassR*0.98}`}
            stroke="#2E2E2E" strokeWidth={s*0.016} fill="none" strokeLinecap="round" />
          <Path d={`M ${glassRx - glassR*0.64} ${glassCy - glassR*0.98}
                    Q ${glassRx} ${glassCy - glassR*1.54}
                      ${glassRx + glassR*0.64} ${glassCy - glassR*0.98}`}
            stroke="#2E2E2E" strokeWidth={s*0.016} fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Tears */}
      {pose === 'crying' && (
        <>
          <Ellipse cx={glassLx + s*0.013} cy={glassCy + glassR + s*0.025}
            rx={s*0.013} ry={s*0.034} fill="#70C8FF" fillOpacity={0.88} />
          <Ellipse cx={glassLx - s*0.008} cy={glassCy + glassR + s*0.056}
            rx={s*0.010} ry={s*0.022} fill="#70C8FF" fillOpacity={0.65} />
          <Ellipse cx={glassRx - s*0.013} cy={glassCy + glassR + s*0.025}
            rx={s*0.013} ry={s*0.034} fill="#70C8FF" fillOpacity={0.88} />
          <Ellipse cx={glassRx + s*0.008} cy={glassCy + glassR + s*0.056}
            rx={s*0.010} ry={s*0.022} fill="#70C8FF" fillOpacity={0.65} />
        </>
      )}

      {/* Sparkles */}
      {pose === 'motivating' && (
        <>
          <Path d={star(cx - s*0.368, s*0.214, s*0.036)} fill="#FFD700" opacity={0.92} />
          <Path d={star(cx + s*0.372, s*0.198, s*0.030)} fill="#FFD700" opacity={0.86} />
          <Path d={star(cx + s*0.095, s*0.068, s*0.022)} fill="#FFD700" opacity={0.74} />
        </>
      )}
    </Svg>
  );
}
