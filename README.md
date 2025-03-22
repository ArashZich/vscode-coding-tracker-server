# ردیابی کدنویسی Visual Studio Code

افزونه‌ای برای VSCode که فعالیت‌های کدنویسی شما را ردیابی و گزارش‌هایی از فعالیت کدنویسی شما تولید می‌کند. با این افزونه می‌توانید بفهمید چه مدت زمانی را روی هر پروژه/فایل/کامپیوتر/زبان/شاخه و در کل صرف کرده‌اید.

زبان‌های پشتیبانی شده: انگلیسی، روسی (русский)، اسپانیایی (Español)، چینی ساده‌شده (简体中文) و چینی سنتی (繁體中文).

تمام بخش‌های این افزونه (شامل برنامه سرور، مستندات) متن‌باز هستند و در گیت‌هاب میزبانی می‌شوند.

## لینک‌ها:
- [مخزن برنامه سرور در گیت‌هاب](https://github.com/ArashZich/vscode-coding-tracker-server)
- [افزونه در فروشگاه VSCode](https://marketplace.visualstudio.com/items?itemName=hangxingliu.vscode-coding-tracker)

## نسخه فعلی
**0.7.0 (نسخه بعدی)**
- رفع مشکل راه‌اندازی سرور محلی برای کاربرانی که Node.js را نصب نکرده‌اند یا nvm نصب کرده‌اند.

**0.6.0 (2018/03/25)**
- ارتقای برنامه سرور (صفحه گزارش) به نسخه 0.6.0
- صدور/دانلود گزارش به فرمت CSV
- ادغام گزارش‌ها از پروژه‌های مختلف
- رفع برخی باگ‌ها در صفحه گزارش
- سازگاری بیشتر با مرورگرهای قدیمی و موبایل
- بهینه‌سازی برای برخی اسناد داخلی vscode (تنظیمات پیش‌فرض، پیش‌نمایش مارکداون، محیط تعاملی)
- افزودن ترجمه اسپانیایی به افزونه.

برای اطلاعات بیشتر در مورد نسخه‌ها: [CHANGELOG.md](CHANGELOG.md)

## نحوه استفاده (روش ساده و معمول)
مناسب برای افرادی که نمی‌خواهند متن طولانی زیر را بخوانند و فقط از VSCode در یک کامپیوتر استفاده می‌کنند.

1. این افزونه را نصب کنید.
2. همانند قبل به کدنویسی بپردازید.
3. گزارش کدنویسی خود را با دستور `CodingTracker: Show your coding activities report` مشاهده کنید.
   - کلید F1 را فشار دهید تا پنل دستورات VSCode باز شود، سپس دستور بالا را جستجو و روی آن کلیک کنید.

## نحوه استفاده (راهنمای کامل)

ردیابی کدنویسی VSCode در واقع دو بخش دارد: افزونه و سرور (C/S)

افزونه به طور پیش‌فرض از سرور داخلی نصب شده در node_modules استفاده می‌کند.

اما می‌توانید یک برنامه سرور را روی سرور خود نصب کنید و از آن در VSCode روی کامپیوترهای مختلف استفاده کنید.

مخزن برنامه سرور: [vscode-coding-tracker-server](https://github.com/ArashZich/vscode-coding-tracker-server)

### گام 1: نصب افزونه در VSCode
در پنل افزونه‌های VSCode، `vscode-coding-tracker` را جستجو و آن را نصب کنید.

### گام 2: نصب و راه‌اندازی سرور ردیابی در سرور راه دور یا محلی

#### استفاده از داکر (روش پیشنهادی)

این روش ساده‌ترین راه برای راه‌اندازی سرور است و نیازی به نصب Node.js ندارد:

1. **کلون کردن مخزن**:
```bash
git clone https://github.com/YOUR_USERNAME/vscode-coding-tracker-server.git
cd vscode-coding-tracker-server
```

2. **ایجاد Dockerfile**:
```bash
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
```

3. **ایجاد docker-compose.yml**:
```bash
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
```

4. **ایجاد توکن ادمین**:
```bash
openssl rand -base64 64
```

5. **ایجاد فایل توکن**:
```bash
mkdir -p tokens
cat > tokens/token.json << EOF
{
  "adminToken": [{
    "token": "YOUR_ADMIN_TOKEN"
  }],
  "viewReportToken": "public",
  "uploadToken": []
}
EOF
```

6. **ساخت و راه‌اندازی کانتینر**:
```bash
docker-compose up -d --build
```

#### راه‌اندازی در کامپیوتر محلی (کنترل شده توسط VSCode)
نیازی به انجام کاری ندارید (و تنظیمات `codingTracker.localServerMode` را به false تغییر ندهید).

در این حالت، فایل‌های پایگاه داده در `$HOME/.coding-tracker/` قرار دارند.

#### راه‌اندازی در کامپیوتر محلی (کنترل شده توسط خودتان)
1. تنظیمات vscode خود را `codingTracker.localServerMode` به false تغییر دهید.
2. یک ترمینال/خط فرمان باز کنید.
3. مسیر را به `%HOME%/.vscode/extensions/hangxingliu.vscode-coding-tracker-0.6.0` تغییر دهید.
   - در ویندوز، دستور: `cd %HOME%/.vscode/extensions/hangxingliu.vscode-coding-tracker-0.6.0`
   - در لینوکس/مک، دستور: `cd $HOME/.vscode/extensions/hangxingliu.vscode-coding-tracker-0.6.0`
4. `npm i` را اجرا کنید.
5. سرور ردیابی را با استفاده از دستور: `npm start -- -t ${REPLACE_TO_YOUR_TOKEN}` راه‌اندازی کنید.
   - مثلاً `npm start -- -t test_token`، به این معنی که توکن آپلود شما test_token است.
   - می‌توانید تنظیمات و توضیحات بیشتری را با استفاده از دستور `npm start -- --help` دریافت کنید.
   - مراقب باشید! لازم است `--` را بعد از `npm start` اضافه کنید تا آرگومان‌های بعدی به سرور ردیابی منتقل شوند.
   - داده‌های ردیابی شما به طور پیش‌فرض در پوشه `./database` قرار می‌گیرند.

#### راه‌اندازی در سرور راه دور
1. تنظیمات vscode خود را `codingTracker.localServerMode` به false تغییر دهید.
2. وارد سرور راه دور خود شوید.
3. مطمئن شوید که محیط‌های node و npm نصب شده‌اند.
4. دستور `npm i vscode-coding-tracker-server` را وارد کنید (نصب جهانی: `-g` را به دستور اضافه کنید).
5. سرور ردیابی را با استفاده از دستور: `npm start -- -t ${REPLACE_TO_YOUR_TOKEN}` راه‌اندازی کنید.
   - داده‌های ردیابی شما به طور پیش‌فرض در پوشه `./database` قرار می‌گیرند.

### گام 3: پیکربندی توکن آپلود و آدرس سرور در VSCode
تنظیمات:

- `codingTracker.serverURL` (مانند `"http://localhost:10345"` تنظیم کنید)
  - اگر از سرور ردیابی محلی با تنظیمات پیش‌فرض استفاده می‌کنید، می‌توانید این تنظیمات را نادیده بگیرید.
  - زیرا مقدار پیش‌فرض این تنظیمات `http://localhost:10345` است.
- `codingTracker.uploadToken` (مانند `"123456"` تنظیم کنید)
  - این مقدار را مشابه توکنی که با آن سرور خود را راه‌اندازی کرده‌اید، تنظیم کنید.
- `codingTracker.computerId` (نام این کامپیوتر را تنظیم کنید تا به راحتی بفهمید در کدام کامپیوتر زمان بیشتری کدنویسی کرده‌اید)
  - (تنظیم اختیاری)
- `codingTracker.localServerMode` (پیش‌فرض `true` است). لطفاً به بالا مراجعه کنید.
- `codingTracker.moreThinkingTime` (پیش‌فرض `0` است). زمان تفکر بیشتر برای ردیابی.
  - این تنظیم برای افرادی است که به زمان تفکر بیشتری در فعالیت کدنویسی نیاز دارند.
  - هرچه مقدار بزرگ‌تری تنظیم کنید، زمان طولانی‌تری در گزارش زمان دریافت می‌کنید.
  - توصیه نمی‌کنم این مقدار را بزرگ‌تر تنظیم کنید، زیرا معتقدم زمان تفکر پیش‌فرض در افزونه با توجه به استفاده من مناسب است.

### گام 4: مشاهده گزارش خود

پنل دستورات را در VSCode خود باز کنید. سپس دستور `CodingTracker: Show your coding activities report` را جستجو و روی آن کلیک کنید.

یا، فقط مرورگر را باز کنید و آدرس `http://${YOUR_SERVER_HOST_NAME}:${PORT}/report/?token=${API_TOKEN}` را وارد کنید.

- مثلاً `http://127.0.0.1:10345/report/`
- مثلاً `http://mydomain.com:10345/report/?token=myUploadToken`

### دستورات بیشتر:
- `codingTracker.startLocalServer`
- `codingTracker.stopLocalServer`
- `codingTracker.showReport`

## مدیریت کاربران در سرور داکری

### افزودن کاربر جدید

برای هر کاربر جدید، یک توکن بسازید:

```bash
openssl rand -base64 64
```

سپس فایل `tokens/token.json` را ویرایش کنید و کاربر جدید را به بخش `uploadToken` اضافه کنید:

```json
{
  "adminToken": [{
    "token": "YOUR_ADMIN_TOKEN"
  }],
  "viewReportToken": "public",
  "uploadToken": [
    {
      "remark": "کاربر اول",
      "token": "TOKEN_FOR_USER1",
      "computerId": ["PC-User1", "Laptop-User1"]
    },
    {
      "remark": "کاربر دوم",
      "token": "TOKEN_FOR_USER2",
      "computerId": ["Desktop-User2"]
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

برای کاربر اول در دستگاه PC:
```json
"codingTracker.serverURL": "http://YOUR_SERVER_IP:10345/",
"codingTracker.uploadToken": "TOKEN_FOR_USER1",
"codingTracker.computerId": "PC-User1"
```

برای کاربر اول در دستگاه لپ‌تاپ:
```json
"codingTracker.serverURL": "http://YOUR_SERVER_IP:10345/",
"codingTracker.uploadToken": "TOKEN_FOR_USER1",
"codingTracker.computerId": "Laptop-User1"
```

برای کاربر دوم:
```json
"codingTracker.serverURL": "http://YOUR_SERVER_IP:10345/",
"codingTracker.uploadToken": "TOKEN_FOR_USER2",
"codingTracker.computerId": "Desktop-User2"
```

توجه کنید که هر کاربر می‌تواند چندین دستگاه داشته باشد و `computerId` به صورت آرایه‌ای از شناسه‌های مجاز تعریف می‌شود.

## عیب‌یابی

اگر با مشکلی مواجه شدید، می‌توانید لاگ‌های کانتینر را بررسی کنید:

```bash
docker-compose logs -f
```

برای راه‌اندازی مجدد سرور:

```bash
docker-compose restart
```

برای توقف کامل سرور:

```bash
docker-compose down
```

برای بازسازی و راه‌اندازی مجدد:

```bash
docker-compose up -d --build
```

## مشارکت‌کنندگان
- LiuYue (hangxingliu)
- Ted Piotrowski (@ted-piotrowski)
- Dolgishev Viktor (@vdolgishev)

## لایسنس
- افزونه (به استثنای آیکون و کدهای شخص ثالث) و اسکریپت‌های سرور تحت مجوز GPL-3.0 هستند.
- آیکون افزونه تحت مجوز CC-BY 4.0 است.
- اطلاعات مجوز کدهای شخص ثالث در ابتدای فایل‌های کد شخص ثالث آمده است.