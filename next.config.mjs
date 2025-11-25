/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  images: {
    localPatterns: [
      {
        pathname: '/**',               // ✅ Allow ALL images inside /public
      },
      {
        pathname: '/uploads/profiles/**', // (Optional) Still included if needed
      },
      {
        pathname: '/avatar.png', // (Optional) Still included if needed
      },
    ],
  },
};

export default nextConfig;
