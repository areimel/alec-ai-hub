import { sample } from "./seed";

export interface Colors {
  background: string;
  ink: string;
  accent: string;
}

export interface FieldProps {
  colors: Colors;
  seed: number;
  density: number;
  /** Prefix for SVG ids (patterns, clip paths) defined in the parent plate. */
  id: string;
  ticks: number;
}

export function Cross({ x, y, size = 5 }: { x: number; y: number; size?: number }) {
  return (
    <path
      d={`M${x - size} ${y}h${size * 2}M${x} ${y - size}v${size * 2}`}
      fill="none"
      stroke="currentColor"
    />
  );
}

export function RadarField({ colors, seed, density, id, ticks }: FieldProps) {
  return (
    <>
          <path
            d="M245 277L144 126A182 182 0 0 1 412 204Z"
            fill={colors.accent}
          />
          <circle
            cx="245"
            cy="277"
            r="174"
            fill="none"
            stroke={colors.ink}
            strokeWidth="1.5"
          />
          {[156, 130, 104, 78, 52, 26].map((r, i) => (
            <circle
              key={r}
              cx="245"
              cy="277"
              r={r}
              fill="none"
              stroke={colors.ink}
              strokeWidth={i === 0 ? 2.5 : 0.8}
            />
          ))}
          <g clipPath={`url(#${id}-disc)`}>
            <rect
              x="245"
              y="110"
              width="170"
              height="336"
              fill={`url(#${id}-hatch)`}
              opacity="0.27"
            />
            {Array.from({ length: 6 + Math.round(density / 8) }, (_, i) => (
              <circle
                key={i}
                cx={105 + sample(seed, i) * 280}
                cy={135 + sample(seed, i + 70) * 280}
                r={2 + sample(seed, i + 30) * 4}
                fill={colors.ink}
              />
            ))}
          </g>
          {Array.from({ length: ticks }, (_, i) => (
            <path
              key={i}
              d={`M245 103v${i % 6 === 0 ? 14 : 6}`}
              transform={`rotate(${(i * 360) / ticks} 245 277)`}
              stroke={colors.ink}
              strokeWidth={i % 6 === 0 ? 1.4 : 0.7}
            />
          ))}
          <path
            d="M54 277H436M245 102V453M122 154L368 400M122 400L368 154"
            stroke={colors.ink}
            strokeWidth="0.75"
            fill="none"
          />
          <path d="M245 277L379 174" stroke={colors.ink} strokeWidth="3" />
          <circle
            cx="245"
            cy="277"
            r="8"
            fill={colors.background}
            stroke={colors.ink}
            strokeWidth="2"
          />
          <circle cx="245" cy="277" r="2" fill={colors.ink} />
          <rect
            x="442"
            y="94"
            width="122"
            height="366"
            fill={colors.background}
            stroke={colors.ink}
          />
          {Array.from({ length: 28 }, (_, i) => (
            <Cross
              key={i}
              x={458 + (i % 4) * 29}
              y={111 + Math.floor(i / 4) * 49}
              size={3.5}
            />
          ))}
          <circle
            cx="502"
            cy="277"
            r="36"
            fill={colors.accent}
            stroke={colors.ink}
          />
          <Cross x={502} y={277} size={49} />
          <circle cx="502" cy="277" r="18" fill="none" stroke={colors.ink} />
          <path d="M442 413H564" stroke={colors.ink} />
    </>
  );
}

export function WaveField({ colors, seed }: FieldProps) {
  const points = Array.from({ length: 161 }, (_, i) => {
    const envelope = Math.sin((i / 160) * Math.PI) ** 2;
    const y =
      285 +
      Math.sin(i * (0.22 + sample(seed, 1) * 0.12)) * envelope * 115 +
      Math.sin(i * 0.93) * envelope * 24;
    return `${68 + i * 2.9},${y.toFixed(3)}`;
  }).join(" ");
  return (
    <>
          <rect x="220" y="94" width="98" height="366" fill={colors.accent} />
          {[157, 221, 285, 349, 413].map((y) => (
            <path
              key={y}
              d={`M36 ${y}H564`}
              stroke={colors.ink}
              strokeDasharray="3 5"
              opacity="0.5"
            />
          ))}
          <polyline
            points={points}
            fill="none"
            stroke={colors.ink}
            strokeWidth="3"
          />
          <polyline
            points={points}
            transform="translate(0 570) scale(1 -1)"
            fill="none"
            stroke={colors.ink}
            strokeWidth="0.8"
          />
          <path d="M36 285H564M269 94V460" stroke={colors.ink} />
          {[100, 180, 360, 470].map((x) => (
            <Cross key={x} x={x} y={285} size={12} />
          ))}
          <circle
            cx="269"
            cy="285"
            r="132"
            fill="none"
            stroke={colors.ink}
            strokeDasharray="2 7"
          />
    </>
  );
}

export function GridField({ colors, seed, density }: FieldProps) {
  return (
    <>
          {Array.from({ length: 96 }, (_, i) => {
            const value = sample(seed, i);
            const x = 51 + (i % 12) * 42;
            const y = 111 + Math.floor(i / 12) * 42;
            return value > 0.52 ? (
              <rect
                key={i}
                x={x}
                y={y}
                width="30"
                height="30"
                fill={value > 0.78 ? colors.accent : colors.ink}
              />
            ) : (
              <Cross key={i} x={x + 15} y={y + 15} size={4 + density / 20} />
            );
          })}
          <circle
            cx="300"
            cy="277"
            r="144"
            fill="none"
            stroke={colors.ink}
            strokeWidth="2"
          />
          <circle
            cx="300"
            cy="277"
            r="152"
            fill="none"
            stroke={colors.ink}
            strokeDasharray="2 5"
          />
          <path d="M36 277H564M300 94V460" stroke={colors.ink} />
    </>
  );
}
