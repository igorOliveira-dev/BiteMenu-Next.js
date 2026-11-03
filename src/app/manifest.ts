import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bite Menu",
    short_name: "Bite Menu",
    description: "Painel de controle do Bite Menu",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#fbf5ef",
    theme_color: "#d42020",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
