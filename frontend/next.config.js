/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Proxy /api/backend/* → Java backend so the browser never exposes
   * the backend URL and we avoid CORS issues in production.
   */
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
