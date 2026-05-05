/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.tiktokcdn.com",
      },
      {
        protocol: "https",
        hostname: "*.tiktok.com",
      },
      {
        protocol: "https",
        hostname: "*.tiktokv.com",
      },
      {
        protocol: "https",
        hostname: "*.ibyteimg.com",
      },
    ],
  },
};

module.exports = nextConfig;
