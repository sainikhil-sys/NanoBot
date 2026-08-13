import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nanobot: {
          green: "#16A34A",
          "green-light": "#EAF7EE",
          "green-soft": "#F2FAF4",
          black: "#111111",
          text: "#1F2937",
          muted: "#6B7280",
          border: "#E5E7EB",
          bg: "#FFFFFF",
          surface: "#FFFFFF",
        },
        background: "#FFFFFF",
        foreground: "#111111",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111111",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#111111",
        },
        primary: {
          DEFAULT: "#000000",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F5F5F5",
          foreground: "#111111",
        },
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#666666",
        },
        accent: {
          DEFAULT: "#FAFAFA",
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#111111",
          foreground: "#FFFFFF",
        },
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#111111",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Tenor Sans", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "3xl": "24px",
        "2xl": "16px",
        xl: "12px",
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        xs: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        sm: "0 2px 4px 0 rgba(0, 0, 0, 0.04)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
