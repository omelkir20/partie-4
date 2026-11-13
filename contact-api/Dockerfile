# ---------- Étape 1 : dépendances ----------
FROM node:24-alpine AS deps
WORKDIR /app
# TODO : copier uniquement package.json et package-lock.json (meilleur cache des couches)
# TODO : npm ci
COPY package*.json ./
RUN npm ci

# ---------- Étape 2 : build ----------
FROM node:24-alpine AS build
WORKDIR /app
# TODO : récupérer node_modules depuis l'étape deps (COPY --from=deps ...)
# TODO : copier tsconfig.json et src/, puis npm run build
# TODO : supprimer les devDependencies (npm prune --omit=dev)
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- Étape 3 : runtime ----------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
# TODO : copier dist/, node_modules/ et package.json depuis l'étape build,
#        avec --chown=node:node
# TODO : passer en utilisateur non-root (l'image node fournit l'utilisateur "node")
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 3000
# TODO : HEALTHCHECK qui interroge http://localhost:3000/health
#        (astuce : wget -qO- est disponible dans alpine)
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
