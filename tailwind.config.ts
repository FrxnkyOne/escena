import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F1F2F5",
        ink: { DEFAULT: "#15161A", 2: "#3C3E45" },
        muted: "#74767E",
        line: "#E3E5EA",
        brand: { DEFAULT: "#3231E0", soft: "#ECECFE" },
        stage: "#0B0C12",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: { card: "18px" },
    },
  },
  plugins: [],
} satisfies Config;
