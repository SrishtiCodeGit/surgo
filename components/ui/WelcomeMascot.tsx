import { ThemeKey } from '@/types';
import Svg, {
  Circle, Ellipse, Path, Defs,
  RadialGradient as SvgRadialGrad,
  Stop,
} from 'react-native-svg';

// ─── Pastel palettes ──────────────────────────────────────────────────────────
const CFG = {
  soft: {
    bodyTop:   '#FFF9CC',
    bodyMid:   '#FFE040',
    bodyBot:   '#C49600',
    tummy:     '#FFFEF2',
    wingTop:   '#FFE566',
    wingBot:   '#B89200',
    foot:      '#FFD030',
    footBot:   '#9E7400',
    outline:   '#65470A',
    beak:      '#FF9A22',
    beakBot:   '#B85200',
    iris:      '#3A1A00',
    pupil:     '#080200',
    blush:     '#FFAC55',
    smile:     '#65470A',
    tuft:      '#FFE040',
    tuftBot:   '#B89200',
  },
  balanced: {
    bodyTop:   '#D2EEFF',
    bodyMid:   '#64A8FF',
    bodyBot:   '#0838CC',
    tummy:     '#ECF6FF',
    wingTop:   '#64A8FF',
    wingBot:   '#0838CC',
    foot:      '#4C98F8',
    footBot:   '#0628A8',
    outline:   '#061868',
    beak:      '#FFA820',
    beakBot:   '#B46400',
    iris:      '#001680',
    pupil:     '#000210',
    blush:     null,
    smile:     '#061868',
    tuft:      '#64A8FF',
    tuftBot:   '#0838CC',
  },
  hardcore: {
    bodyTop:   '#FFDED4',
    bodyMid:   '#FF6848',
    bodyBot:   '#B61A00',
    tummy:     '#FFF0EC',
    wingTop:   '#FF6848',
    wingBot:   '#B61A00',
    foot:      '#FF4E30',
    footBot:   '#8E0E00',
    outline:   '#6E0800',
    beak:      '#FF8C18',
    beakBot:   '#BA4200',
    iris:      '#5C0000',
    pupil:     '#0C0000',
    blush:     null,
    smile:     '#6E0800',
    tuft:      '#FF6848',
    tuftBot:   '#B61A00',
  },
} as const;

// ─── Mascot ───────────────────────────────────────────────────────────────────
export function WelcomeMascot({ themeKey, size }: { themeKey: ThemeKey; size: number }) {
  const s   = size;
  const cx  = s * 0.50;
  const cy  = s * 0.50;
  const cfg = CFG[themeKey];
  const p   = `m_${themeKey}`;

  // Body — slightly taller than wide, giving a rounded egg shape
  const bRx = s * 0.290;
  const bRy = s * 0.330;

  // Eyes
  const eyeY  = cy - bRy * 0.14;
  const eyeLx = cx - s * 0.110;
  const eyeRx = cx + s * 0.110;
  const eR    = s * 0.107;
  const iR    = s * 0.070;
  const pR    = s * 0.046;
  const OL    = s * 0.021;

  // ── Wings ──────────────────────────────────────────────────────────────────
  // Each wing is a single smooth cubic-bezier closed path.
  // Think of it as a rounded paddle: the top arc sweeps out and around,
  // the bottom arc sweeps back — both meeting at a gently rounded tip.
  //
  // At the tip we keep C2 and C3 on the same horizontal side so the tangent
  // is vertical → gives a perfectly smooth rounded end (no kink).

  const wUA_x = cx - bRx * 0.80;  // upper attach on body (left)
  const wUA_y = cy - bRy * 0.12;
  const wLA_x = cx - bRx * 0.78;  // lower attach on body (left)
  const wLA_y = cy + bRy * 0.24;
  const wTx   = cx - bRx * 1.48;  // tip x  (leftmost point)
  const wTy   = cy + bRy * 0.04;  // tip y  (slightly below centre)

  //  Top arc: upper attach → (sweep up-and-out) → tip
  //  Control 1 pulls the curve upward as it leaves the body.
  //  Control 2 approaches the tip from the right (and slightly above).
  //  Bottom arc: tip → (sweep down-and-in) → lower attach
  //  Control 3 leaves the tip toward the right (and slightly below).
  //  Control 4 curves back toward the body below.
  const leftWing = [
    `M ${wUA_x} ${wUA_y}`,
    `C ${cx - bRx * 1.08} ${cy - bRy * 0.50}`,    // C1 — up & out
    `  ${wTx + s * 0.052} ${wTy - bRy * 0.20}`,   // C2 — arrive at tip from above-right
    `  ${wTx} ${wTy}`,                              // tip
    `C ${wTx + s * 0.052} ${wTy + bRy * 0.24}`,   // C3 — leave tip toward below-right
    `  ${cx - bRx * 1.06} ${wLA_y + s * 0.04}`,   // C4 — sweep back toward body
    `  ${wLA_x} ${wLA_y}`,                         // lower attach
    `Z`,
  ].join(' ');

  // Mirror for right wing
  const rUA_x = cx + bRx * 0.80;
  const rLA_x = cx + bRx * 0.78;
  const rTx   = cx + bRx * 1.48;

  const rightWing = [
    `M ${rUA_x} ${wUA_y}`,
    `C ${cx + bRx * 1.08} ${cy - bRy * 0.50}`,
    `  ${rTx - s * 0.052} ${wTy - bRy * 0.20}`,
    `  ${rTx} ${wTy}`,
    `C ${rTx - s * 0.052} ${wTy + bRy * 0.24}`,
    `  ${cx + bRx * 1.06} ${wLA_y + s * 0.04}`,
    `  ${rLA_x} ${wLA_y}`,
    `Z`,
  ].join(' ');

  // ── Head crest — single smooth teardrop spike ──────────────────────────────
  const crBaseY = cy - bRy * 0.87;
  const crTipY  = cy - bRy * 1.24;
  const crHW    = s * 0.055;

  const crest = [
    `M ${cx - crHW} ${crBaseY}`,
    `C ${cx - crHW * 1.22} ${crBaseY - s * 0.038}`,
    `  ${cx - crHW * 0.28} ${crTipY + s * 0.014}`,
    `  ${cx} ${crTipY}`,
    `C ${cx + crHW * 0.28} ${crTipY + s * 0.014}`,
    `  ${cx + crHW * 1.22} ${crBaseY - s * 0.038}`,
    `  ${cx + crHW} ${crBaseY}`,
    `Z`,
  ].join(' ');

  // ── Beak ───────────────────────────────────────────────────────────────────
  const beakY  = eyeY + eR * 0.50;
  const beakH  = s * 0.070;
  const beakHW = s * 0.075;

  // Simple lens shape: bottom arc pronounced, top arc nearly flat
  const beak = [
    `M ${cx - beakHW} ${beakY}`,
    `C ${cx - beakHW * 0.42} ${beakY + beakH * 0.72}`,
    `  ${cx + beakHW * 0.42} ${beakY + beakH * 0.72}`,
    `  ${cx + beakHW} ${beakY}`,
    `C ${cx + beakHW * 0.42} ${beakY - beakH * 0.16}`,
    `  ${cx - beakHW * 0.42} ${beakY - beakH * 0.16}`,
    `  ${cx - beakHW} ${beakY}`,
    `Z`,
  ].join(' ');

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <SvgRadialGrad id={`${p}body`} cx="36%" cy="20%" r="76%">
          <Stop offset="0%"   stopColor={cfg.bodyTop} />
          <Stop offset="52%"  stopColor={cfg.bodyMid} />
          <Stop offset="100%" stopColor={cfg.bodyBot} />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}wing`} cx="30%" cy="16%" r="72%">
          <Stop offset="0%"   stopColor={cfg.wingTop} />
          <Stop offset="100%" stopColor={cfg.wingBot} />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}foot`} cx="36%" cy="20%" r="65%">
          <Stop offset="0%"   stopColor={cfg.foot}    />
          <Stop offset="100%" stopColor={cfg.footBot}  />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}shad`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="rgba(0,0,0,0.13)" />
          <Stop offset="100%" stopColor="rgba(0,0,0,0)"    />
        </SvgRadialGrad>
      </Defs>

      {/* ── Ground shadow ─────────────────────────────── */}
      <Ellipse cx={cx} cy={cy + bRy * 1.06}
        rx={bRx * 0.75} ry={bRy * 0.086}
        fill={`url(#${p}shad)`} />

      {/* ── Feet ──────────────────────────────────────── */}
      <Ellipse cx={cx - s * 0.096} cy={cy + bRy * 0.875}
        rx={s * 0.083} ry={s * 0.044}
        fill={`url(#${p}foot)`} stroke={cfg.outline} strokeWidth={OL * 0.56} />
      <Ellipse cx={cx + s * 0.096} cy={cy + bRy * 0.875}
        rx={s * 0.083} ry={s * 0.044}
        fill={`url(#${p}foot)`} stroke={cfg.outline} strokeWidth={OL * 0.56} />

      {/* ── Wings (behind body) ───────────────────────── */}
      <Path d={leftWing}
        fill={`url(#${p}wing)`}
        stroke={cfg.outline} strokeWidth={OL * 0.70}
        strokeLinejoin="round" />
      <Path d={rightWing}
        fill={`url(#${p}wing)`}
        stroke={cfg.outline} strokeWidth={OL * 0.70}
        strokeLinejoin="round" />

      {/* Wing gloss highlights */}
      <Ellipse
        cx={wTx + s * 0.115} cy={wTy - bRy * 0.12}
        rx={s * 0.036} ry={s * 0.020}
        fill="rgba(255,255,255,0.30)"
        transform={`rotate(-26 ${wTx + s * 0.115} ${wTy - bRy * 0.12})`} />
      <Ellipse
        cx={rTx - s * 0.115} cy={wTy - bRy * 0.12}
        rx={s * 0.036} ry={s * 0.020}
        fill="rgba(255,255,255,0.30)"
        transform={`rotate(26 ${rTx - s * 0.115} ${wTy - bRy * 0.12})`} />

      {/* ── Head crest ────────────────────────────────── */}
      <Path d={crest}
        fill={cfg.tuft}
        stroke={cfg.outline} strokeWidth={OL * 0.50}
        strokeLinejoin="round" />

      {/* ── Main body ─────────────────────────────────── */}
      <Ellipse cx={cx} cy={cy} rx={bRx} ry={bRy}
        fill={`url(#${p}body)`}
        stroke={cfg.outline} strokeWidth={OL} />

      {/* Tummy */}
      <Ellipse cx={cx} cy={cy + bRy * 0.25}
        rx={bRx * 0.55} ry={bRy * 0.44}
        fill={cfg.tummy} fillOpacity={0.60} />

      {/* Body gloss */}
      <Ellipse
        cx={cx - bRx * 0.17} cy={cy - bRy * 0.51}
        rx={bRx * 0.37} ry={bRy * 0.11}
        fill="rgba(255,255,255,0.46)"
        transform={`rotate(-15 ${cx - bRx * 0.17} ${cy - bRy * 0.51})`} />

      {/* ── Eyes ──────────────────────────────────────── */}
      <Circle cx={eyeLx} cy={eyeY} r={eR}
        fill="white" stroke={cfg.outline} strokeWidth={OL * 0.78} />
      <Circle cx={eyeRx} cy={eyeY} r={eR}
        fill="white" stroke={cfg.outline} strokeWidth={OL * 0.78} />

      {/* Iris */}
      <Circle cx={eyeLx} cy={eyeY + eR * 0.08} r={iR} fill={cfg.iris} />
      <Circle cx={eyeRx} cy={eyeY + eR * 0.08} r={iR} fill={cfg.iris} />

      {/* Pupil */}
      <Circle cx={eyeLx} cy={eyeY + eR * 0.10} r={pR} fill={cfg.pupil} />
      <Circle cx={eyeRx} cy={eyeY + eR * 0.10} r={pR} fill={cfg.pupil} />

      {/* Eye shine — large + small spot */}
      <Circle cx={eyeLx - iR * 0.24} cy={eyeY - iR * 0.27} r={s * 0.031} fill="white" />
      <Circle cx={eyeRx - iR * 0.24} cy={eyeY - iR * 0.27} r={s * 0.031} fill="white" />
      <Circle cx={eyeLx + iR * 0.22} cy={eyeY + iR * 0.09} r={s * 0.014} fill="rgba(255,255,255,0.65)" />
      <Circle cx={eyeRx + iR * 0.22} cy={eyeY + iR * 0.09} r={s * 0.014} fill="rgba(255,255,255,0.65)" />

      {/* ── Eyebrows ───────────────────────────────────── */}
      {themeKey === 'soft' && (
        // Happy arched brows — soft & friendly
        <>
          <Path
            d={`M ${eyeLx - eR * 0.60} ${eyeY - eR * 0.84}
                Q ${eyeLx} ${eyeY - eR * 1.22}
                  ${eyeLx + eR * 0.60} ${eyeY - eR * 0.84}`}
            stroke={cfg.outline} strokeWidth={s * 0.022}
            fill="none" strokeLinecap="round" />
          <Path
            d={`M ${eyeRx - eR * 0.60} ${eyeY - eR * 0.84}
                Q ${eyeRx} ${eyeY - eR * 1.22}
                  ${eyeRx + eR * 0.60} ${eyeY - eR * 0.84}`}
            stroke={cfg.outline} strokeWidth={s * 0.022}
            fill="none" strokeLinecap="round" />
        </>
      )}
      {themeKey === 'balanced' && (
        // Slightly inward-angled — focused
        <>
          <Path d={`M ${eyeLx - eR * 0.65} ${eyeY - eR * 0.80}
                    L ${eyeLx + eR * 0.50} ${eyeY - eR * 0.65}`}
            stroke={cfg.outline} strokeWidth={s * 0.025} strokeLinecap="round" />
          <Path d={`M ${eyeRx - eR * 0.50} ${eyeY - eR * 0.65}
                    L ${eyeRx + eR * 0.65} ${eyeY - eR * 0.80}`}
            stroke={cfg.outline} strokeWidth={s * 0.025} strokeLinecap="round" />
        </>
      )}
      {themeKey === 'hardcore' && (
        // Sharp V — fierce but still cute
        <>
          <Path d={`M ${eyeLx - eR * 0.68} ${eyeY - eR * 0.96}
                    L ${eyeLx + eR * 0.55} ${eyeY - eR * 0.62}`}
            stroke={cfg.outline} strokeWidth={s * 0.030} strokeLinecap="round" />
          <Path d={`M ${eyeRx - eR * 0.55} ${eyeY - eR * 0.62}
                    L ${eyeRx + eR * 0.68} ${eyeY - eR * 0.96}`}
            stroke={cfg.outline} strokeWidth={s * 0.030} strokeLinecap="round" />
        </>
      )}

      {/* ── Beak ───────────────────────────────────────── */}
      <Path d={beak}
        fill={cfg.beak} stroke={cfg.beakBot}
        strokeWidth={OL * 0.46} strokeLinejoin="round" />
      {/* Centre line */}
      <Path d={`M ${cx} ${beakY - beakH * 0.10} L ${cx} ${beakY + beakH * 0.62}`}
        stroke={cfg.beakBot} strokeWidth={OL * 0.34}
        strokeLinecap="round" opacity={0.46} />

      {/* ── Blush (soft theme only) ────────────────────── */}
      {cfg.blush && (
        <>
          <Ellipse cx={eyeLx - eR * 0.40} cy={eyeY + eR * 0.85}
            rx={eR * 0.67} ry={eR * 0.38}
            fill={cfg.blush} fillOpacity={0.36} />
          <Ellipse cx={eyeRx + eR * 0.40} cy={eyeY + eR * 0.85}
            rx={eR * 0.67} ry={eR * 0.38}
            fill={cfg.blush} fillOpacity={0.36} />
        </>
      )}

      {/* ── Smile ─────────────────────────────────────── */}
      <Path
        d={
          themeKey === 'soft'
            ? `M ${cx - s*0.122} ${cy + bRy*0.31}
               Q ${cx} ${cy + bRy*0.54} ${cx + s*0.122} ${cy + bRy*0.31}`
            : themeKey === 'hardcore'
            ? `M ${cx - s*0.088} ${cy + bRy*0.33}
               Q ${cx + s*0.030} ${cy + bRy*0.49} ${cx + s*0.122} ${cy + bRy*0.31}`
            : `M ${cx - s*0.110} ${cy + bRy*0.29}
               Q ${cx} ${cy + bRy*0.50} ${cx + s*0.110} ${cy + bRy*0.29}`
        }
        stroke={cfg.smile} strokeWidth={s * 0.024}
        fill="none" strokeLinecap="round" />
    </Svg>
  );
}
