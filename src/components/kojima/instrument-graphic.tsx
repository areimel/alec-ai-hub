import { Cross, GridField, RadarField, WaveField } from "./instrument-fields";
import { DEFAULT_SEED, sample } from "./seed";

export interface InstrumentGraphicProps {
  className?: string;
  variant?: "radar" | "wave" | "grid";
  palette?: "paper" | "orange" | "dark";
  seed?: number;
  /** Detail density, clamped to 0-100. */
  complexity?: number;
  /** Accessible label. Set to an empty string (or use decorative) to hide from assistive technology. */
  title?: string;
  decorative?: boolean;
  /** Large word across the bottom (default "AI HUB"). Fits up to about 8 characters. */
  wordmark?: string;
  /** Large top-left code (default depends on variant). */
  code?: string;
  /** Top-right plate label. */
  plate?: string;
  /** Top-left small line. */
  bureau?: string;
  /** Figure caption, shown after "FIG. 01 / ". Defaults to "<VARIANT> TELEMETRY". */
  figure?: string;
  /** Two small lines at the bottom right. */
  footerLines?: [string, string];
  /** Optional extra disambiguator for SVG ids. */
  idSuffix?: string;
}

const palettes = {
  paper: { background: "#eee9db", ink: "#191a17", accent: "#ff4d00" },
  orange: { background: "#ff4d00", ink: "#191a17", accent: "#eee9db" },
  dark: { background: "#191a17", ink: "#eee9db", accent: "#ff4d00" },
};

const defaultCodes = { radar: "SONAR—25", wave: "PHASE—08", grid: "ARRAY—64" };
const defaultLabels = { radar: "Radar", wave: "Waveform", grid: "Matrix" };

/**
 * Original native-SVG instrument plate. No effects, browser APIs, or external assets.
 * Ids are derived from variant + palette + seed (+ idSuffix) instead of useId, so
 * output is stable across separate Astro renders. Identical plates on one page
 * emit identical definitions under the same id, which is harmless.
 */
export function InstrumentGraphic({
  className,
  variant = "radar",
  palette = "orange",
  seed = DEFAULT_SEED,
  complexity = 75,
  title,
  decorative = false,
  wordmark = "AI HUB",
  code,
  plate = "PLATE 025",
  bureau = "AI HUB / PROMPT RESEARCH BUREAU",
  figure,
  footerLines = ["WORKING INSTRUMENTS", "NO. 025 / PROMPT + AGENT + SKILL"],
  idSuffix = "",
}: InstrumentGraphicProps) {
  const colors = palettes[palette];
  const normalizedSeed = Number.isFinite(seed) ? seed >>> 0 : DEFAULT_SEED;
  const id = `ig-${variant}-${palette}-${normalizedSeed}${idSuffix ? `-${idSuffix}` : ""}`;
  const density = Math.max(
    0,
    Math.min(100, Number.isFinite(complexity) ? complexity : 75),
  );
  const ticks = 48 + Math.round((density / 100) * 96);
  const bars = 32 + Math.round((density / 100) * 48);
  const label = title ?? `${defaultLabels[variant]} instrument plate, edition ${normalizedSeed}`;
  const hidden = decorative || label === "";
  const word = wordmark.toUpperCase();
  // Fixed-width wordmark: textLength guarantees it fits the 564-wide frame in any fallback font.
  const wordSize = Math.min(100, Math.floor(534 / (Math.max(word.length, 1) * 0.9)));
  const wordLength = Math.min(534, Math.round(word.length * wordSize * 0.78));
  const field = { colors, seed: normalizedSeed, density, id, ticks };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 660"
      width="600"
      height="660"
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        color: colors.ink,
      }}
      role={hidden ? undefined : "img"}
      aria-label={hidden ? undefined : label}
      aria-hidden={hidden ? true : undefined}
      focusable="false"
      data-variant={variant}
      data-palette={palette}
    >
      <defs>
        <pattern
          id={`${id}-grid`}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M24 0H0V24"
            fill="none"
            stroke={colors.ink}
            strokeWidth="0.6"
            opacity="0.24"
          />
        </pattern>
        <pattern
          id={`${id}-hatch`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path d="M0 0V6" stroke={colors.ink} strokeWidth="1.2" />
        </pattern>
        <clipPath id={`${id}-field`}>
          <rect x="36" y="94" width="528" height="366" />
        </clipPath>
        <clipPath id={`${id}-disc`}>
          <circle cx="245" cy="277" r="156" />
        </clipPath>
      </defs>
      <rect width="600" height="660" fill={colors.background} />
      <g fill="none" stroke={colors.ink}>
        <rect x="18" y="18" width="564" height="624" strokeWidth="1.4" />
        <path d="M18 78H582M18 482H582M18 596H582M36 94H564V460H36Z" />
      </g>
      <g
        fill={colors.ink}
        fontFamily="'Courier New', monospace"
        fontSize="9"
        letterSpacing="1"
      >
        <text x="36" y="39">
          {bureau}
        </text>
        <text x="564" y="39" textAnchor="end">
          {plate}
        </text>
        <text x="36" y="64" fontSize="20" fontWeight="700" letterSpacing="-1">
          {code ?? defaultCodes[variant]}
        </text>
        <text x="564" y="62" textAnchor="end">
          {String(normalizedSeed).padStart(10, "0")} / {Math.round(density)}%
        </text>
      </g>
      <g clipPath={`url(#${id}-field)`}>
        <rect
          x="36"
          y="94"
          width="528"
          height="366"
          fill={`url(#${id}-grid)`}
        />
        {variant === "radar" && <RadarField {...field} />}
        {variant === "wave" && <WaveField {...field} />}
        {variant === "grid" && <GridField {...field} />}
      </g>
      <g
        fill={colors.ink}
        fontFamily="'Courier New', monospace"
        fontSize="7"
        letterSpacing="0.7"
      >
        <text x="42" y="472">
          FIG. 01 / {figure ?? `${variant.toUpperCase()} TELEMETRY`}
        </text>
        <text x="558" y="472" textAnchor="end">
          SCAN 360° / SYSTEM ACTIVE
        </text>
      </g>
      <text
        x="30"
        y="578"
        fill={colors.ink}
        fontFamily="'Arial Black', Arial, sans-serif"
        fontSize={wordSize}
        fontWeight="900"
        textLength={wordLength}
        lengthAdjust="spacingAndGlyphs"
      >
        {word}
      </text>
      <g fill={colors.ink}>
        {Array.from({ length: bars }, (_, i) => {
          const height = 5 + sample(normalizedSeed, i + 200) * 24;
          return (
            <rect
              key={i}
              x={36 + (i * 294) / bars}
              y={632 - height}
              width={Math.max(1, 294 / bars - 1.6)}
              height={height}
            />
          );
        })}
      </g>
      <g
        fill={colors.ink}
        fontFamily="'Courier New', monospace"
        fontSize="8"
        letterSpacing="0.6"
      >
        <text x="352" y="613">
          {footerLines[0]}
        </text>
        <text x="352" y="630">
          {footerLines[1]}
        </text>
      </g>
      {[
        [18, 18],
        [582, 18],
        [18, 642],
        [582, 642],
      ].map(([x, y], i) => (
        <Cross key={i} x={x} y={y} size={8} />
      ))}
    </svg>
  );
}

export default InstrumentGraphic;