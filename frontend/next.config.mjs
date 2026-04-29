/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel builds Next.js in standalone output mode by default,
  // but explicitly setting it here prevents the routes-manifest issue
  output: "standalone",

  // Ensure env var is available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
