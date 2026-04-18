import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ajn: {
          black: "#050505",
          charcoal: "#101010",
          gold: "#D4AF37",
          goldSoft: "#E9D28A",
          ivory: "#FFF9EC",
          muted: "#A6A08F",
          line: "rgba(212, 175, 55, 0.18)",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)"],
        display: ["var(--font-cormorant)"],
      },
      boxShadow: {
        luxe: "0 18px 60px rgba(0, 0, 0, 0.35)",
        gold: "0 0 0 1px rgba(212, 175, 55, 0.24), 0 18px 50px rgba(212, 175, 55, 0.12)",
      },
      backgroundImage: {
        "gold-grid":
          "linear-gradient(rgba(212,175,55,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.08) 1px, transparent 1px)",
        "luxury-radial":
          "radial-gradient(circle at top, rgba(212, 175, 55, 0.20), transparent 42%), radial-gradient(circle at bottom, rgba(255, 255, 255, 0.05), transparent 28%)",
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
        floaty: "floaty 9s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

