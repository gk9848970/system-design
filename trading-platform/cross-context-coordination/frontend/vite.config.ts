import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [".lvh.me"], // leading dot = this domain + all subdomains
    https: {
      key: fs.readFileSync("./_wildcard.lvh.me+1-key.pem"),
      cert: fs.readFileSync("./_wildcard.lvh.me+1.pem"),
    },
  },
});
