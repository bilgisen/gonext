/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Ensure proper module resolution for Netlify deployment
  serverExternalPackages: ['@netlify/neon'],
  // Fix for module resolution in app directory
  transpilePackages: [],
};

export default nextConfig;
