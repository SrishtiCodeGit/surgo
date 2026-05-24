import { ThemeKey } from '@/types';
import Svg, {
  Circle, Ellipse, Path, Defs,
  RadialGradient as SvgRadialGrad,
  LinearGradient as SvgLinearGrad,
  Stop,
} from 'react-native-svg';

// ─── Pastel theme palettes ────────────────────────────────────────────────────

const CFG = {
  soft: {
    // Warm cream / sunshine yellow — soft & pastel
    bodyLight:  '#FFFAE8',
    bodyMid:    '#FFE566',
    bodyDark:   '#D4A800',
    tummy:      '#FFFDF5',
    wingLight:  '#FFE566',
    wingDark:   '#CAAA00',
    footLight:  '#FFD84A',
    footDark:   '#B89200',
    outline:    '#7A5C00',
    blush:      '#FFB347',
    smile:      '#7A5C00',
    pupil:      '#1A0A00',
    irisColor:  '#6B3A00',
    beak:       '#FFA040',
    beakDark:   '#CC6000',
    tuftColor:  '#FFE566',
    eyebrowColor: '#7A5C00',
    browType:   'happy' as const,
  },
  balanced: {
    // Pastel sky blue / periwinkle
    bodyLight:  '#E8F4FF',
    bodyMid:    '#90C8FF',
    bodyDark:   '#2060CC',
    tummy:      '#F5FAFF',
    wingLight:  '#90C8FF',
    wingDark:   '#2060CC',
    footLight:  '#6AAAF0',
    footDark:   '#1040A0',
    outline:    '#0A3080',
    blush:      null,
    smile:      '#0A3080',
    pupil:      '#000A20',
    irisColor:  '#0050A0',
    beak:       '#F0B040',
    beakDark:   '#C07000',
    tuftColor:  '#90C8FF',
    eyebrowColor: '#0A3080',
    browType:   'focused' as const,
  },
  hardcore: {
    // Pastel coral / peach — still has energy but softer
    bodyLight:  '#FFE8DF',
    bodyMid:    '#FF8C6A',
    bodyDark:   '#C03010',
    tummy:      '#FFF5F2',
    wingLight:  '#FF8C6A',
    wingDark:   '#C03010',
    footLight:  '#FF7050',
    footDark:   '#A02000',
    outline:    '#801800',
    blush:      null,
    smile:      '#801800',
    pupil:      '#200000',
    irisColor:  '#801800',
    beak:       '#FF9030',
    beakDark:   '#CC5000',
    tuftColor:  '#FF8C6A',
    eyebrowColor: '#801800',
    browType:   'fierce' as const,
  },
} as const;

// ─── Mascot ───────────────────────────────────────────────────────────────────

export function WelcomeMascot({ themeKey, size }: { themeKey: ThemeKey; size: number }) {
  const s  = size;
  const cx = s * 0.50;
  const cy = s * 0.50;
  const cfg = CFG[themeKey];
  const p   = `m_${themeKey}`;

  // Body dimensions — slightly wider/rounder than before
  const bW = s * 0.64;   // full width
  const bH = s * 0.72;   // full height
  const bRx = bW / 2;
  const bRy = bH / 2;

  // Eye positions — higher on face, larger (Duo-style)
  const eyeY  = cy - bRy * 0.14;
  const eyeLx = cx - s * 0.148;
  const eyeRx = cx + s * 0.148;
  const eR    = s * 0.130;   // big Duo-style eyes
  const iR    = s * 0.085;
  const pR    = s * 0.056;

  const OL = s * 0.026;   // outline thickness

  // ── Wing paths (actual teardrop wing shapes, not blobs) ──
  const wAttachY = cy - bRy * 0.10;
  const wLow     = cy + bRy * 0.20;
  const wTipLx   = cx - bRx * 1.52;
  const wTipRx   = cx + bRx * 1.52;
  const wTipY    = cy - bRy * 0.30;

  const leftWing  = `M ${cx - bRx * 0.88} ${wAttachY} Q ${wTipLx} ${wTipY} ${wTipLx + s*0.06} ${cy + bRy*0.08} Q ${cx - bRx * 1.12} ${wLow + s*0.04} ${cx - bRx * 0.88} ${wLow} Z`;
  const rightWing = `M ${cx + bRx * 0.88} ${wAttachY} Q ${wTipRx} ${wTipY} ${wTipRx - s*0.06} ${cy + bRy*0.08} Q ${cx + bRx * 1.12} ${wLow + s*0.04} ${cx + bRx * 0.88} ${wLow} Z`;

  // ── Beak (small rounded triangle below eyes) ──
  const beakCx = cx;
  const beakTy = eyeY + eR * 0.60;
  const beakBy = beakTy + s * 0.090;
  const beakW  = s * 0.090;

  // ── Tuft (top of head — 3 small rounded bumps) ──
  const tuftY = cy - bRy * 0.93;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <SvgRadialGrad id={`${p}body`} cx="35%" cy="20%" r="80%">
          <Stop offset="0%"   stopColor={cfg.bodyLight} />
          <Stop offset="50%"  stopColor={cfg.bodyMid}   />
          <Stop offset="100%" stopColor={cfg.bodyDark}  />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}wing`} cx="30%" cy="20%" r="80%">
          <Stop offset="0%"   stopColor={cfg.wingLight} />
          <Stop offset="100%" stopColor={cfg.wingDark}  />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}foot`} cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor={cfg.footLight} />
          <Stop offset="100%" stopColor={cfg.footDark}  />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="rgba(0,0,0,0.15)" />
          <Stop offset="100%" stopColor="rgba(0,0,0,0)"     />
        </SvgRadialGrad>
      </Defs>

      {/* ── Ground shadow ────────────────────────────────────── */}
      <Ellipse
        cx={cx} cy={cy + bRy * 1.08}
        rx={bRx * 0.85} ry={bRy * 0.10}
        fill={`url(#${p}shadow)`}
      />

      {/* ── Feet (rounded, visible below body) ──────────────── */}
      <Ellipse
        cx={cx - s*0.13} cy={cy + bRy * 0.88}
        rx={s*0.100} ry={s*0.060}
        fill={`url(#${p}foot)`}
        stroke={cfg.outline} strokeWidth={OL * 0.75}
      />
      <Ellipse
        cx={cx + s*0.13} cy={cy + bRy * 0.88}
        rx={s*0.100} ry={s*0.060}
        fill={`url(#${p}foot)`}
        stroke={cfg.outline} strokeWidth={OL * 0.75}
      />

      {/* ── Wings (drawn behind body) ────────────────────────── */}
      <Path d={leftWing}  fill={`url(#${p}wing)`} stroke={cfg.outline} strokeWidth={OL * 0.85} strokeLinejoin="round" />
      <Path d={rightWing} fill={`url(#${p}wing)`} stroke={cfg.outline} strokeWidth={OL * 0.85} strokeLinejoin="round" />
      {/* Wing gloss */}
      <Ellipse cx={wTipLx + s*0.10} cy={wTipY + s*0.04} rx={s*0.040} ry={s*0.024}
        fill="rgba(255,255,255,0.35)"
        transform={`rotate(-30 ${wTipLx + s*0.10} ${wTipY + s*0.04})`}
      />
      <Ellipse cx={wTipRx - s*0.10} cy={wTipY + s*0.04} rx={s*0.040} ry={s*0.024}
        fill="rgba(255,255,255,0.35)"
        transform={`rotate(30 ${wTipRx - s*0.10} ${wTipY + s*0.04})`}
      />

      {/* ── Head tufts (3 bumps on top) ──────────────────────── */}
      <Circle cx={cx - s*0.090} cy={tuftY + s*0.010} r={s*0.055}
        fill={cfg.tuftColor} stroke={cfg.outline} strokeWidth={OL * 0.70} />
      <Circle cx={cx}          cy={tuftY - s*0.010} r={s*0.065}
        fill={cfg.tuftColor} stroke={cfg.outline} strokeWidth={OL * 0.70} />
      <Circle cx={cx + s*0.090} cy={tuftY + s*0.010} r={s*0.055}
        fill={cfg.tuftColor} stroke={cfg.outline} strokeWidth={OL * 0.70} />

      {/* ── Main body ────────────────────────────────────────── */}
      <Ellipse
        cx={cx} cy={cy}
        rx={bRx} ry={bRy}
        fill={`url(#${p}body)`}
        stroke={cfg.outline}
        strokeWidth={OL}
      />

      {/* Tummy highlight */}
      <Ellipse
        cx={cx} cy={cy + bRy * 0.26}
        rx={bRx * 0.56} ry={bRy * 0.46}
        fill={cfg.tummy}
        fillOpacity={0.70}
      />

      {/* Body gloss */}
      <Ellipse
        cx={cx - bRx * 0.20} cy={cy - bRy * 0.55}
        rx={bRx * 0.42} ry={bRy * 0.14}
        fill="rgba(255,255,255,0.50)"
        transform={`rotate(-18 ${cx - bRx*0.20} ${cy - bRy*0.55})`}
      />

      {/* ── Eye whites (large, Duo-style) ────────────────────── */}
      <Circle cx={eyeLx} cy={eyeY} r={eR}
        fill="white" stroke={cfg.outline} strokeWidth={OL * 0.90} />
      <Circle cx={eyeRx} cy={eyeY} r={eR}
        fill="white" stroke={cfg.outline} strokeWidth={OL * 0.90} />

      {/* Iris */}
      <Circle cx={eyeLx} cy={eyeY + eR * 0.08} r={iR} fill={cfg.irisColor} />
      <Circle cx={eyeRx} cy={eyeY + eR * 0.08} r={iR} fill={cfg.irisColor} />

      {/* Pupil */}
      <Circle cx={eyeLx} cy={eyeY + eR * 0.10} r={pR} fill={cfg.pupil} />
      <Circle cx={eyeRx} cy={eyeY + eR * 0.10} r={pR} fill={cfg.pupil} />

      {/* Eye shine — big primary + small secondary (Duo look) */}
      <Circle cx={eyeLx - iR * 0.28} cy={eyeY - iR * 0.30} r={s * 0.038} fill="white" />
      <Circle cx={eyeRx - iR * 0.28} cy={eyeY - iR * 0.30} r={s * 0.038} fill="white" />
      <Circle cx={eyeLx + iR * 0.26} cy={eyeY + iR * 0.10} r={s * 0.018} fill="rgba(255,255,255,0.75)" />
      <Circle cx={eyeRx + iR * 0.26} cy={eyeY + iR * 0.10} r={s * 0.018} fill="rgba(255,255,255,0.75)" />

      {/* ── Eyebrows (theme personality) ─────────────────────── */}
      {cfg.browType === 'happy' && (
        // Soft: gentle happy arched brows
        <>
          <Path
            d={`M ${eyeLx - eR*0.68} ${eyeY - eR*0.98} Q ${eyeLx} ${eyeY - eR*1.32} ${eyeLx + eR*0.68} ${eyeY - eR*0.98}`}
            stroke={cfg.eyebrowColor} strokeWidth={s*0.028} fill="none" strokeLinecap="round"
          />
          <Path
            d={`M ${eyeRx - eR*0.68} ${eyeY - eR*0.98} Q ${eyeRx} ${eyeY - eR*1.32} ${eyeRx + eR*0.68} ${eyeY - eR*0.98}`}
            stroke={cfg.eyebrowColor} strokeWidth={s*0.028} fill="none" strokeLinecap="round"
          />
        </>
      )}
      {cfg.browType === 'focused' && (
        // Balanced: straight, slightly inward-tilted + glasses
        <>
          <Path d={`M ${eyeLx - eR*0.75} ${eyeY - eR*0.88} L ${eyeLx + eR*0.60} ${eyeY - eR*0.72}`}
            stroke={cfg.eyebrowColor} strokeWidth={s*0.030} strokeLinecap="round" />
          <Path d={`M ${eyeRx - eR*0.60} ${eyeY - eR*0.72} L ${eyeRx + eR*0.75} ${eyeY - eR*0.88}`}
            stroke={cfg.eyebrowColor} strokeWidth={s*0.030} strokeLinecap="round" />
          {/* Round glasses */}
          <Circle cx={eyeLx} cy={eyeY} r={eR*1.14} fill="none"
            stroke="#A0B8E8" strokeWidth={s*0.020} strokeOpacity="0.85" />
          <Circle cx={eyeRx} cy={eyeY} r={eR*1.14} fill="none"
            stroke="#A0B8E8" strokeWidth={s*0.020} strokeOpacity="0.85" />
          <Path d={`M ${eyeLx + eR*1.14} ${eyeY} L ${eyeRx - eR*1.14} ${eyeY}`}
            stroke="#A0B8E8" strokeWidth={s*0.015} strokeOpacity="0.75" />
          <Path d={`M ${eyeLx - eR*1.14} ${eyeY + eR*0.10} L ${eyeLx - eR*1.48} ${eyeY + eR*0.40}`}
            stroke="#A0B8E8" strokeWidth={s*0.014} strokeLinecap="round" strokeOpacity="0.68" />
          <Path d={`M ${eyeRx + eR*1.14} ${eyeY + eR*0.10} L ${eyeRx + eR*1.48} ${eyeY + eR*0.40}`}
            stroke="#A0B8E8" strokeWidth={s*0.014} strokeLinecap="round" strokeOpacity="0.68" />
        </>
      )}
      {cfg.browType === 'fierce' && (
        // Hardcore: sharp angled V brows — intense but still cute
        <>
          <Path d={`M ${eyeLx - eR*0.78} ${eyeY - eR*1.08} L ${eyeLx + eR*0.62} ${eyeY - eR*0.72}`}
            stroke={cfg.eyebrowColor} strokeWidth={s*0.036} strokeLinecap="round" />
          <Path d={`M ${eyeRx - eR*0.62} ${eyeY - eR*0.72} L ${eyeRx + eR*0.78} ${eyeY - eR*1.08}`}
            stroke={cfg.eyebrowColor} strokeWidth={s*0.036} strokeLinecap="round" />
        </>
      )}

      {/* ── Beak (small, cute, defined) ───────────────────────── */}
      <Path
        d={`M ${beakCx - beakW*0.5} ${beakTy} Q ${beakCx} ${beakTy - s*0.012} ${beakCx + beakW*0.5} ${beakTy} Q ${beakCx + beakW*0.28} ${beakBy} ${beakCx} ${beakBy + s*0.008} Q ${beakCx - beakW*0.28} ${beakBy} ${beakCx - beakW*0.5} ${beakTy} Z`}
        fill={cfg.beak}
        stroke={cfg.beakDark}
        strokeWidth={OL * 0.60}
        strokeLinejoin="round"
      />
      {/* Beak centre line */}
      <Path
        d={`M ${beakCx} ${beakTy} L ${beakCx} ${beakBy}`}
        stroke={cfg.beakDark} strokeWidth={OL * 0.40} strokeLinecap="round" opacity="0.55"
      />

      {/* ── Blush cheeks (soft theme only) ────────────────────── */}
      {cfg.blush && (
        <>
          <Ellipse cx={eyeLx - eR*0.50} cy={eyeY + eR*0.85} rx={eR*0.80} ry={eR*0.46}
            fill={cfg.blush} fillOpacity={0.50} />
          <Ellipse cx={eyeRx + eR*0.50} cy={eyeY + eR*0.85} rx={eR*0.80} ry={eR*0.46}
            fill={cfg.blush} fillOpacity={0.50} />
        </>
      )}

      {/* ── Smile ─────────────────────────────────────────────── */}
      <Path
        d={
          cfg.browType === 'happy'
            ? `M ${cx - s*0.155} ${cy + bRy*0.34} Q ${cx} ${cy + bRy*0.60} ${cx + s*0.155} ${cy + bRy*0.34}`
            : cfg.browType === 'fierce'
            ? `M ${cx - s*0.110} ${cy + bRy*0.36} Q ${cx + s*0.040} ${cy + bRy*0.54} ${cx + s*0.150} ${cy + bRy*0.34}`
            : `M ${cx - s*0.138} ${cy + bRy*0.32} Q ${cx} ${cy + bRy*0.54} ${cx + s*0.138} ${cy + bRy*0.32}`
        }
        stroke={cfg.smile}
        strokeWidth={s * 0.030}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
