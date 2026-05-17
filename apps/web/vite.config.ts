import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/v1": process.env.VITE_API_BASE_URL ?? "http://localhost:3000",
      "/healthz": process.env.VITE_API_BASE_URL ?? "http://localhost:3000",
      "/readyz": process.env.VITE_API_BASE_URL ?? "http://localhost:3000"
    }
  }
});
