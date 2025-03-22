FROM node:16-alpine

WORKDIR /app

# نصب پیش‌نیازهای لازم برای node-sass و سایر پکیج‌ها
RUN apk add --no-cache python3 make g++ gcc

# node-sass را به صورت خاص نصب می‌کنیم تا از مشکلات جلوگیری شود
COPY package.json ./
COPY package-lock.json ./

# تنظیم متغیر محیطی برای python
ENV PYTHON=/usr/bin/python3

# نصب وابستگی‌ها با نادیده گرفتن اخطارها
RUN npm install --no-audit --no-fund

# کپی بقیه فایل‌ها
COPY . .

VOLUME /app/database
VOLUME /app/tokens
EXPOSE 10345

CMD ["node", "app.js", "--output=/app/database", "--token-file=/app/tokens/token.json", "--public-report"]