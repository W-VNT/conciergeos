/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint errors during build (for MVP development)
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["@react-pdf/renderer"],
};

export default nextConfig;
