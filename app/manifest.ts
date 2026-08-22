import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rato — Habla español",
    short_name: "Rato",
    description: "Conversaciones cotidianas en español de México.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e6",
    theme_color: "#f4f0e6",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
