import type { ReactNode } from 'react'
import { ToyArt, type ToyKind } from '@zoytoy/ui/ToyArt'

/**
 * Six toys of one kind for each category box — they burst out of the open box like a bouquet on hover
 * (components/home/CategoryBoxes.tsx). Same drawing language as ToyArt: 120×120, thick dark outline,
 * the shop palette, a white glint here and there.
 */
export type Theme = 'soft' | 'build' | 'vehicles' | 'figures' | 'games' | 'learn' | 'baby' | 'outdoor'

const E = 'var(--zt-edge)'
const INK = '#1F1A3D'
const SUN = 'var(--zt-sun)'
const PINK = 'var(--zt-bubble)'
const SKY = 'var(--zt-sky)'
const MINT = 'var(--zt-mint)'
const ORANGE = 'var(--zt-tangerine)'
const GRAPE = 'var(--zt-grape)'
const FUR = '#C98A5A'
const FUR_LIGHT = '#F2C9A0'

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 120 120" aria-hidden="true">
    <g stroke={E} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">{children}</g>
  </svg>
)
const Eyes = ({ y = 60, dx = 9, cx = 60 }: { y?: number; dx?: number; cx?: number }) => (
  <>
    <circle cx={cx - dx} cy={y} r="4" fill={INK} stroke="none" />
    <circle cx={cx + dx} cy={y} r="4" fill={INK} stroke="none" />
    <circle cx={cx - dx + 1.5} cy={y - 1.5} r="1.3" fill="#fff" stroke="none" />
    <circle cx={cx + dx + 1.5} cy={y - 1.5} r="1.3" fill="#fff" stroke="none" />
  </>
)
const Smile = ({ y = 70, w = 7, cx = 60 }: { y?: number; w?: number; cx?: number }) => <path d={`M${cx - w} ${y} Q${cx} ${y + 6} ${cx + w} ${y}`} fill="none" strokeWidth={3.5} />
const Cheeks = ({ y = 68, dx = 17, cx = 60 }: { y?: number; dx?: number; cx?: number }) => (
  <>
    <circle cx={cx - dx} cy={y} r="5" fill={PINK} opacity=".45" stroke="none" />
    <circle cx={cx + dx} cy={y} r="5" fill={PINK} opacity=".45" stroke="none" />
  </>
)
const Wheel = ({ x, y, r = 9 }: { x: number; y: number; r?: number }) => (
  <>
    <circle cx={x} cy={y} r={r} fill={INK} />
    <circle cx={x} cy={y} r={r / 2.6} fill="#fff" stroke="none" />
  </>
)
const toy = (kind: ToyKind) => function Existing() { return <ToyArt kind={kind} /> }

// ---------- soft toys ----------
const Bunny = () => (
  <Svg>
    <ellipse cx="45" cy="30" rx="10" ry="24" fill="#fff" />
    <ellipse cx="75" cy="30" rx="10" ry="24" fill="#fff" />
    <ellipse cx="45" cy="32" rx="4" ry="14" fill={PINK} stroke="none" />
    <ellipse cx="75" cy="32" rx="4" ry="14" fill={PINK} stroke="none" />
    <ellipse cx="60" cy="94" rx="26" ry="20" fill="#fff" />
    <circle cx="60" cy="64" r="25" fill="#fff" />
    <Eyes y={62} />
    <path d="M56 70h8l-4 5z" fill={PINK} strokeWidth={2.5} />
    <Cheeks y={72} />
  </Svg>
)
const Kitty = () => (
  <Svg>
    <path d="M30 52 L34 18 L56 38Z" fill={ORANGE} />
    <path d="M90 52 L86 18 L64 38Z" fill={ORANGE} />
    <ellipse cx="60" cy="98" rx="24" ry="16" fill={ORANGE} />
    <circle cx="60" cy="62" r="30" fill={ORANGE} />
    <path d="M45 40 Q60 34 75 40" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth={4} />
    <Eyes y={60} dx={11} />
    <path d="M57 68h6l-3 4z" fill={PINK} strokeWidth={2.5} />
    <path d="M30 66h14M30 74l14-3M90 66H76M90 74l-14-3" fill="none" strokeWidth={2.5} />
  </Svg>
)
const Elephant = () => (
  <Svg>
    <ellipse cx="28" cy="56" rx="20" ry="24" fill={SKY} />
    <ellipse cx="92" cy="56" rx="20" ry="24" fill={SKY} />
    <ellipse cx="28" cy="56" rx="10" ry="14" fill={PINK} opacity=".55" stroke="none" />
    <ellipse cx="92" cy="56" rx="10" ry="14" fill={PINK} opacity=".55" stroke="none" />
    <circle cx="60" cy="56" r="28" fill={SKY} />
    <path d="M54 70 C52 92 58 104 72 100" fill="none" stroke={E} strokeWidth={14} />
    <path d="M54 70 C52 92 58 104 72 100" fill="none" stroke={SKY} strokeWidth={6} />
    <Eyes y={52} dx={11} />
  </Svg>
)
const Octopus = () => (
  <Svg>
    <path d="M28 70 Q22 100 34 104 M44 76 Q40 104 52 106 M68 76 Q72 104 84 104 M84 70 Q98 96 92 104" fill="none" stroke={E} strokeWidth={13} />
    <path d="M28 70 Q22 100 34 104 M44 76 Q40 104 52 106 M68 76 Q72 104 84 104 M84 70 Q98 96 92 104" fill="none" stroke={GRAPE} strokeWidth={5} />
    <path d="M24 72 C20 30 100 30 96 72 C96 82 24 82 24 72Z" fill={GRAPE} />
    <circle cx="44" cy="42" r="6" fill="#fff" opacity=".35" stroke="none" />
    <Eyes y={58} dx={12} />
    <Smile y={66} w={6} />
  </Svg>
)
const HeartPillow = () => (
  <Svg>
    <path d="M60 104 C24 82 10 58 22 38 C32 22 52 24 60 40 C68 24 88 22 98 38 C110 58 96 82 60 104Z" fill={PINK} />
    <path d="M30 44 Q36 34 46 36" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth={4} />
    <Eyes y={58} dx={11} />
    <Smile y={68} w={6} />
  </Svg>
)

// ---------- building ----------
const studs = (x: number, y: number, n: number, color: string) =>
  Array.from({ length: n }, (_, i) => <rect key={i} x={x + i * 22} y={y} width="14" height="9" rx="3" fill={color} />)
const Brick2 = () => (
  <Svg>
    {studs(36, 34, 3, PINK)}
    <rect x="26" y="42" width="68" height="44" rx="6" fill={PINK} />
    <path d="M34 52v26" stroke="#fff" strokeOpacity=".55" strokeWidth={4} />
  </Svg>
)
const Brick4 = () => (
  <Svg>
    {studs(16, 46, 4, SKY)}
    <rect x="8" y="54" width="104" height="34" rx="6" fill={SKY} />
    <path d="M16 62v18" stroke="#fff" strokeOpacity=".55" strokeWidth={4} />
  </Svg>
)
const Tower = () => (
  <Svg>
    <rect x="34" y="78" width="52" height="26" rx="5" fill={MINT} />
    <rect x="38" y="52" width="44" height="26" rx="5" fill={SUN} />
    <rect x="42" y="26" width="36" height="26" rx="5" fill={PINK} />
    {studs(46, 18, 2, PINK)}
  </Svg>
)
const Arch = () => (
  <Svg>
    <path d="M14 98 V44 H106 V98 H82 V78 A22 22 0 0 0 38 78 V98Z" fill={ORANGE} />
    <path d="M22 54h20" stroke="#fff" strokeOpacity=".6" strokeWidth={4} />
  </Svg>
)
const Roof = () => (
  <Svg>
    <rect x="30" y="64" width="60" height="38" rx="4" fill={SUN} />
    <path d="M22 66 L60 26 L98 66Z" fill={GRAPE} />
    <rect x="52" y="78" width="16" height="24" rx="3" fill={ORANGE} />
  </Svg>
)

// ---------- vehicles ----------
const Plane = () => (
  <Svg>
    <path d="M50 58 L26 30 L40 30 L70 58Z" fill={SKY} />
    <path d="M50 66 L32 94 L46 94 L70 66Z" fill={SKY} />
    <path d="M14 62 C14 52 30 50 40 52 L96 54 C108 54 112 60 112 62 C112 64 108 70 96 70 L40 72 C30 74 14 72 14 62Z" fill="#fff" />
    <path d="M18 54 L12 38 L24 40 L32 52Z" fill={PINK} />
    <circle cx="58" cy="62" r="3.5" fill={SKY} strokeWidth={2.5} />
    <circle cx="72" cy="62" r="3.5" fill={SKY} strokeWidth={2.5} />
    <circle cx="86" cy="62" r="3.5" fill={SKY} strokeWidth={2.5} />
  </Svg>
)
const Boat = () => (
  <Svg>
    <path d="M58 16 V80" fill="none" />
    <path d="M62 20 L96 72 H62Z" fill="#fff" />
    <path d="M54 30 L28 72 H54Z" fill={PINK} />
    <path d="M14 80 H106 L92 102 H28Z" fill={ORANGE} />
    <path d="M40 90h40" stroke="#fff" strokeOpacity=".6" strokeWidth={4} />
  </Svg>
)
const Bus = () => (
  <Svg>
    <rect x="12" y="32" width="96" height="58" rx="12" fill={SUN} />
    <rect x="22" y="42" width="18" height="18" rx="3" fill={SKY} strokeWidth={3.5} />
    <rect x="46" y="42" width="18" height="18" rx="3" fill={SKY} strokeWidth={3.5} />
    <rect x="70" y="42" width="18" height="18" rx="3" fill={SKY} strokeWidth={3.5} />
    <path d="M12 70 H108" fill="none" strokeWidth={4} />
    <Wheel x={34} y={92} />
    <Wheel x={86} y={92} />
  </Svg>
)
const Copter = () => (
  <Svg>
    <path d="M20 26 H100 M60 26 V40" fill="none" />
    <path d="M82 66 H110 L114 54" fill="none" strokeWidth={6} />
    <ellipse cx="56" cy="66" rx="34" ry="26" fill={MINT} />
    <path d="M56 46 C72 46 82 56 82 66 H56Z" fill={SKY} strokeWidth={4} />
    <path d="M36 96 H80 M44 92 V96 M72 92 V96" fill="none" />
  </Svg>
)

// ---------- dolls and figures ----------
const Doll = () => (
  <Svg>
    <circle cx="30" cy="46" r="10" fill={ORANGE} />
    <circle cx="90" cy="46" r="10" fill={ORANGE} />
    <path d="M60 64 L32 108 H88Z" fill={PINK} />
    <circle cx="60" cy="44" r="24" fill={FUR_LIGHT} />
    <path d="M36 42 C36 20 84 20 84 42 C74 34 60 30 46 38Z" fill={ORANGE} />
    <Eyes y={48} dx={9} />
    <Smile y={56} w={6} />
    <Cheeks y={55} dx={15} />
  </Svg>
)
const Robot = () => (
  <Svg>
    <path d="M60 22 V10" fill="none" />
    <circle cx="60" cy="9" r="5" fill={PINK} />
    <rect x="30" y="22" width="60" height="44" rx="10" fill={SKY} />
    <rect x="40" y="34" width="40" height="20" rx="6" fill="#fff" strokeWidth={3.5} />
    <circle cx="51" cy="44" r="4" fill={INK} stroke="none" />
    <circle cx="69" cy="44" r="4" fill={INK} stroke="none" />
    <rect x="38" y="72" width="44" height="34" rx="8" fill={GRAPE} />
    <circle cx="60" cy="88" r="6" fill={SUN} strokeWidth={3} />
  </Svg>
)
const Dino = () => (
  <Svg>
    <path d="M42 48 l6-12 6 12 M56 44 l6-12 6 12 M70 46 l6-11 5 12" fill={ORANGE} />
    <path d="M12 86 C30 84 34 52 60 50 C82 48 88 60 92 44 C96 32 112 34 110 48 C108 62 98 66 96 80 C94 96 80 102 60 100 C44 98 30 96 12 86Z" fill={MINT} />
    <circle cx="101" cy="44" r="3.5" fill={INK} stroke="none" />
    <path d="M50 98 V108 M76 98 V108" fill="none" strokeWidth={7} />
  </Svg>
)
const Unicorn = () => (
  <Svg>
    <path d="M56 26 L64 4 L70 28Z" fill={SUN} />
    <path d="M36 30 C24 46 26 70 34 84 C40 70 42 52 50 38Z" fill={GRAPE} />
    <path d="M40 34 C64 18 92 34 94 62 C96 82 84 96 70 96 C58 96 56 84 58 74 C46 74 38 60 40 34Z" fill="#fff" />
    <path d="M40 26 C30 30 24 40 26 50" fill="none" stroke={PINK} strokeWidth={6} />
    <circle cx="72" cy="58" r="4" fill={INK} stroke="none" />
    <circle cx="80" cy="84" r="2.5" fill={INK} stroke="none" />
  </Svg>
)
const Hero = () => (
  <Svg>
    <path d="M38 50 L18 106 H102 L82 50Z" fill={PINK} />
    <rect x="40" y="56" width="40" height="48" rx="10" fill={SKY} />
    <path d="M52 72 l8 10 8-10" fill="none" stroke={SUN} strokeWidth={5} />
    <circle cx="60" cy="34" r="20" fill={FUR_LIGHT} />
    <path d="M40 30 H80 V38 C72 42 48 42 40 38Z" fill={GRAPE} />
    <circle cx="51" cy="35" r="3" fill="#fff" stroke="none" />
    <circle cx="69" cy="35" r="3" fill="#fff" stroke="none" />
  </Svg>
)
const Matryoshka = () => (
  <Svg>
    <path d="M60 10 C40 10 34 30 38 46 C24 60 26 104 44 108 H76 C94 104 96 60 82 46 C86 30 80 10 60 10Z" fill={PINK} />
    <circle cx="60" cy="38" r="18" fill={FUR_LIGHT} strokeWidth={4} />
    <path d="M42 34 C46 22 74 22 78 34 C70 28 50 28 42 34Z" fill={ORANGE} strokeWidth={3} />
    <Eyes y={40} dx={7} cx={60} />
    <Cheeks y={47} dx={11} />
    <ellipse cx="60" cy="82" rx="16" ry="14" fill="#fff" strokeWidth={4} />
    <circle cx="60" cy="82" r="6" fill={SUN} strokeWidth={3} />
  </Svg>
)

// ---------- board games & puzzles ----------
const Dice = () => (
  <Svg>
    <g transform="rotate(-10 60 60)">
      <rect x="24" y="24" width="72" height="72" rx="16" fill="#fff" />
      {[[42, 42], [60, 60], [78, 78], [78, 42], [42, 78]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill={PINK} stroke="none" />)}
    </g>
  </Svg>
)
const Knight = () => (
  <Svg>
    <path d="M34 104 H90 V92 H34Z" fill={GRAPE} />
    <path d="M40 92 C40 74 52 66 50 56 L34 60 C28 54 30 44 40 36 C50 24 62 16 76 20 C92 26 92 58 82 92Z" fill={GRAPE} />
    <circle cx="58" cy="36" r="4" fill="#fff" stroke="none" />
    <path d="M66 24 l6-10 4 12" fill={GRAPE} strokeWidth={4} />
  </Svg>
)
const Cards = () => (
  <Svg>
    <rect x="20" y="30" width="44" height="62" rx="7" fill="#fff" transform="rotate(-18 42 61)" />
    <rect x="56" y="30" width="44" height="62" rx="7" fill="#fff" transform="rotate(16 78 61)" />
    <rect x="38" y="26" width="44" height="62" rx="7" fill="#fff" />
    <path d="M60 46 C52 38 44 48 52 56 L60 64 L68 56 C76 48 68 38 60 46Z" fill={PINK} strokeWidth={3} />
  </Svg>
)
const Pawn = () => (
  <Svg>
    <path d="M36 104 H84 C84 92 76 86 70 82 L66 58 H54 L50 82 C44 86 36 92 36 104Z" fill={SUN} />
    <circle cx="60" cy="40" r="18" fill={SUN} />
    <circle cx="54" cy="34" r="5" fill="#fff" opacity=".7" stroke="none" />
    <rect x="46" y="56" width="28" height="8" rx="4" fill={SUN} />
  </Svg>
)
const Cube = () => {
  const colors = [PINK, SUN, MINT, SKY, ORANGE, GRAPE, MINT, PINK, SUN]
  return (
    <Svg>
      <rect x="20" y="20" width="80" height="80" rx="12" fill={INK} />
      {colors.map((c, i) => <rect key={i} x={26 + (i % 3) * 24} y={26 + Math.floor(i / 3) * 24} width="20" height="20" rx="4" fill={c} strokeWidth={2.5} />)}
    </Svg>
  )
}

// ---------- learning ----------
const Abacus = () => (
  <Svg>
    <rect x="16" y="18" width="88" height="84" rx="8" fill="none" stroke={ORANGE} strokeWidth={10} />
    <rect x="16" y="18" width="88" height="84" rx="8" fill="none" />
    {[40, 60, 80].map((y, row) => (
      <g key={y}>
        <path d={`M22 ${y} H98`} fill="none" strokeWidth={3} />
        {[0, 1, 2].map((i) => <circle key={i} cx={34 + i * 16 + row * 8} cy={y} r="7" fill={[PINK, SKY, MINT][row]} strokeWidth={3} />)}
      </g>
    ))}
  </Svg>
)
const Book = () => (
  <Svg>
    <path d="M60 34 C46 24 26 24 12 30 V96 C26 90 46 90 60 100Z" fill="#fff" />
    <path d="M60 34 C74 24 94 24 108 30 V96 C94 90 74 90 60 100Z" fill="#fff" />
    <path d="M60 34 V100" fill="none" />
    <text x="36" y="72" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="22" fill={PINK} stroke="none">A</text>
    <text x="84" y="72" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="22" fill={SKY} stroke="none">B</text>
  </Svg>
)
const Globe = () => (
  <Svg>
    <path d="M36 102 H84 M60 88 V102" fill="none" />
    <path d="M24 52 A36 36 0 0 0 84 80" fill="none" stroke={ORANGE} strokeWidth={6} />
    <circle cx="60" cy="50" r="32" fill={SKY} />
    <path d="M44 32 C52 36 50 46 58 48 C66 50 64 60 56 64 C50 66 46 58 40 60 M70 26 C76 32 84 34 88 44 M74 64 C80 62 84 68 82 74" fill={MINT} strokeWidth={4} />
  </Svg>
)
const Crayons = () => (
  <Svg>
    {[[PINK, -14], [SUN, 0], [SKY, 14]].map(([c, a], i) => (
      <g key={i} transform={`rotate(${a} 60 100)`}>
        <rect x="50" y="34" width="20" height="66" rx="3" fill={c as string} />
        <path d="M50 34 L60 12 L70 34Z" fill={c as string} />
        <path d="M50 80 H70" fill="none" strokeWidth={3} />
      </g>
    ))}
  </Svg>
)
const Sorter = () => (
  <Svg>
    <rect x="14" y="40" width="92" height="62" rx="10" fill={MINT} />
    <path d="M14 40 L30 22 H90 L106 40Z" fill={SUN} />
    <circle cx="38" cy="70" r="10" fill={INK} stroke="none" />
    <rect x="54" y="60" width="18" height="18" rx="2" fill={INK} stroke="none" />
    <path d="M86 58 L96 78 H76Z" fill={INK} stroke="none" />
  </Svg>
)
const Magnifier = () => (
  <Svg>
    <path d="M74 74 L104 104" fill="none" stroke={E} strokeWidth={16} />
    <path d="M74 74 L104 104" fill="none" stroke={ORANGE} strokeWidth={8} />
    <circle cx="50" cy="50" r="32" fill={SKY} fillOpacity=".55" />
    <circle cx="50" cy="50" r="32" fill="none" stroke={GRAPE} strokeWidth={7} />
    <path d="M34 40 Q40 30 52 30" fill="none" stroke="#fff" strokeWidth={5} />
  </Svg>
)

// ---------- baby ----------
const Rattle = () => (
  <Svg>
    <path d="M60 64 V104" fill="none" stroke={E} strokeWidth={14} />
    <path d="M60 64 V104" fill="none" stroke={PINK} strokeWidth={6} />
    <circle cx="60" cy="40" r="28" fill={SUN} />
    <path d="M36 32 Q60 44 84 32" fill="none" stroke={PINK} strokeWidth={5} />
    <circle cx="48" cy="50" r="4" fill="#fff" stroke="none" />
    <circle cx="68" cy="52" r="4" fill="#fff" stroke="none" />
    <circle cx="60" cy="108" r="7" fill={PINK} />
  </Svg>
)
const Pacifier = () => (
  <Svg>
    <circle cx="60" cy="30" r="16" fill="none" stroke={E} strokeWidth={13} />
    <circle cx="60" cy="30" r="16" fill="none" stroke={MINT} strokeWidth={5} />
    <path d="M24 60 C24 46 96 46 96 60 C96 74 72 76 60 76 C48 76 24 74 24 60Z" fill={PINK} />
    <circle cx="60" cy="60" r="8" fill="#fff" strokeWidth={3.5} />
    <path d="M50 78 C48 100 72 100 70 78Z" fill={FUR_LIGHT} />
  </Svg>
)
const Bottle = () => (
  <Svg>
    <path d="M52 10 C52 4 68 4 68 10 V22 H52Z" fill={FUR_LIGHT} />
    <rect x="44" y="22" width="32" height="12" rx="4" fill={SKY} />
    <rect x="38" y="34" width="44" height="72" rx="14" fill="#fff" />
    <path d="M38 70 H82 V92 C82 100 76 106 68 106 H52 C44 106 38 100 38 92Z" fill={SKY} fillOpacity=".45" stroke="none" />
    <path d="M70 48h8M70 60h8M70 72h8" fill="none" strokeWidth={3} />
  </Svg>
)
const Rings = () => (
  <Svg>
    <path d="M60 16 V100" fill="none" strokeWidth={8} />
    <rect x="22" y="94" width="76" height="12" rx="6" fill={ORANGE} />
    {[[82, 40, PINK], [70, 34, SUN], [58, 28, MINT], [46, 20, SKY]].map(([y, rx, c]) => (
      <ellipse key={String(y)} cx="60" cy={y as number} rx={rx as number} ry="9" fill={c as string} />
    ))}
    <circle cx="60" cy="24" r="9" fill={GRAPE} />
  </Svg>
)
const SleepyStar = () => (
  <Svg>
    <path d="M60 10 L74 42 L108 44 L82 66 L90 100 L60 82 L30 100 L38 66 L12 44 L46 42Z" fill={SUN} />
    <path d="M48 58 q4 4 8 0 M64 58 q4 4 8 0" fill="none" strokeWidth={3.5} />
    <Smile y={68} w={5} />
    <Cheeks y={66} dx={16} />
  </Svg>
)

// ---------- outdoor ----------
const Kite = () => (
  <Svg>
    <path d="M60 106 C66 98 54 94 62 86 C70 78 58 74 64 66" fill="none" strokeWidth={3} />
    <path d="M58 92 l-8-4 2 8z M62 80 l8-4 -2 8z" fill={SUN} strokeWidth={3} />
    <path d="M60 8 L94 40 L60 68 L26 40Z" fill={PINK} />
    <path d="M60 8 V68 M26 40 H94" fill="none" strokeWidth={3.5} />
    <path d="M60 8 L94 40 H60Z" fill={SKY} />
  </Svg>
)
const Bucket = () => (
  <Svg>
    <path d="M30 40 C30 10 90 10 90 40" fill="none" strokeWidth={5} />
    <path d="M24 40 H96 L86 102 H34Z" fill={SKY} />
    <rect x="20" y="34" width="80" height="12" rx="6" fill={SKY} />
    <path d="M44 62 C52 56 68 56 76 62" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth={5} />
  </Svg>
)
const Spade = () => (
  <Svg>
    <path d="M60 10 V70" fill="none" stroke={E} strokeWidth={13} />
    <path d="M60 10 V70" fill="none" stroke={ORANGE} strokeWidth={5} />
    <rect x="46" y="6" width="28" height="12" rx="6" fill={ORANGE} />
    <path d="M38 66 H82 V86 C82 100 72 110 60 110 C48 110 38 100 38 86Z" fill={MINT} />
  </Svg>
)
const Frisbee = () => (
  <Svg>
    <ellipse cx="60" cy="66" rx="48" ry="20" fill={MINT} />
    <ellipse cx="60" cy="60" rx="48" ry="20" fill={MINT} />
    <ellipse cx="60" cy="58" rx="26" ry="9" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth={4} />
  </Svg>
)
const Scooter = () => (
  <Svg>
    <path d="M86 20 L92 82" fill="none" stroke={E} strokeWidth={12} />
    <path d="M86 20 L92 82" fill="none" stroke={GRAPE} strokeWidth={5} />
    <path d="M74 20 H98" fill="none" strokeWidth={8} />
    <rect x="22" y="78" width="72" height="10" rx="5" fill={GRAPE} />
    <Wheel x={30} y={96} r={10} />
    <Wheel x={92} y={96} r={10} />
  </Svg>
)

export const BOUQUETS: Record<Theme, (() => React.JSX.Element)[]> = {
  soft: [Bunny, Kitty, toy('teddy'), HeartPillow, Elephant, Octopus],
  build: [Brick2, Tower, toy('blocks'), Arch, Brick4, Roof],
  vehicles: [Bus, Plane, toy('car'), Boat, toy('train'), Copter],
  figures: [Dino, Doll, Robot, Unicorn, Hero, Matryoshka],
  games: [Pawn, Cards, toy('puzzle'), Dice, Knight, Cube],
  learn: [Crayons, Book, Abacus, Globe, Magnifier, Sorter],
  baby: [Rings, Rattle, toy('duck'), Bottle, Pacifier, SleepyStar],
  outdoor: [Frisbee, Kite, toy('ball'), Bucket, Spade, Scooter],
}

const BY_SLUG: [RegExp, Theme][] = [
  [/soft|plush|teddy|rbil/i, 'soft'],
  [/build|lego|constr|block/i, 'build'],
  [/vehicle|car|transport|train/i, 'vehicles'],
  [/figur|doll|action/i, 'figures'],
  [/board|game|puzzle/i, 'games'],
  [/edu|learn|school|science/i, 'learn'],
  [/baby|infant|toddler/i, 'baby'],
  [/outdoor|sport|garden|beach/i, 'outdoor'],
]
const BY_ICON: Record<ToyKind, Theme> = { teddy: 'soft', blocks: 'build', car: 'vehicles', train: 'vehicles', rocket: 'figures', puzzle: 'games', duck: 'baby', ball: 'outdoor' }

/** Which bouquet a category gets: from its address (seeded shelves), else from its icon. */
export const themeFor = (slug: string, icon: ToyKind): Theme => BY_SLUG.find(([re]) => re.test(slug))?.[1] ?? BY_ICON[icon]
