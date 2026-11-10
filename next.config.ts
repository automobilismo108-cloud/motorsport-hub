import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exportação estática para publicar o protótipo no GitHub Pages.
  output: "export",
  trailingSlash: true,
  basePath: "/motorsport-hub",
};

export default nextConfig;
