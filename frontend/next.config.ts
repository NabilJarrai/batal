import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  },
};

export default nextConfig;
