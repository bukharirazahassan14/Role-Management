/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  images: {
    localPatterns: [
      {
        pathname: '/uploads/profiles/**', // ✅ Allow uploaded user images
      },
      {
        pathname: '/avatar.png', // ✅ Allow default avatar image
      },
    ],
  },
};

export default nextConfig;
