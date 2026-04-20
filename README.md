# AJN Booking & Order Tracking System

تطبيق `Next.js` عربي RTL جاهز للإنتاج مع:

- لوحة إدارة موجودة حاليًا على الويب ويمكن تشغيلها أيضًا كتطبيق Windows عبر Electron
- صفحة تتبع عملاء عامة على الويب
- قاعدة بيانات ووسائط عبر Supabase

## ما الذي تغيّر

- تم الحفاظ على الكود الحالي والـ Supabase والـ APIs والـ RTL UI بدون إعادة بناء المشروع.
- تمت إضافة غلاف `Electron` للوحة الإدارة الحالية بدل إعادة كتابة الواجهة.
- تمت إضافة دعم روابط مباشرة مثل:

```text
/track?code=AJN-1234
```

## تقنيات المشروع

- Next.js 16 + React 19
- Supabase
- Tailwind CSS
- GSAP
- Electron Forge لصناعة نسخة Windows `.exe`

## متغيرات البيئة

انسخ:

```bash
cp .env.example .env.local
```

وأضف:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `AUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH` أو `ADMIN_PASSWORD`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_APP_URL`
- `APP_BASE_URL`

`APP_BASE_URL` و`NEXT_PUBLIC_APP_URL` يجب أن يشيرا إلى الرابط العام المنشور للموقع مثل:

```env
APP_BASE_URL=https://your-live-site.example.com
NEXT_PUBLIC_APP_URL=https://your-live-site.example.com
```

## التطوير المحلي

```bash
npm install
npm run dev
```

الموقع العام محليًا:

- `http://localhost:3000/track`
- `http://localhost:3000/track?code=AJN-1234`

## تشغيل لوحة الإدارة كتطبيق Electron أثناء التطوير

```bash
npm run desktop:dev
```

هذا يشغّل Next محليًا ثم يفتح نافذة Electron على:

- `/admin/login`

## بناء نسخة Windows `.exe`

1. تأكد أن الموقع منشور فعلًا على رابط عام.
2. تأكد أن `APP_BASE_URL` أو `ELECTRON_ADMIN_URL` مضبوط.
3. إذا كنت تبني على جهاز Windows نفّذ:

```bash
npm run desktop:make:win
```

الملفات الناتجة ستظهر داخل مجلد `out/` عبر Electron Forge، وتتضمن مثبت Windows بصيغة `.exe`.

إذا كنت تعمل من macOS أو Linux، استخدم GitHub Actions workflow الجاهز في:

[.github/workflows/production-release.yml](/Users/yoland/Desktop/علي%20جان%20/.github/workflows/production-release.yml)

هذا الـ workflow يقوم بأمرين:

- نشر الموقع العام على Vercel
- بناء نسخة Windows `.exe` على `windows-latest` ورفعها كـ artifact

## نشر الموقع العام

الافتراض الافتراضي هنا هو Vercel لأن المشروع Next.js ويحتوي API routes.

بعد تسجيل الدخول إلى Vercel:

```bash
npm run deploy:web
```

أو:

```bash
npx vercel --prod
```

أو استخدم GitHub Actions بعد إضافة هذه الأسرار إلى المستودع:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `AUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_PASSWORD` إذا كنت لا تستخدم الـ hash في بيئة البناء
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_APP_URL`
- `APP_BASE_URL`
- `ELECTRON_ADMIN_URL` اختياري إذا أردت أن تشير نسخة Electron إلى مسار مختلف عن `/admin/login`

## Supabase

شغّل SQL الموجود في:

[supabase/schema.sql](/Users/yoland/Desktop/علي%20جان%20/supabase/schema.sql)

## التحقق

```bash
npm run lint
npm run build
```

## ملاحظات إنتاجية

- تطبيق Electron يفتح لوحة الإدارة المنشورة من نفس الكود الحالي، لذلك تبقى مفاتيح الخادم الحساسة على السيرفر وليس داخل `.exe`.
- صفحة التتبع العامة تدعم الآن `?code=` و`?q=` و`?query=` معًا.
- كل منطق الطلبات الحالي والـ APIs الحالية بقي كما هو.
