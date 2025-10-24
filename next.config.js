/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Ensure proper module resolution for Netlify deployment
  serverExternalPackages: ['@netlify/neon'],
  // Fix for module resolution in app directory
  transpilePackages: [],
  // Turbopack configuration for Next.js 16
  turbopack: {},
  // Configure path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'utils': require('path').resolve(__dirname, 'utils.js'),
      'components': require('path').resolve(__dirname, 'components'),
      'lib': require('path').resolve(__dirname, 'lib'),
    };
    return config;
  },
};

export default nextConfig;
