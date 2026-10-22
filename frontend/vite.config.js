import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Durante `npm run dev`, el proxy manda /api al backend FastAPI en :8000
// para no tener que configurar CORS por separado en desarrollo.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});
