FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@10.20.0

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile --prod

COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {let data='';r.on('data',c=>data+=c);r.on('end',()=>{try{const j=JSON.parse(data);process.exit(j.status==='ok'?0:1)}catch(e){process.exit(1)}})},(e)=>process.exit(1))"

# Comando para iniciar a aplicação
CMD ["pnpm", "start"]

