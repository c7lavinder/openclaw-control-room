import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Next.js server mode (not static export) so API routes work on Railway
  output: undefined,
};

export default nextConfig;
