FROM node:10

WORKDIR /app

COPY . .

RUN npm install --no-audit --no-fund

# اضافه کردن دستور برای بیلد کردن فرانت‌اند
RUN cd frontend && npm install && npm run build

VOLUME /app/database
VOLUME /app/tokens

EXPOSE 10345

CMD ["node", "app.js", "--output=/app/database", "--token-file=/app/tokens/token.json", "--public-report"]