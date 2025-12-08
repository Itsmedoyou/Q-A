/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:8000/auth/:path*',
      },
      {
        source: '/api/questions/:path*',
        destination: 'http://localhost:8000/questions/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
  allowedDevOrigins: [
    'localhost',
    'localhost:5000',
    '127.0.0.1',
    '127.0.0.1:5000',
    '0.0.0.0',
    '0.0.0.0:5000',
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:5000', '127.0.0.1:5000'],
    },
  },
};

module.exports = nextConfig;
