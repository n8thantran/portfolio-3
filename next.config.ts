import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Keep `next dev` artifacts separate from production builds so a live dev server
  // doesn't corrupt `.next` when `next build` runs in another terminal.
  distDir: isDevelopment ? ".next-dev" : ".next",
};

export default nextConfig;
