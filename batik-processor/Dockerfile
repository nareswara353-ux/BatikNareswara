# Stage 1: Planner
FROM rust:latest AS planner
WORKDIR /app
# 🔥 FIX 1: Tambahkan --locked agar cargo mengunci versi dependency yang stabil
RUN cargo install cargo-chef --locked
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Stage 2: Cacher
FROM rust:latest AS cacher
WORKDIR /app
# 🔥 FIX 2: Tambahkan --locked di sini juga
RUN cargo install cargo-chef --locked
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# Stage 3: Builder
FROM rust:latest AS builder
WORKDIR /app
COPY . .
COPY --from=cacher /app/target target
COPY --from=cacher /usr/local/cargo /usr/local/cargo
RUN cargo build --release

# Stage 4: Runtime
FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/batik-processor /app/batik-processor

EXPOSE 8080
ENV RUST_LOG=info
CMD ["./batik-processor"]