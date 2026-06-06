import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        funime: {
          purple: "#7B2EFF",
          dark: "#080510",
          card: "#141021",
          accent: "#A855F7"
        }
      }
    }
  },
  plugins: []
};

export default config;