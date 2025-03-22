FROM node:12

WORKDIR /app

COPY . .

RUN npm install --no-audit --no-fund

VOLUME /app/database
VOLUME /app/tokens

EXPOSE 10345

CMD ["node", "app.js", "--output=/app/database", "--token-file=/app/tokens/token.json", "--public-report"]