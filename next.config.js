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
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "*.instagram.com",
      },
    ],
  },
};

module.exports = nextConfig;
