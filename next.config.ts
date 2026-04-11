import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // opcional: evita dobles efectos en dev
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  images: {
    // Desactiva el optimizer (evita 400/Bad Request y requisitos de dominios)
    unoptimized: true,

    // Lo dejo por si luego vuelves a optimizar
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      // { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      // { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
