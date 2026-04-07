import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/products", destination: "/shop", permanent: true },
      { source: "/analysis", destination: "/learn", permanent: true },
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