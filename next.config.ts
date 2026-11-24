import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Signal keeps all state in the browser and fetches nothing on the server, so the
  // cache-components / instant-navigation machinery would only add friction.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
