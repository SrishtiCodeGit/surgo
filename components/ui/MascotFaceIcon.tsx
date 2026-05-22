import { ThemeKey } from '@/types';
import Svg, {
  Circle, Ellipse, Path, Defs, G,
  ClipPath as SvgClipPath,
  RadialGradient as SvgRadialGrad,
  Stop,
} from 'react-native-svg';

// ─── Per-theme colour config ───────────────────────────────────────────────────

const CFG = {
  soft: {
    body:  ['#FFF5A0', '#F5C030', '#C07800'] as const,
    iris:  ['#FFD080', '#5A2800']             as const,
    ear:   ['#FFE870', '#C07800']             as const,
    brow:  null,           // soft has no brows
    smile: '#8A5000',
    blush: '#FFAA30',
    gloss: 'rgba(255,255,200,0.40)',
    eyeRy: 1.0,            // full round eyes
  },
  balanced: {
    body:  ['#A0B0FF', '#4050D8', '#0A0A70'] as const,
    iris:  ['#80E0FF', '#004A70']             as const,
    ear:   ['#7080F8', '#1020A0']             as const,
    brow:  '#0A0A60',
    smile: '#1A1A80',
    blush: null,
    glass: '#C0D0FF',
    gloss: 'rgba(200,220,255,0.38)',
    eyeRy: 0.88,           // slightly focused
  },
  hardcore: {
    body:  ['#FF8060', '#FF2800', '#6A0000'] as const,
    iris:  ['#FF9060', '#8A0000']             as const,
    ear:   ['#FF5040', '#7A0000']             as const,
    brow:  '#2A0000',
    smile: '#2A0000',      // frown
    blush: '#FF4400',
    gloss: 'rgba(255,200,120,0.28)',
    eyeRy: 0.70,           // squinted
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function MascotFaceIcon({ variant, size }: { variant: ThemeKey; size: number }) {
  const s  = size;
  const cx = s * 0.5;

  // Body positioned lower → bottom clipped by circle → "peeking" effect
  const bCy = s * 0.62;
  const bR  = s * 0.50;

  const eyeY  = bCy - bR * 0.16;
  const eyeLx = cx - s * 0.140;
  const eyeRx = cx + s * 0.140;
  const eR    = s * 0.118;
  const iR    = s * 0.077;
  const pR    = s * 0.052;

  const cfg = CFG[variant];

  // Unique IDs per variant (each variant appears at most once on screen)
  const clipId  = `fi_clip_${variant}`;
  const bodyId  = `fi_body_${variant}`;
  const irisId  = `fi_iris_${variant}`;
  const earId   = `fi_ear_${variant}`;

  const isHardcore = variant === 'hardcore';
  const isBalanced = variant === 'balanced';
  const isSoft     = variant === 'soft';

  return (
    <Svg width={s} height={s}>
      <Defs>
        {/* Circle clip */}
        <SvgClipPath id={clipId}>
          <Circle cx={s * 0.5} cy={s * 0.5} r={s * 0.5} />
        </SvgClipPath>

        {/* Body gradient */}
        <SvgRadialGrad id={bodyId} cx="30%" cy="22%" r="78%">
          <Stop offset="0%"   stopColor={cfg.body[0]} />
          <Stop offset="35%"  stopColor={cfg.body[1]} />
          <Stop offset="100%" stopColor={cfg.body[2]} />
        </SvgRadialGrad>

        {/* Iris gradient */}
        <SvgRadialGrad id={irisId} cx="28%" cy="24%" r="72%">
          <Stop offset="0%"   stopColor={cfg.iris[0]} />
          <Stop offset="100%" stopColor={cfg.iris[1]} />
        </SvgRadialGrad>

        {/* Ear gradient */}
        <SvgRadialGrad id={earId} cx="30%" cy="25%" r="70%">
          <Stop offset="0%"   stopColor={cfg.ear[0]} />
          <Stop offset="100%" stopColor={cfg.ear[1]} />
        </SvgRadialGrad>
      </Defs>

      {/* Everything clipped to a circle */}
      <G clipPath={`url(#${clipId})`}>

        {/* Ear bumps — peek above body */}
        <Circle cx={cx - bR * 0.32} cy={bCy - bR * 0.88} r={s * 0.072} fill={`url(#${earId})`} />
        <Circle cx={cx + bR * 0.32} cy={bCy - bR * 0.88} r={s * 0.072} fill={`url(#${earId})`} />
        {/* Ear inner highlight */}
        <Ellipse cx={cx - bR*0.32} cy={bCy - bR*0.91} rx={s*0.032} ry={s*0.025}
          fill={cfg.body[0]} opacity="0.60" />
        <Ellipse cx={cx + bR*0.32} cy={bCy - bR*0.91} rx={s*0.032} ry={s*0.025}
          fill={cfg.body[0]} opacity="0.60" />

        {/* Body — positioned low so bottom peeks out of circle clip */}
        <Circle cx={cx} cy={bCy} r={bR} fill={`url(#${bodyId})`} />

        {/* Belly patch */}
        <Ellipse cx={cx} cy={bCy + bR*0.26} rx={bR*0.66} ry={bR*0.50}
          fill={cfg.body[0]} fillOpacity={isSoft ? 0.28 : isHardcore ? 0.20 : 0.30} />

        {/* ── Eyes ── */}
        <Ellipse cx={eyeLx} cy={eyeY} rx={eR} ry={eR * cfg.eyeRy} fill="white" />
        <Ellipse cx={eyeRx} cy={eyeY} rx={eR} ry={eR * cfg.eyeRy} fill="white" />
        <Circle  cx={eyeLx} cy={eyeY + eR*0.06} r={iR} fill={`url(#${irisId})`} />
        <Circle  cx={eyeRx} cy={eyeY + eR*0.06} r={iR} fill={`url(#${irisId})`} />
        <Circle  cx={eyeLx} cy={eyeY + eR*0.08} r={pR} fill="#050008" />
        <Circle  cx={eyeRx} cy={eyeY + eR*0.08} r={pR} fill="#050008" />
        {/* Eye shine */}
        <Circle cx={eyeLx - iR*0.32} cy={eyeY - iR*0.36} r={s*0.028} fill="white" />
        <Circle cx={eyeRx - iR*0.32} cy={eyeY - iR*0.36} r={s*0.028} fill="white" />
        <Circle cx={eyeLx + iR*0.28} cy={eyeY + iR*0.06} r={s*0.014} fill="rgba(255,255,255,0.65)" />
        <Circle cx={eyeRx + iR*0.28} cy={eyeY + iR*0.06} r={s*0.014} fill="rgba(255,255,255,0.65)" />

        {/* ── Balanced: glasses ── */}
        {isBalanced && (
          <>
            <Circle cx={eyeLx} cy={eyeY} r={eR*1.12} fill="none"
              stroke="#C0D0FF" strokeWidth={s*0.020} strokeOpacity="0.88" />
            <Circle cx={eyeRx} cy={eyeY} r={eR*1.12} fill="none"
              stroke="#C0D0FF" strokeWidth={s*0.020} strokeOpacity="0.88" />
            <Path
              d={`M ${eyeLx + eR*1.12} ${eyeY - eR*0.05} L ${eyeRx - eR*1.12} ${eyeY - eR*0.05}`}
              stroke="#C0D0FF" strokeWidth={s*0.013} strokeOpacity="0.80"
            />
          </>
        )}

        {/* ── Eyebrows (balanced & hardcore) ── */}
        {isHardcore && (
          <>
            <Path
              d={`M ${eyeLx - eR*0.80} ${eyeY - eR*0.80} L ${eyeLx + eR*0.55} ${eyeY - eR*0.54}`}
              stroke={cfg.brow!} strokeWidth={s*0.042} strokeLinecap="round"
            />
            <Path
              d={`M ${eyeRx - eR*0.55} ${eyeY - eR*0.54} L ${eyeRx + eR*0.80} ${eyeY - eR*0.80}`}
              stroke={cfg.brow!} strokeWidth={s*0.042} strokeLinecap="round"
            />
          </>
        )}
        {isBalanced && (
          <>
            <Path
              d={`M ${eyeLx - eR*0.70} ${eyeY - eR*0.90} L ${eyeLx + eR*0.55} ${eyeY - eR*0.72}`}
              stroke={cfg.brow!} strokeWidth={s*0.030} strokeLinecap="round"
            />
            <Path
              d={`M ${eyeRx - eR*0.55} ${eyeY - eR*0.72} L ${eyeRx + eR*0.70} ${eyeY - eR*0.90}`}
              stroke={cfg.brow!} strokeWidth={s*0.030} strokeLinecap="round"
            />
          </>
        )}

        {/* ── Mouth ── */}
        {isHardcore ? (
          // Frown
          <Path
            d={`M ${cx - s*0.128} ${bCy + bR*0.22} Q ${cx} ${bCy + bR*0.12} ${cx + s*0.128} ${bCy + bR*0.22}`}
            stroke={cfg.smile} strokeWidth={s*0.024} fill="none" strokeLinecap="round"
          />
        ) : (
          // Smile
          <Path
            d={`M ${cx - s*0.120} ${bCy + bR*0.22} Q ${cx} ${bCy + bR*0.36} ${cx + s*0.120} ${bCy + bR*0.22}`}
            stroke={cfg.smile} strokeWidth={s*0.022} fill="none" strokeLinecap="round"
          />
        )}

        {/* ── Soft: blush cheeks ── */}
        {isSoft && (
          <>
            <Ellipse cx={eyeLx - eR*0.60} cy={bCy + bR*0.06} rx={eR*0.78} ry={eR*0.48}
              fill={cfg.blush!} fillOpacity={0.45} />
            <Ellipse cx={eyeRx + eR*0.60} cy={bCy + bR*0.06} rx={eR*0.78} ry={eR*0.48}
              fill={cfg.blush!} fillOpacity={0.45} />
          </>
        )}

        {/* ── Body top gloss ── */}
        <Ellipse
          cx={cx - bR*0.16}
          cy={bCy - bR*0.60}
          rx={bR*0.50}
          ry={bR*0.16}
          fill={cfg.gloss}
          transform={`rotate(-16 ${cx - bR*0.16} ${bCy - bR*0.60})`}
        />
      </G>
    </Svg>
  );
}
