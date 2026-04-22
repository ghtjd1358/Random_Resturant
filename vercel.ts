import { routes, type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "npm run build",
  installCommand: "npm install",
  headers: [
    routes.cacheControl("/manifest.webmanifest", {
      public: true,
      maxAge: "1 hour",
    }),
    routes.cacheControl("/sw.js", { noStore: true }),
    routes.cacheControl("/icons/(.*)", {
      public: true,
      maxAge: "1 year",
      immutable: true,
    }),
  ],
};

export default config;
