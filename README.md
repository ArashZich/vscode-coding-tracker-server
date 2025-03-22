# سرور ردیابی کدنویسی Visual Studio Code

سرور برای افزونه ردیابی کدنویسی VS Code که فعالیت‌های کدنویسی شما را ثبت و تحلیل می‌کند.

> لینک‌های مرتبط:  
> [مخزن گیتهاب افزونه](https://github.com/ArashZich/vscode-coding-tracker-server)   
> [افزونه در فروشگاه VSCode](https://marketplace.visualstudio.com/items?itemName=hangxingliu.vscode-coding-tracker)   

## پیش‌نمایش

![screenshots_2](screenshots/2.jpg)

## دستورالعمل نصب و راه‌اندازی کامل

### پیش‌نیازها

- Docker
- Docker Compose

### 1. کلون کردن مخزن

```bash
git clone https://github.com/YOUR_USERNAME/vscode-coding-tracker-server.git
cd vscode-coding-tracker-server
```

### 2. ایجاد Dockerfile

فایل `Dockerfile` را با محتوای زیر ایجاد کنید:

```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY . .
RUN npm install
VOLUME /app/database
VOLUME /app/tokens
EXPOSE 10345

CMD ["node", "app.js", "--output=/app/database", "--token-file=/app/tokens/token.json", "--public-report"]
```

### 3. ایجاد docker-compose.yml

فایل `docker-compose.yml` را با محتوای زیر ایجاد کنید:

```yaml
version: '3'

services:
  coding-tracker:
    build: .
    restart: always
    ports:
      - "10345:10345"
    volumes:
      - ./database:/app/database
      - ./tokens:/app/tokens
```

### 4. ایجاد توکن ادمین

توکن ادمین را با دستور زیر تولید کنید:

```bash
openssl rand -base64 64
```

نمونه خروجی:
```
fQ8gBKVfo+HB0IMafzuONtPEaFRglBuiTweN1mqcnJ76qLydHMSeCeTkTHauPqW/+WD2LFcncdUYuyDnvgwVvQ==
```

### 5. ایجاد فایل توکن

پوشه `tokens` را ایجاد کنید و فایل `token.json` را درون آن قرار دهید:

```bash
mkdir -p tokens
```

فایل `tokens/token.json` را با محتوای زیر ایجاد کنید (توکن خود را جایگزین کنید):

```json
{
  "adminToken": [{
    "token": "fQ8gBKVfo+HB0IMafzuONtPEaFRglBuiTweN1mqcnJ76qLydHMSeCeTkTHauPqW/+WD2LFcncdUYuyDnvgwVvQ=="
  }],
  "viewReportToken": "public",
  "uploadToken": []
}
```

### 6. ساخت و راه‌اندازی کانتینر

```bash
docker-compose up -d --build
```

پس از اجرای دستور بالا، سرور روی پورت 10345 در دسترس خواهد بود.

## مدیریت کاربران

### افزودن کاربر جدید

برای هر کاربر جدید، یک توکن بسازید:

```bash
openssl rand -base64 64
```

سپس فایل `tokens/token.json` را ویرایش کنید و کاربر جدید را به بخش `uploadToken` اضافه کنید:

```json
{
  "adminToken": [{
    "token": "fQ8gBKVfo+HB0IMafzuONtPEaFRglBuiTweN1mqcnJ76qLydHMSeCeTkTHauPqW/+WD2LFcncdUYuyDnvgwVvQ=="
  }],
  "viewReportToken": "public",
  "uploadToken": [
    {
      "remark": "کاربر اول",
      "token": "tJo9N7Nob96J+N2DXdqAzKUNxMnKsB+D3vZ6xZ+ozWY81cqrGJVuF4kqpvv/wiI7zR4ztaazFkJgkOtfIctEmA==",
      "computerId": ["PC-User1"]
    },
    {
      "remark": "کاربر دوم",
      "token": "m5B4oTR5C2PXklqEPN+ekMWE0W9FXEgQkXKVB4z8G0VMjZTLsXqhZ3RN5v+FGPkBI+zvP0I5AxQP84JMpP/k9Q==",
      "computerId": ["Laptop-User2"]
    }
  ]
}
```

پس از ویرایش فایل، کانتینر را راه‌اندازی مجدد کنید:

```bash
docker-compose restart
```

### حذف کاربر

برای حذف کاربر، کافی است بخش مربوط به آن کاربر را از آرایه `uploadToken` در فایل `tokens/token.json` حذف کنید و کانتینر را راه‌اندازی مجدد کنید.

## تنظیمات VSCode برای کاربران

هر کاربر باید افزونه [VSCode Coding Tracker](https://marketplace.visualstudio.com/items?itemName=hangxingliu.vscode-coding-tracker) را نصب کند و سپس تنظیمات زیر را در VSCode خود اضافه کند:

برای کاربر اول:
```json
"codingTracker.serverURL": "http://YOUR_SERVER_IP:10345/",
"codingTracker.uploadToken": "tJo9N7Nob96J+N2DXdqAzKUNxMnKsB+D3vZ6xZ+ozWY81cqrGJVuF4kqpvv/wiI7zR4ztaazFkJgkOtfIctEmA==",
"codingTracker.computerId": "PC-User1"
```

برای کاربر دوم:
```json
"codingTracker.serverURL": "http://YOUR_SERVER_IP:10345/",
"codingTracker.uploadToken": "m5B4oTR5C2PXklqEPNo3ekMWE0W9FXEgQkXKVB4z8G0VMjZTLsXqhZ3RN5v+FGPkBI+zvP0I5AxQP84JMpP/k9Q==",
"codingTracker.computerId": "Laptop-User2"
```

## دسترسی به گزارش‌ها

گزارش‌ها را می‌توانید در آدرس زیر مشاهده کنید:
```
http://YOUR_SERVER_IP:10345/report
```

## دستورات یکجا برای راه‌اندازی سریع

کد زیر را کپی کرده و در ترمینال اجرا کنید:

```bash
# کلون کردن مخزن (آدرس فورک خود را جایگزین کنید)
git clone https://github.com/YOUR_USERNAME/vscode-coding-tracker-server.git
cd vscode-coding-tracker-server

# ایجاد Dockerfile
cat > Dockerfile << 'EOF'
FROM node:16-alpine

WORKDIR /app
COPY . .
RUN npm install
VOLUME /app/database
VOLUME /app/tokens
EXPOSE 10345

CMD ["node", "app.js", "--output=/app/database", "--token-file=/app/tokens/token.json", "--public-report"]
EOF

# ایجاد docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3'

services:
  coding-tracker:
    build: .
    restart: always
    ports:
      - "10345:10345"
    volumes:
      - ./database:/app/database
      - ./tokens:/app/tokens
EOF

# ساخت توکن ادمین
ADMIN_TOKEN=$(openssl rand -base64 64)
echo "توکن ادمین شما: $ADMIN_TOKEN"

# ایجاد فایل توکن
mkdir -p tokens
cat > tokens/token.json << EOF
{
  "adminToken": [{
    "token": "$ADMIN_TOKEN"
  }],
  "viewReportToken": "public",
  "uploadToken": []
}
EOF

# ساخت و راه‌اندازی کانتینر
docker-compose up -d --build

echo "سرور VSCode Coding Tracker با موفقیت راه‌اندازی شد!"
echo "آدرس گزارش‌ها: http://$(hostname -I | awk '{print $1}'):10345/report"
```

## دستور افزودن کاربر جدید

```bash
# ساخت توکن برای کاربر جدید
USER_TOKEN=$(openssl rand -base64 64)

# اطلاعات کاربر
USER_NAME="نام کاربر"
COMPUTER_ID="شناسه کامپیوتر"

# افزودن کاربر به فایل توکن
cat > /tmp/add_user.js << EOF
const fs = require('fs');
const tokenFile = './tokens/token.json';
const token = fs.readFileSync(tokenFile, 'utf8');
const data = JSON.parse(token);
data.uploadToken.push({
  "remark": "$USER_NAME",
  "token": "$USER_TOKEN",
  "computerId": ["$COMPUTER_ID"]
});
fs.writeFileSync(tokenFile, JSON.stringify(data, null, 2));
console.log('کاربر با موفقیت اضافه شد.');
EOF

node /tmp/add_user.js
rm /tmp/add_user.js

# راه‌اندازی مجدد سرور
docker-compose restart

echo "کاربر جدید با موفقیت اضافه شد!"
echo "-------------------------------------"
echo "نام: $USER_NAME"
echo "شناسه کامپیوتر: $COMPUTER_ID"
echo "توکن: $USER_TOKEN"
echo "-------------------------------------"
echo ""
echo "تنظیمات VSCode:"
echo '"codingTracker.serverURL": "http://YOUR_SERVER_IP:10345/",'
echo '"codingTracker.uploadToken": "'$USER_TOKEN'",'
echo '"codingTracker.computerId": "'$COMPUTER_ID'"'
```

## عیب‌یابی

اگر با مشکلی مواجه شدید، می‌توانید لاگ‌های کانتینر را بررسی کنید:

```bash
docker-compose logs -f
```

برای راه‌اندازی مجدد سرور:

```bash
docker-compose restart
```

## لایسنس

[GPL-3.0](LICENSE)