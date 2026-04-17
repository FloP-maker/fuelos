import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/pre-post", destination: "/prep", permanent: true },
      { source: "/prepost", destination: "/prep", permanent: true },
      { source: "/mode-course", destination: "/race", permanent: true },
      { source: "/modecourse", destination: "/race", permanent: true },
      { source: "/shop", destination: "/produits", permanent: true },
      { source: "/learn", destination: "/profil?tab=insights", permanent: true },
      { source: "/products", destination: "/produits", permanent: true },
      { source: "/analysis", destination: "/profil?tab=insights", permanent: true },
    ];
  },
  async headers() {
      return [
            {
                    source: "/(.*)",
                            headers: [
                                      { key: "X-Content-Type-Options", value: "nosniff" },
                                                { key: "X-Frame-Options", value: "DENY" },
                                                          { key: "X-XSS-Protection", value: "1; mode=block" },
                                                                  ],
                                                                        },
                                                                              {
                                                                                      source: "/manifest.json",
                                                                                              headers: [
                                                                                                        { key: "Content-Type", value: "application/manifest+json" },
                                                                                                                  { key: "Cache-Control", value: "public, max-age=86400" },
                                                                                                                          ],
                                                                                                                                },
                                                                                                                                      {
                                                                                                                                              source: "/sw.js",
                                                                                                                                                      headers: [
                                                                                                                                                                { key: "Content-Type", value: "application/javascript" },
                                                                                                                                                                          { key: "Service-Worker-Allowed", value: "/" },
                                                                                                                                                                                    { key: "Cache-Control", value: "no-cache" },
                                                                                                                                                                                            ],
                                                                                                                                                                                                  },
                                                                                                                                                                                                      ];
                                                                                                                                                                                                        },
                                                                                                                                                                                                        };

                                                                                                                                                                                                        export default nextConfig;