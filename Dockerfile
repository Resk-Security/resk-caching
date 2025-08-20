# syntax=docker/dockerfile:1

# Build stage
FROM oven/bun:1 as build
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install
COPY tsconfig.json .
COPY src ./src
COPY docs ./docs
COPY README.md LICENSE .
RUN bun run build

# Runtime stage
FROM gcr.io/distroless/cc-debian12
WORKDIR /app
# Copy Bun runtime from base image
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/README.md ./README.md
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
# Minimal user for security
USER 65532:65532
CMD ["/usr/local/bin/bun", "dist/server.js"]
