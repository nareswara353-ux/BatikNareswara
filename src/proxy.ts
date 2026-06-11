import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 1. Definisikan rute mana saja yang BISA diakses oleh pengunjung umum tanpa login (Public Routes)
const isPublicRoute = createRouteMatcher([
  '/',                      // Homepage Batik Nareswara
  '/login(.*)',             // Halaman portal login kustom lu
  '/auth(.*)',              // Halaman register kustom lu
  '/product/(.*)',          // Halaman detail produk reguler
  '/(.)product/(.*)',       // Intercepted modal produk yang nge-pop up kenceng kemarin
  '/_not-found'             // Halaman error 404 bawaan Next.js
]);

// 2. Jalankan eksekusi interseptor token dan sesi user
export default clerkMiddleware(async (auth, request) => {
  // Jika user mencoba mengakses rute non-publik (seperti /admin atau /admin/dashboard)
  if (!isPublicRoute(request)) {
    // Clerk otomatis memvalidasi token JWT. Jika tidak sah/belum login,
    // user langsung ditendang ke URL login kustom yang lu set di .env.local tadi!
    await auth.protect();
  }
});

// 3. Konfigurasi Matcher (Filter jalur mana saja yang harus dilewati oleh satpam ini)
export const config = {
  matcher: [
    /*
     * Match semua request paths kecuali untuk yang berbau internal Next.js dan file statis:
     * - _next (file kompilasi internal)
     * - static assets (.css, .js, gambar, font, favicon, dll)
     */
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Selalu jalankan middleware untuk jalur API atau tRPC jika ada
    '/(api|trpc)(.*)',
  ],
};