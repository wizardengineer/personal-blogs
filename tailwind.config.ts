import type { Config } from "tailwindcss"
import typography from "@tailwindcss/typography"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
    fontFamily: {
        // Tailwind’s `font-sans` will now use Montserrat
        sans: ["var(--font-sans)"],
        // Tailwind’s `font-serif` will now use EB Garamond
        serif: ["var(--font-serif)"],
        // keep any other custom families you need…
      },
    },
  },
  plugins: [
        typography(),          
  ],
}
export default config
