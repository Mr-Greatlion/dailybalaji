import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0faf4",
          100: "#dcf3e4",
          200: "#bce6cc",
          300: "#8dd3aa",
          400: "#58b882",
          500: "#339c63",
          600: "#237d4e",
          700: "#1d6440",
          800: "#1a5035",
          900: "#16422d",
        },
        cream: "#fffaf0",
        saffron: "#f59e0b",
        ink: "#1f2937",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 12px rgba(16, 24, 40, 0.06)",
        card: "0 4px 20px rgba(16, 24, 40, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
