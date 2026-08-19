import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  env: {
    NEXT_PUBLIC_PARENT_SITE_API_URL: process.env.NEXT_PUBLIC_PARENT_SITE_API_URL ?? "",
  },
};

export default nextConfig;
