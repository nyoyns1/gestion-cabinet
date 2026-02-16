import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./*.{js,ts,jsx,tsx,mdx}" // Pour attraper App.tsx et autres à la racine
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a', // slate-900
        secondary: '#64748b', // slate-500
        accent: '#3b82f6', // blue-500
        success: '#22c55e',
        warning: '#eab308',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
};
export default config;