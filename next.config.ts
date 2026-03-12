import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake large icon/chart libraries — only include used exports
  experimental: {
    // Disable client-side router cache for dynamic pages — prevents stale/empty data when navigating back
    staleTimes: {
      dynamic: 0,
    },
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "sonner",
      "@supabase/supabase-js",
    ],
  },

  // Reduce deployed bundle size
  output: "standalone",

  // Security + minor perf
  poweredByHeader: false,
};

export default nextConfig;
