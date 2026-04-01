# # ── Stage 1: Build ────────────────────────────────────────────────────────────
# FROM node:20-alpine AS builder

# WORKDIR /app

# # Enable pnpm via corepack
# RUN corepack enable && corepack prepare pnpm@latest --activate

# COPY package.json pnpm-lock.yaml ./
# RUN pnpm install --frozen-lockfile

# COPY . .
# RUN pnpm run build

# # ── Stage 2: Production runner ────────────────────────────────────────────────
# FROM node:20-alpine AS runner

# WORKDIR /app

# RUN corepack enable && corepack prepare pnpm@latest --activate

# COPY package.json pnpm-lock.yaml ./
# RUN pnpm install --frozen-lockfile --prod && pnpm store prune

# # Copy compiled output
# COPY --from=builder /app/dist ./dist

# # Non-root user for security
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# USER appuser

# EXPOSE 3300

# CMD ["node", "dist/main.js"]

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Set pnpm home for corepack
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy only locks to leverage Docker layer caching
COPY pnpm-lock.yaml package.json ./

# Use a cache mount for pnpm store to speed up re-builds
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ── Stage 2: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy locks again
COPY pnpm-lock.yaml package.json ./

# Install ONLY production dependencies using cache mount
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Security: Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Ensure the appuser can access the workdir if needed (rare for Nest, but good practice)
RUN chown -R appuser:appgroup /app

USER appuser

# Match your NestJS app's internal port
EXPOSE 3300

# Use a clean start command
CMD ["node", "dist/main.js"]