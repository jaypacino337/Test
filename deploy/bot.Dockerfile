# Sherwood bot: claim → split → auto-LP → snapshot → crash-safe airdrop, plus the stats API.
# Build context = repo root:  docker build -f deploy/bot.Dockerfile -t sherwood-bot .
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/fee-harvester/package.json packages/fee-harvester/
COPY packages/autolp/package.json packages/autolp/
COPY packages/snapshot-bot/package.json packages/snapshot-bot/
COPY packages/token-launch/package.json packages/token-launch/
RUN npm ci --no-audit --no-fund
COPY packages ./packages
RUN npm run build -w packages/shared -w packages/fee-harvester -w packages/autolp -w packages/snapshot-bot \
 && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data NODE_NO_WARNINGS=1
COPY --from=build /app /app
# file-store fallback lives here (mount a Railway volume); with Supabase set it stays empty
RUN mkdir -p /data && chown node:node /data
USER node
CMD ["node", "packages/snapshot-bot/dist/index.js"]
