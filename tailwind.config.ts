import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          500: "#2563eb",
          600: "#1d4ed8"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
