# ────────────────────────────────────────────────────────────────────────
# STAGE 1: Install Dependencies (Mengunduh packages)
# ────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS deps
WORKDIR /app

# 🔥 FIX 1: Gunakan wildcard (*) agar tidak crash jika package-lock.json tidak ada di lokal
COPY package.json package-lock.json* ./

# Jika package-lock.json ada, jalankan npm ci (cepat & clean), jika tidak ada gunakan npm install biasa
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ────────────────────────────────────────────────────────────────────────
# STAGE 2: Build Application (Mengompilasi kode Next.js)
# ────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Mematikan data telemetri Next.js demi mempercepat proses build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ────────────────────────────────────────────────────────────────────────
# STAGE 3: Production Runner (Menjalankan server standalone yang super ringan)
# ────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 🔥 FIX 3: Membuat system user & group khusus untuk menjalankan Next.js secara aman (Non-Root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1002 nextjs

# 🔥 FIX 2: Next.js standalone wajib menyalin folder public secara manual agar gambar/asset statis tidak hilang
# Baris di bawah memastikan folder public disalin jika ada di dalam project lu
COPY --from=builder /app/public ./public

# Salin output standalone dan static dengan memberikan hak kepemilikan penuh ke user nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Aktifkan user non-root demi keamanan kontainer
USER nextjs

EXPOSE 3000

# Menjalankan server biner utama hasil kompilasi standalone Next.js
CMD ["node", "server.js"]