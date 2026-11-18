import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "지금까지 읽은 책 · What I Read So Far",
    short_name: "읽은 책",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#fafaf9",
    icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
