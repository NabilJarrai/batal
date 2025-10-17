import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Disable ESLint during builds to prevent warnings from breaking production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  },
};

export default nextConfig;
