/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow YouTube iframe embeds
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ];
  },
};

export default nextConfig;
