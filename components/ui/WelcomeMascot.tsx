import { ThemeKey } from '@/types';
import Svg, {
  Circle, Ellipse, Path, Defs,
  RadialGradient as SvgRadialGrad,
  Stop,
} from 'react-native-svg';

const CFG = {
  soft: {
    body:  ['#FFF5A0', '#F5C030', '#C07800'] as const,
    iris:  ['#FFD080', '#5A2800']             as const,
    arm:   ['#FFE870', '#C07200']             as const,
    foot:  ['#FFD840', '#A05C00']             as const,
    ear:   ['#FFE870', '#C07800']             as const,
    gnd:   'rgba(180,120,0,0.14)',
    smile: '#8A5000',
    blush: '#FFAA30',
    gloss: 'rgba(255,255,200,0.42)',
    eyeRy: 1.0,
  },
  balanced: {
    body:  ['#A0B0FF', '#4050D8', '#0A0A70'] as const,
    iris:  ['#80E0FF', '#004A70']             as const,
    arm:   ['#7080F8', '#1020A0']             as const,
    foot:  ['#5060E8', '#080870']             as const,
    ear:   ['#7080F8', '#1020A0']             as const,
    gnd:   'rgba(60,80,220,0.16)',
    smile: '#1A1A80',
    blush: null,
    gloss: 'rgba(200,220,255,0.40)',
    eyeRy: 0.90,
  },
  hardcore: {
    body:  ['#FF8060', '#FF2800', '#6A0000'] as const,
    iris:  ['#FF9060', '#8A0000']             as const,
    arm:   ['#FF5040', '#7A0000']             as const,
    foot:  ['#DD3020', '#5A0000']             as const,
    ear:   ['#FF5040', '#7A0000']             as const,
    gnd:   'rgba(255,60,0,0.18)',
    smile: '#2A0000',
    blush: null,
    gloss: 'rgba(255,200,120,0.30)',
    eyeRy: 0.88,
  },
} as const;

export function WelcomeMascot({ themeKey, size }: { themeKey: ThemeKey; size: number }) {
  const s   = size;
  const cx  = s * 0.5;
  const bCy = s * 0.50;
  const bRx = s * 0.30;
  const bRy = s * 0.36;

  const eyeY  = bCy - bRy * 0.14;
  const eyeLx = cx - s * 0.135;
  const eyeRx = cx + s * 0.135;
  const eR    = s * 0.112;
  const iR    = s * 0.074;
  const pR    = s * 0.050;

  const cfg        = CFG[themeKey];
  const isBalanced = themeKey === 'balanced';
  const isSoft     = themeKey === 'soft';
  const p          = `wl_${themeKey}`;   // gradient ID prefix

  return (
    <Svg width={s} height={s}>
      <Defs>
        <SvgRadialGrad id={`${p}b`}  cx="30%" cy="22%" r="78%">
          <Stop offset="0%"   stopColor={cfg.body[0]} />
          <Stop offset="35%"  stopColor={cfg.body[1]} />
          <Stop offset="100%" stopColor={cfg.body[2]} />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}i`}  cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor={cfg.iris[0]} />
          <Stop offset="100%" stopColor={cfg.iris[1]} />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}a`}  cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor={cfg.arm[0]} />
          <Stop offset="100%" stopColor={cfg.arm[1]} />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}f`}  cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor={cfg.foot[0]} />
          <Stop offset="100%" stopColor={cfg.foot[1]} />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}e`}  cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor={cfg.ear[0]} />
          <Stop offset="100%" stopColor={cfg.ear[1]} />
        </SvgRadialGrad>
        <SvgRadialGrad id={`${p}gn`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor={cfg.gnd} />
          <Stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </SvgRadialGrad>
      </Defs>

      {/* Ground shadow */}
      <Ellipse cx={cx} cy={bCy + bRy*1.08} rx={bRx*0.85} ry={bRy*0.12} fill={`url(#${p}gn)`} />

      {/* Feet */}
      <Ellipse cx={cx - s*0.105} cy={bCy + bRy*0.90} rx={s*0.090} ry={s*0.065} fill={`url(#${p}f)`} />
      <Ellipse cx={cx + s*0.105} cy={bCy + bRy*0.90} rx={s*0.090} ry={s*0.065} fill={`url(#${p}f)`} />

      {/* Ear bumps */}
      <Circle cx={cx - bRx*0.50} cy={bCy - bRy*0.88} r={s*0.068} fill={`url(#${p}e)`} />
      <Circle cx={cx + bRx*0.50} cy={bCy - bRy*0.88} r={s*0.068} fill={`url(#${p}e)`} />
      <Ellipse cx={cx - bRx*0.50} cy={bCy - bRy*0.91} rx={s*0.032} ry={s*0.028}
        fill={cfg.body[0]} opacity="0.55" />
      <Ellipse cx={cx + bRx*0.50} cy={bCy - bRy*0.91} rx={s*0.032} ry={s*0.028}
        fill={cfg.body[0]} opacity="0.55" />

      {/* Body */}
      <Ellipse cx={cx} cy={bCy} rx={bRx} ry={bRy} fill={`url(#${p}b)`} />
      <Ellipse cx={cx} cy={bCy + bRy*0.28} rx={bRx*0.68} ry={bRy*0.52}
        fill={cfg.body[0]} fillOpacity={0.30} />

      {/* ── Arms raised in welcoming pose ── */}
      <Circle cx={cx - bRx*1.00} cy={bCy - bRy*0.60} r={s*0.095} fill={`url(#${p}a)`} />
      <Circle cx={cx + bRx*1.00} cy={bCy - bRy*0.60} r={s*0.095} fill={`url(#${p}a)`} />
      {/* Arm gloss */}
      <Circle cx={cx - bRx*1.04} cy={bCy - bRy*0.66} r={s*0.038} fill="rgba(255,255,255,0.30)" />
      <Circle cx={cx + bRx*0.96} cy={bCy - bRy*0.66} r={s*0.038} fill="rgba(255,255,255,0.30)" />

      {/* ── Eyes ── */}
      <Ellipse cx={eyeLx} cy={eyeY} rx={eR} ry={eR * cfg.eyeRy} fill="white" />
      <Ellipse cx={eyeRx} cy={eyeY} rx={eR} ry={eR * cfg.eyeRy} fill="white" />
      <Circle  cx={eyeLx} cy={eyeY + eR*0.06} r={iR} fill={`url(#${p}i)`} />
      <Circle  cx={eyeRx} cy={eyeY + eR*0.06} r={iR} fill={`url(#${p}i)`} />
      <Circle  cx={eyeLx} cy={eyeY + eR*0.08} r={pR} fill="#050008" />
      <Circle  cx={eyeRx} cy={eyeY + eR*0.08} r={pR} fill="#050008" />
      {/* Eye shine */}
      <Circle cx={eyeLx - iR*0.32} cy={eyeY - iR*0.36} r={s*0.030} fill="white" />
      <Circle cx={eyeRx - iR*0.32} cy={eyeY - iR*0.36} r={s*0.030} fill="white" />
      <Circle cx={eyeLx + iR*0.28} cy={eyeY + iR*0.06} r={s*0.016} fill="rgba(255,255,255,0.65)" />
      <Circle cx={eyeRx + iR*0.28} cy={eyeY + iR*0.06} r={s*0.016} fill="rgba(255,255,255,0.65)" />

      {/* Balanced: glasses */}
      {isBalanced && (
        <>
          <Circle cx={eyeLx} cy={eyeY} r={eR*1.10} fill="none"
            stroke="#C0D0FF" strokeWidth={s*0.018} strokeOpacity="0.88" />
          <Circle cx={eyeRx} cy={eyeY} r={eR*1.10} fill="none"
            stroke="#C0D0FF" strokeWidth={s*0.018} strokeOpacity="0.88" />
          <Path
            d={`M ${eyeLx + eR*1.10} ${eyeY - eR*0.05} L ${eyeRx - eR*1.10} ${eyeY - eR*0.05}`}
            stroke="#C0D0FF" strokeWidth={s*0.013} strokeOpacity="0.80"
          />
          <Path d={`M ${eyeLx - eR*1.10} ${eyeY} L ${eyeLx - eR*1.42} ${eyeY + eR*0.24}`}
            stroke="#C0D0FF" strokeWidth={s*0.012} strokeLinecap="round" strokeOpacity="0.72" />
          <Path d={`M ${eyeRx + eR*1.10} ${eyeY} L ${eyeRx + eR*1.42} ${eyeY + eR*0.24}`}
            stroke="#C0D0FF" strokeWidth={s*0.012} strokeLinecap="round" strokeOpacity="0.72" />
          {/* Determined brows */}
          <Path d={`M ${eyeLx - eR*0.72} ${eyeY - eR*0.86} L ${eyeLx + eR*0.58} ${eyeY - eR*0.68}`}
            stroke="#0A0A60" strokeWidth={s*0.030} strokeLinecap="round" />
          <Path d={`M ${eyeRx - eR*0.58} ${eyeY - eR*0.68} L ${eyeRx + eR*0.72} ${eyeY - eR*0.86}`}
            stroke="#0A0A60" strokeWidth={s*0.030} strokeLinecap="round" />
        </>
      )}

      {/* ── Wide welcoming smile (all themes) ── */}
      <Path
        d={`M ${cx - s*0.165} ${bCy + bRy*0.20} Q ${cx} ${bCy + bRy*0.52} ${cx + s*0.165} ${bCy + bRy*0.20}`}
        stroke={cfg.smile} strokeWidth={s * 0.026} fill="none" strokeLinecap="round"
      />

      {/* Soft: blush cheeks */}
      {isSoft && (
        <>
          <Ellipse cx={eyeLx - eR*0.62} cy={bCy + bRy*0.06} rx={eR*0.80} ry={eR*0.50}
            fill={cfg.blush!} fillOpacity={0.50} />
          <Ellipse cx={eyeRx + eR*0.62} cy={bCy + bRy*0.06} rx={eR*0.80} ry={eR*0.50}
            fill={cfg.blush!} fillOpacity={0.50} />
        </>
      )}

      {/* Body gloss */}
      <Ellipse
        cx={cx - bRx*0.16} cy={bCy - bRy*0.60}
        rx={bRx*0.52} ry={bRy*0.16}
        fill={cfg.gloss}
        transform={`rotate(-16 ${cx - bRx*0.16} ${bCy - bRy*0.60})`}
      />
      <Ellipse
        cx={cx - bRx*0.62} cy={bCy - bRy*0.22}
        rx={bRx*0.18} ry={bRy*0.36}
        fill={cfg.gloss}
        transform={`rotate(-10 ${cx - bRx*0.62} ${bCy - bRy*0.22})`}
      />
    </Svg>
  );
}
