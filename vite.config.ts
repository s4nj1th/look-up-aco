import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Using Tailwind CSS v3 via PostCSS (postcss.config.cjs).
// @tailwindcss/vite is v4-only and not compatible with the tailwindcss v3
// package that is installed, so we use the standard PostCSS pipeline instead.
export default defineConfig({
    plugins: [react()],
});
