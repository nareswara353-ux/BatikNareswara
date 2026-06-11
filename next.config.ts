import type { NextConfig } from 'next';

// Ambil status environment node
const isDev = process.env.NODE_ENV === 'development';
const apiBaseRaw = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// Fallback Supabase URL harus string kosong jika tidak di-set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Hilangkan tanda slash ("/") di ujung URL jika ada
const apiBase = apiBaseRaw.replace(/\/+$/, '');

// 🔥 FIX DOCKER NETWORK: Next.js server di dalam Docker wajib proxy ke DNS internal kontainer ('http://batik-backend:8080/api')
// agar tidak terkena eror ECONNREFUSED saat menggunakan rute /api/:path*
const internalApiBase = process.env.INTERNAL_BACKEND_API_URL || apiBase;

let apiOrigin = 'http://localhost:5000';
try {
  apiOrigin = new URL(apiBase).origin;
} catch {
  // keep default fallback
}

let supabaseHostname: string | undefined;
let supabaseOrigin: string | undefined;
try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl);
    supabaseHostname = u.hostname;
    supabaseOrigin = u.origin;
  }
} catch {
  // abaikan URL jika tidak valid
}

const remotePatterns = [
  ...(supabaseHostname
    ? [
        {
          protocol: 'https' as const,
          hostname: supabaseHostname,
          port: '',
          pathname: '/storage/v1/object/public/**',
        },
      ]
    : []),
  { protocol: 'https' as const, hostname: 'img.clerk.com', port: '', pathname: '/**' },
  { protocol: 'https' as const, hostname: 'images.unsplash.com', port: '', pathname: '/**' },
];

const imgSrcList = ["'self'", 'data:'];
if (supabaseOrigin) imgSrcList.push(supabaseOrigin);
imgSrcList.push('https://img.clerk.com', 'https://images.unsplash.com');

const connectSrcList = ["'self'"];
if (supabaseOrigin) connectSrcList.push(supabaseOrigin);
connectSrcList.push('https://*.clerk.accounts.dev', apiOrigin);

// ════════════════════════════════════════════════════════════════════════
// MASTER CONFIGURATION (SEMUA DIJADIKAN SATU DI SINI)
// ════════════════════════════════════════════════════════════════════════
const nextConfig: NextConfig = {
  // 🔥 1. AKTIFKAN STANDALONE MODE DI SINI UNTUK DOCKER RUNNER
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // 🔥 2. JALUR PROXY AMAN: Menggunakan rute internal Docker jika sedang berjalan di kontainer
        destination: `${internalApiBase}/:path*`,
      },
    ];
  },

  images: {
    remotePatterns,
  },

  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: "camera=(), microphone=(), geolocation=()" },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            // 🔥 FIX 1: Tambahkan 'blob:' di akhir script-src agar browser mengizinkan script internal Clerk
            `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://clerk.batik-nareswara.com https://*.clerk.accounts.dev blob:`,
            // 🔥 FIX 2: Tambahkan directive ini khusus untuk mengizinkan Web Worker Clerk berjalan via blob
            "worker-src 'self' blob:",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            `img-src ${imgSrcList.join(' ')}`,
            `connect-src ${connectSrcList.join(' ')}`,
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; '),
        },
      ],
    },
  ],
};

export default nextConfig;