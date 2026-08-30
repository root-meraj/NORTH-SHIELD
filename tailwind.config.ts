import type { Config } from "tailwindcss";

/** Every color is a CSS var so themes can swap without touching components. */
const c = (v: string) => `rgb(var(--ns-${v}) / <alpha-value>)`;

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: c("ink"),
        slate: c("slate"),
        "slate-2": c("slate-2"),
        hairline: c("hairline"),
        bone: c("bone"),
        ash: c("ash"),
        faint: c("faint"),
        signal: c("signal"),
        clear: c("clear"),
        caution: c("caution"),
        blocked: c("blocked"),
        glacier: c("glacier"),
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      /**
       * Tailwind only emits colour/opacity modifiers whose step exists on
       * this scale — `bg-clear/12` and friends were silently compiling to
       * nothing, which is why the status tints never appeared. These are the
       * steps the design system actually uses.
       */
      opacity: { 6: "0.06", 8: "0.08", 12: "0.12", 14: "0.14", 92: "0.92" },
      borderRadius: { DEFAULT: "10px" },
      maxWidth: { shell: "84rem" },
      screens: { xs: "420px" },
    },
  },
  plugins: [],
} satisfies Config;
