FROM node:24-alpine AS build
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY app/build.js ./
COPY app/src ./src
COPY app/public ./public
RUN npm run build

FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
