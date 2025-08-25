import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Handle font loading in restricted environments
  images: {
    domains: ["fonts.googleapis.com", "fonts.gstatic.com"],
  }
};

export default nextConfig;
