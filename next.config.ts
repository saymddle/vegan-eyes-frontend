import type { NextConfig } from "next";

// Vegan Eyes is a phone app now. The old website pages send people to the
// "Get the app" page; /privacy, /support, /auth (email confirmation) and the
// /api routes the app uses stay.
const retired = [
  "/account/:path*",
  "/community/:path*",
  "/convert/:path*",
  "/goodbye",
  "/library/:path*",
  "/my-scans/:path*",
  "/profile/:path*",
  "/recipes/:path*",
  "/results/:path*",
  "/scan/:path*",
  "/welcome"
];

const nextConfig: NextConfig = {
  async redirects() {
    return retired.map((source) => ({ source, destination: "/", permanent: false }));
  }
};

export default nextConfig;
