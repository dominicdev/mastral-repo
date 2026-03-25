import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    '@esbuild',
    'esbuild',
    'mlly',
    'local-pkg',
    '@mastra/core',
    '@mastra/loggers',
    '@mastra/libsql',
    '@mastra/memory',
    '@mastra/observability',
    '@mastra/ai-sdk',
    '@mastra/deployer',
    '@mastra/deployer-vercel',
    'mastra',
  ],
};

export default nextConfig;
