import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal server bundle with only the deps actually used at runtime —
  // keeps the Docker production image small instead of shipping the full node_modules.
  output: "standalone",
};

export default nextConfig;
