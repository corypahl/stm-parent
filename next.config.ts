import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_ACTIONS === "true";
const publicBasePath = githubPages ? "/stm-parent" : "";

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: publicBasePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: publicBasePath,
  },
};

export default nextConfig;
