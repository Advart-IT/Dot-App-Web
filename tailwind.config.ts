import type { Config } from "tailwindcss"

const adjustRgb = ([r, g, b]: [number, number, number], diff: number) => {
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `rgba(${clamp(r - diff)}, ${clamp(g - diff)}, ${clamp(b - diff)}, 1)`;
};

const rgbToRgba = ([r, g, b]: [number, number, number], alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`;


const baseRgb: [number, number, number] = [255, 255, 255]; // bg colour
const textbaseRgb: [number, number, number] = [48, 48, 48]; // text colour
const scsRgb: [number, number, number] = [8, 96, 6];
const dngRgb: [number, number, number] = [196, 3, 24];
const wrnRgb: [number, number, number] = [248, 114, 23];
const primary = '#FFD801';
const txtPy = '#0000A5';


const spacingScale = {
  x2: '2px',
  x4: '4px',
  x5: '5px',
  x6: '6px',
  x8: '8px',
  x10: '10px',
  x15: '15px',
  x20: '20px',
  x30: '30px',
};


const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        'themeBase': {
          DEFAULT: adjustRgb(baseRgb, 0),
          l1: adjustRgb(baseRgb, 16),
          l2: adjustRgb(baseRgb, 32),
        },
        'lbl': {
          DEFAULT: adjustRgb(baseRgb, 10),
        },
        'shdw-clr': {
          DEFAULT: adjustRgb(baseRgb, 20),
        },
        'dtxt': {
          DEFAULT: adjustRgb(textbaseRgb, 0),
        },
        'ltxt': {
          DEFAULT: adjustRgb(textbaseRgb, -64),
        },
        'newprimary': primary,
        'link': txtPy,
        'newsecondary': {
          DEFAULT: adjustRgb(textbaseRgb, 0),
        },
        scs: `rgb(${scsRgb.join(',')})`,
        dng: `rgb(${dngRgb.join(',')})`,
        wrn: `rgb(${wrnRgb.join(',')})`,
        'scs-bg': rgbToRgba(scsRgb, 0.1),
        'dng-bg': rgbToRgba(dngRgb, 0.1),
        'wrn-bg': rgbToRgba(wrnRgb, 0.1),
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom app colors
        app: {
          DEFAULT: "#90ca53",
          light: "#a8d97b",
          dark: "#78b33c",
          foreground: "hsl(var(--primary-app-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
        },
      },
      borderRadius: {
        'x2': '2px',
        'x4': '4px',
        'x5': '5px',
        'x10': '10px',
        'xl': 'var(--radius)',
        'md': 'calc(var(--radius) - 2px)',
        'sm': 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
      },
            spacing: {
        ...spacingScale,
      },
      fontSize: {
        '8': ['0.5rem', { lineHeight: '0.75rem' }],   // 8px
        '10': ['0.625rem', { lineHeight: '0.9375rem' }], // 10px
        '12': ['0.75rem', { lineHeight: '1.125rem' }],   // 12px
        '14': ['0.875rem', { lineHeight: '1.3125rem' }], // 14px (new base)
        '16': ['1rem', { lineHeight: '1.5rem' }],
        '18': ['1.125rem', { lineHeight: '1.6875rem' }],
        '20': ['1.25rem', { lineHeight: '1.875rem' }],
        '22': ['1.375rem', { lineHeight: '2.0625rem' }],
        '24': ['1.5rem', { lineHeight: '2.25rem' }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
