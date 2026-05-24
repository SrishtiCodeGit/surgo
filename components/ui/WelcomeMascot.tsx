import { ThemeKey } from '@/types';
import Svg, {
  Circle, Ellipse, Path, Defs,
  RadialGradient as SvgRadialGrad,
  Stop, G,
} from 'react-native-svg';

const CFG = {
  soft: {
    body:    ['#FFE84D', '#F5C030', '#C07800'] as const,
    iris:    ['#FFD080', '#5A2800']             as const,
    arm:     ['#FFE030', '#C07200']             as const,
    foot:    ['#FFD840', '#A05C00']             as const,
    ear:     ['#FFE870', '#C07800']             as const,
    outline: '#8A5000',
    gnd:     'rgba(180,120,0,0.22)',
    smile:   '#8A5000',
    blush:   '#FFAA30',
    gloss:   'rgba(255,255,220,0.50)',
    eyeRy:   1.0,
    browStroke: '#7A4000',
  },
  balanced: {
    body:    ['#7B8EFF', '#3B50E8', '#0A0A88'] as const,
    iris:    ['#80E0FF', '#004A70']             as const,
    arm:     ['#6070F8', '#1020B0']             as const,
    foot:    ['#4858E8', '#080878']             as const,
    ear:     ['#6070F8', '#1020B0']             as const,
    outline: '#08087A',
    gnd:     'rgba(50,70,220,0.22)',
    smile:   '#0A0A70',
    blush:   null,
    gloss:   'rgba(200,220,255,0.45)',
    eyeRy:   0.90,
    browStroke: '#050555',
  },
  hardcore: {
    body:    ['#FF7050', '#FF2800', '#700000'] as const,
    iris:    ['#FF9060', '#8A0000']             as const,
    arm:     ['#FF4030', '#800000']             as const,
    foot:    ['#DD2A18', '#5A0000']             as const,
    ear:     ['#FF4030', '#800000']             as const,
    outline: '#600000',
    gnd:     'rgba(255,40,0,0.24)',
    smile:   '#2A0000',
    blush:   null,
    gloss:   'rgba(255,200,120,0.35)',
    eyeRy:   0.88,
    browStroke: '#3A0000',
  },
} as const;

export function WelcomeMascot({ themeKey, size }: { themeKey: ThemeKey; size: number }) {
  const s   = size;
  const cx  = s * 0.5;
  const bCy = s * 0.50;
  const bRx = s * 0.30;
  const bRy = s * 0.36;

  // Eyes — larger and rounder for Duo-like feel
  const eyeY  = bCy - bRy * 0.12;
  const eyeLx = cx - s * 0.138;
  const eyeRx = cx + s * 0.138;
  const eR    = s * 0.128;    // bigger eyes
  const iR    = s * 0.082;
  const pR    = s * 0.054;

  const cfg        = CFG[themeKey];
  const isBalanced = themeKey === 'balanced';
  const isSoft     = themeKey === 'soft';
  const isHardcore = themeKey === 'hardcore';
  const p          = `wl_${themeKey}`;

  const OL_W = s * 0.030;   // outline stroke width — thick like Duo

  return (
    <Svg width={s} height={s}>
      <Defs>
        <SvgRadialGrad id={`${p}b`}  cx="30%" cy="20%" r="80%">
          <Stop offset="0%"   stopColor={cfg.body[0]} />
          <Stop offset="40%"  stopColor={cfg.body[1]} />
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

      {/* ── Ground shadow (more prominent) ─────────────────── */}
      <Ellipse
        cx={cx} cy={bCy + bRy * 1.10}
        rx={bRx * 0.92} ry={bRy * 0.14}
        fill={`url(#${p}gn)`}
      />

      {/* ── Feet (with outline) ────────────────────────────── */}
      <Ellipse cx={cx - s*0.105} cy={bCy + bRy*0.90} rx={s*0.092} ry={s*0.067}
        fill={`url(#${p}f)`} stroke={cfg.outline} strokeWidth={OL_W * 0.7} />
      <Ellipse cx={cx + s*0.105} cy={bCy + bRy*0.90} rx={s*0.092} ry={s*0.067}
        fill={`url(#${p}f)`} stroke={cfg.outline} strokeWidth={OL_W * 0.7} />

      {/* ── Ear bumps (with outline) ───────────────────────── */}
      <Circle cx={cx - bRx*0.50} cy={bCy - bRy*0.90} r={s*0.075}
        fill={`url(#${p}e)`} stroke={cfg.outline} strokeWidth={OL_W * 0.8} />
      <Circle cx={cx + bRx*0.50} cy={bCy - bRy*0.90} r={s*0.075}
        fill={`url(#${p}e)`} stroke={cfg.outline} strokeWidth={OL_W * 0.8} />
      {/* Ear inner highlight */}
      <Ellipse cx={cx - bRx*0.50} cy={bCy - bRy*0.94} rx={s*0.034} ry={s*0.030}
        fill={cfg.body[0]} opacity="0.60" />
      <Ellipse cx={cx + bRx*0.50} cy={bCy - bRy*0.94} rx={s*0.034} ry={s*0.030}
        fill={cfg.body[0]} opacity="0.60" />

      {/* ── Body (thick outline — signature Duo look) ─────── */}
      <Ellipse cx={cx} cy={bCy} rx={bRx} ry={bRy}
        fill={`url(#${p}b)`}
        stroke={cfg.outline}
        strokeWidth={OL_W}
      />
      {/* Belly highlight */}
      <Ellipse cx={cx} cy={bCy + bRy*0.30} rx={bRx*0.62} ry={bRy*0.48}
        fill={cfg.body[0]} fillOpacity={0.28} />

      {/* ── Arms (round stubs with outline) ───────────────── */}
      <Circle cx={cx - bRx*1.02} cy={bCy - bRy*0.55} r={s*0.100}
        fill={`url(#${p}a)`} stroke={cfg.outline} strokeWidth={OL_W * 0.8} />
      <Circle cx={cx + bRx*1.02} cy={bCy - bRy*0.55} r={s*0.100}
        fill={`url(#${p}a)`} stroke={cfg.outline} strokeWidth={OL_W * 0.8} />
      {/* Arm gloss */}
      <Circle cx={cx - bRx*1.06} cy={bCy - bRy*0.62} r={s*0.040} fill="rgba(255,255,255,0.32)" />
      <Circle cx={cx + bRx*0.98} cy={bCy - bRy*0.62} r={s*0.040} fill="rgba(255,255,255,0.32)" />

      {/* ── Eye whites (with thick outline) ───────────────── */}
      <Ellipse cx={eyeLx} cy={eyeY} rx={eR} ry={eR * cfg.eyeRy}
        fill="white" stroke={cfg.outline} strokeWidth={OL_W * 0.85} />
      <Ellipse cx={eyeRx} cy={eyeY} rx={eR} ry={eR * cfg.eyeRy}
        fill="white" stroke={cfg.outline} strokeWidth={OL_W * 0.85} />

      {/* Iris + pupil */}
      <Circle cx={eyeLx} cy={eyeY + eR*0.06} r={iR} fill={`url(#${p}i)`} />
      <Circle cx={eyeRx} cy={eyeY + eR*0.06} r={iR} fill={`url(#${p}i)`} />
      <Circle cx={eyeLx} cy={eyeY + eR*0.08} r={pR} fill="#050008" />
      <Circle cx={eyeRx} cy={eyeY + eR*0.08} r={pR} fill="#050008" />

      {/* Eye shine (two sizes for depth) */}
      <Circle cx={eyeLx - iR*0.30} cy={eyeY - iR*0.34} r={s*0.034} fill="white" />
      <Circle cx={eyeRx - iR*0.30} cy={eyeY - iR*0.34} r={s*0.034} fill="white" />
      <Circle cx={eyeLx + iR*0.28} cy={eyeY + iR*0.08} r={s*0.018} fill="rgba(255,255,255,0.70)" />
      <Circle cx={eyeRx + iR*0.28} cy={eyeY + iR*0.08} r={s*0.018} fill="rgba(255,255,255,0.70)" />

      {/* ── Eyebrows (theme-matched personality) ───────────── */}
      {isSoft && (
        // Happy arched brows
        <>
          <Path
            d={`M ${eyeLx - eR*0.72} ${eyeY - eR*1.00} Q ${eyeLx} ${eyeY - eR*1.30} ${eyeLx + eR*0.72} ${eyeY - eR*1.00}`}
            stroke={cfg.browStroke} strokeWidth={s*0.030} fill="none" strokeLinecap="round"
          />
          <Path
            d={`M ${eyeRx - eR*0.72} ${eyeY - eR*1.00} Q ${eyeRx} ${eyeY - eR*1.30} ${eyeRx + eR*0.72} ${eyeY - eR*1.00}`}
            stroke={cfg.browStroke} strokeWidth={s*0.030} fill="none" strokeLinecap="round"
          />
        </>
      )}
      {isBalanced && (
        // Focused straight-to-slight-arch brows
        <>
          <Path d={`M ${eyeLx - eR*0.78} ${eyeY - eR*0.90} L ${eyeLx + eR*0.62} ${eyeY - eR*0.72}`}
            stroke={cfg.browStroke} strokeWidth={s*0.032} strokeLinecap="round" />
          <Path d={`M ${eyeRx - eR*0.62} ${eyeY - eR*0.72} L ${eyeRx + eR*0.78} ${eyeY - eR*0.90}`}
            stroke={cfg.browStroke} strokeWidth={s*0.032} strokeLinecap="round" />
          {/* Glasses */}
          <Circle cx={eyeLx} cy={eyeY} r={eR*1.12} fill="none"
            stroke="#C0D0FF" strokeWidth={s*0.018} strokeOpacity="0.80" />
          <Circle cx={eyeRx} cy={eyeY} r={eR*1.12} fill="none"
            stroke="#C0D0FF" strokeWidth={s*0.018} strokeOpacity="0.80" />
          <Path
            d={`M ${eyeLx + eR*1.12} ${eyeY - eR*0.05} L ${eyeRx - eR*1.12} ${eyeY - eR*0.05}`}
            stroke="#C0D0FF" strokeWidth={s*0.014} strokeOpacity="0.72"
          />
          <Path d={`M ${eyeLx - eR*1.12} ${eyeY} L ${eyeLx - eR*1.45} ${eyeY + eR*0.26}`}
            stroke="#C0D0FF" strokeWidth={s*0.013} strokeLinecap="round" strokeOpacity="0.65" />
          <Path d={`M ${eyeRx + eR*1.12} ${eyeY} L ${eyeRx + eR*1.45} ${eyeY + eR*0.26}`}
            stroke="#C0D0FF" strokeWidth={s*0.013} strokeLinecap="round" strokeOpacity="0.65" />
        </>
      )}
      {isHardcore && (
        // Angry V-shaped brows
        <>
          <Path
            d={`M ${eyeLx - eR*0.80} ${eyeY - eR*1.10} L ${eyeLx + eR*0.65} ${eyeY - eR*0.70}`}
            stroke={cfg.browStroke} strokeWidth={s*0.040} strokeLinecap="round"
          />
          <Path
            d={`M ${eyeRx - eR*0.65} ${eyeY - eR*0.70} L ${eyeRx + eR*0.80} ${eyeY - eR*1.10}`}
            stroke={cfg.browStroke} strokeWidth={s*0.040} strokeLinecap="round"
          />
        </>
      )}

      {/* ── Smile ────────────────────────────────────────────── */}
      <Path
        d={isSoft
          // Wide happy smile
          ? `M ${cx - s*0.175} ${bCy + bRy*0.22} Q ${cx} ${bCy + bRy*0.56} ${cx + s*0.175} ${bCy + bRy*0.22}`
          : isHardcore
          // Smug/fierce smirk
          ? `M ${cx - s*0.130} ${bCy + bRy*0.24} Q ${cx + s*0.040} ${bCy + bRy*0.50} ${cx + s*0.175} ${bCy + bRy*0.22}`
          // Confident smile
          : `M ${cx - s*0.155} ${bCy + bRy*0.20} Q ${cx} ${bCy + bRy*0.48} ${cx + s*0.155} ${bCy + bRy*0.20}`
        }
        stroke={cfg.smile}
        strokeWidth={s * 0.034}
        fill="none"
        strokeLinecap="round"
      />

      {/* Soft: blush cheeks */}
      {isSoft && (
        <>
          <Ellipse cx={eyeLx - eR*0.55} cy={bCy + bRy*0.08} rx={eR*0.88} ry={eR*0.52}
            fill={cfg.blush!} fillOpacity={0.55} />
          <Ellipse cx={eyeRx + eR*0.55} cy={bCy + bRy*0.08} rx={eR*0.88} ry={eR*0.52}
            fill={cfg.blush!} fillOpacity={0.55} />
        </>
      )}

      {/* Body gloss */}
      <Ellipse
        cx={cx - bRx*0.18} cy={bCy - bRy*0.58}
        rx={bRx*0.50} ry={bRy*0.15}
        fill={cfg.gloss}
        transform={`rotate(-16 ${cx - bRx*0.18} ${bCy - bRy*0.58})`}
      />
      <Ellipse
        cx={cx - bRx*0.60} cy={bCy - bRy*0.20}
        rx={bRx*0.16} ry={bRy*0.34}
        fill={cfg.gloss}
        transform={`rotate(-10 ${cx - bRx*0.60} ${bCy - bRy*0.20})`}
      />
    </Svg>
  );
}
