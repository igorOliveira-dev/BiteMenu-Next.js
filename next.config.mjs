import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/dashboard",
  },
  runtimeCaching: [
    {
      // Imagens do Supabase Storage (originais e transformadas via /render/)
      // CacheFirst: após primeira visita, imagens carregam do cache local sem egress
      urlPattern: /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/(object|render)\//,
      handler: "CacheFirst",
      options: {
        cacheName: "supabase-images",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default withPWA(nextConfig);
