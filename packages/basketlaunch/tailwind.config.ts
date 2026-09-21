import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#05070B",
          800: "#090C12",
          700: "#0E121A",
          600: "#131824",
          500: "#1A2030",
          400: "#232B3D",
        },
        lime: {
          200: "#E6FBA8",
          300: "#D6F87A",
          400: "#C2F24E",
          500: "#A8E01F",
          600: "#84B313",
        },
        aqua: { 400: "#4FE3CF", 600: "#1BA894" },
        iris: { 400: "#8E7BFF", 600: "#6247D8" },
        amber: { 400: "#FFC24D" },
        rose: { 400: "#FF6B85" },
        mist: {
          100: "#EDF2F7",
          300: "#B6C2D2",
          500: "#7E8B9E",
          700: "#4C566A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(194,242,78,0.35), 0 0 32px -6px rgba(194,242,78,0.45)",
        panel: "0 24px 60px -30px rgba(0,0,0,0.9)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
        flash: {
          "0%": { backgroundColor: "rgba(194,242,78,0.16)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
        breathe: "breathe 2.2s ease-in-out infinite",
        flash: "flash 0.9s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
