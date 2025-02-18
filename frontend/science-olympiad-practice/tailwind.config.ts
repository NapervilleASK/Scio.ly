import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        regalblue: {
          100: "#0D324D"
        },
        regalred: {
          100: "#7F5A83"
        }, 
        palenight: {
          100: "#282C3E"
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
