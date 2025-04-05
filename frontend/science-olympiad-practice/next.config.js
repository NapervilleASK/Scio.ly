/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (
    config,
    {}
  ) => {
    config.externals.push({ canvas: 'commonjs canvas' })
    return config
  }
};

module.exports = nextConfig; 