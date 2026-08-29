import type { MetadataRoute } from "next";

/**
 * She uses this on a phone, from the home screen. The manifest is what makes
 * "Add to Home Screen" open it as an app rather than a browser tab.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GFO Foods",
    short_name: "GFO Foods",
    description: "Stock, production and sales for GFO Foods",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f6f3",
    theme_color: "#b4451f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
