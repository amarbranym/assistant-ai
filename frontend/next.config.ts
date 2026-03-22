import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/verify-otp",
        destination: "/sign-in",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
