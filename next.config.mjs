import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint errors during build (for MVP development)
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["@react-pdf/renderer"],
};

export default withSerwist(nextConfig);
