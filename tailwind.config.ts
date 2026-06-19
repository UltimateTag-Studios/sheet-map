import type { Config } from "tailwindcss";

/** Used only when compiling `dist/styles.css` — not required in consumer apps. */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
};

export default config;
