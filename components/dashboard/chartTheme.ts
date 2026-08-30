/**
 * Recharts takes colours as SVG attributes, which do not resolve var().
 * So we read the design tokens out of globals.css once and hand Recharts
 * the resolved value — the tokens stay the single source of truth and a
 * theme swap still reaches the charts.
 */

const FALLBACK: Record<string, string> = {
  hairline: "47 79 71",
  ash: "138 158 155",
  faint: "92 112 110",
  bone: "233 238 236",
  ink: "12 20 22",
  slate: "19 30 32",
  glacier: "91 192 190",
  clear: "127 176 105",
  caution: "233 180 76",
  blocked: "214 40 40",
};

let cache: Record<string, string> | null = null;

function tokens(): Record<string, string> {
  if (cache) return cache;
  const read = (name: string) => {
    if (typeof document === "undefined") return `rgb(${FALLBACK[name]})`;
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(`--ns-${name}`)
      .trim()
      // globals.css pads the token columns for alignment; collapse the runs
      // so the value matches the fallback string exactly.
      .replace(/\s+/g, " ");
    return `rgb(${v || FALLBACK[name]})`;
  };
  cache = Object.fromEntries(Object.keys(FALLBACK).map((k) => [k, read(k)]));
  return cache;
}

export const chart = {
  get grid() { return tokens().hairline; },
  get axis() { return tokens().ash; },
  get series() { return tokens().glacier; },
  get surface() { return tokens().slate; },
  get border() { return tokens().hairline; },
  get text() { return tokens().bone; },
  /** Category ramp for the donut. Signal orange is deliberately absent —
   *  it belongs to the one primary action on the page, not to a data series. */
  get categorical() {
    const t = tokens();
    return [t.glacier, t.clear, t.caution, t.blocked, t.ash, t.faint];
  },
};

/**
 * The same ramp, in the same order, as token classes. Anything rendered as
 * DOM uses these — an inline colour read from a CSS var serialises
 * differently on the server than the browser normalises it, which costs a
 * hydration mismatch. Only the Recharts SVG needs the resolved strings above.
 */
export const CATEGORICAL_CLASSES = [
  "bg-glacier", "bg-clear", "bg-caution", "bg-blocked", "bg-ash", "bg-faint",
] as const;

/** Shared axis styling so the three charts read as one system. */
export const axisProps = {
  tick: { fontSize: 10, fontFamily: "var(--font-mono)" },
  tickLine: false,
  axisLine: false,
} as const;

export const tooltipStyle = {
  contentStyle: {
    background: "rgb(19 30 32)",
    border: "1px solid rgb(47 79 71)",
    borderRadius: 10,
    fontSize: 12,
    fontFamily: "var(--font-sans)",
    padding: "8px 10px",
  },
  labelStyle: { color: "rgb(138 158 155)", fontSize: 10, marginBottom: 2 },
  itemStyle: { color: "rgb(233 238 236)", fontSize: 12 },
  cursor: { fill: "rgb(47 79 71 / 0.25)", stroke: "rgb(47 79 71)" },
} as const;
