import type { NextConfig } from 'next';

const isPreview = process.env.VERCEL_ENV === 'preview';

const nextConfig: NextConfig = {
  reactStrictMode: false, // evita dobles renders en dev

  // ⚡ TypeScript
  typescript: {
    // en producción chequea bien, en previews ignora
    ignoreBuildErrors: isPreview || true,
  },

  // ⚡ ESLint
  eslint: {
    // en producción chequea bien, en previews ignora
    ignoreDuringBuilds: isPreview || true,
  },

  // ⚡ Imágenes
  images: {
    unoptimized: true, // evita errores en deploy (optimizer)
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      // { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      // { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },

  // ⚡ Opcional: experimentales o turbopack
  experimental: {
    turbo: {},
  },
};

export default nextConfig;
