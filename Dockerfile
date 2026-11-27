FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY --chown=node:node . .
USER node
ENV PORT=3000
EXPOSE 3000
CMD ["node","server.mjs"]
