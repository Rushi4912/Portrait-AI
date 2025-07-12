/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'static1.cbrimages.com',
      },
      {
        protocol: 'https',
        hostname: 'comicbook.com',
      },
      {
        protocol: 'https',
        hostname: 'freshangleng.com',
      },
      {
        protocol: 'https',
        hostname: 'v3.fal.media',
      },
    ],
  },
};
  
  export default nextConfig;
  