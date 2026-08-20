import type { NextConfig } from "next";

const githubPages = process.env.DEPLOY_TARGET === "github-pages";
const publicBasePath = githubPages ? "/stm-parent" : "";

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: publicBasePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: publicBasePath,
    NEXT_PUBLIC_PARENT_SITE_API_URL: process.env.NEXT_PUBLIC_PARENT_SITE_API_URL ?? "",
  },
};

export default nextConfig;
