# AJN Booking & Order Tracking System

منصة عربية RTL جاهزة للإنتاج لإدارة حجوزات وطلبات `AJN` مع صفحة تتبع للعميل ولوحة إدارة محمية.

## التقنيات

- Next.js 16 + React 19
- Route Handlers API
- Supabase (Database + Storage + Realtime Broadcast)
- Tailwind CSS
- GSAP
- Zod + React Hook Form + Sonner

## التشغيل السريع

1. انسخ ملف البيئة:

```bash
cp .env.example .env.local
```

2. أنشئ كلمة مرور مشفرة للإدارة:

```bash
node scripts/generate-admin-hash.mjs your-password
```

3. أضف القيم داخل `.env.local`.

4. شغّل SQL الموجود في [supabase/schema.sql](/Users/yoland/Desktop/علي جان /supabase/schema.sql).

5. ثبّت الحزم ثم شغّل التطوير:

```bash
npm install
npm run dev
```

## متغيرات البيئة

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `APP_BASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `AUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH` أو `ADMIN_PASSWORD`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_API_VERSION`

## الميزات المضافة

- إشعارات واتساب تلقائية عند إنشاء الطلب أو تغيير حالته عبر Meta WhatsApp Cloud API.
- أرشفة واسترجاع للطلبات من لوحة الإدارة دون حذفها.
- تصدير CSV للطلبات بحسب الفلاتر الحالية.
- بوابة عميل أوسع تعرض:
  - رسالة مخصصة من AJN
  - تعليمات التسليم أو الاستلام
  - موعد التسليم المتوقع
  - سجل زمني كامل للحالات مع التواريخ
  - روابط نسخ كود الطلب ورابط البوابة

## تفعيل واتساب التلقائي

إذا أردت تشغيل الإشعارات التلقائية فعليًا، أضف:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `APP_BASE_URL` أو `NEXT_PUBLIC_APP_URL`

إذا لم تضفها، سيبقى النظام يعمل بشكل طبيعي لكن بدون إرسال واتساب تلقائي.

## المسارات الأساسية

- `/` الصفحة الرئيسية الفاخرة
- `/track` صفحة تتبع الطلب
- `/admin/login` دخول الإدارة
- `/admin` لوحة الإدارة

## ملاحظات الإنتاج

- CRUD يتم عبر API محمية بكوكي JWT.
- رفع الصور يتم عبر Supabase Storage باستخدام `service role`.
- التحديثات اللحظية تعتمد Supabase Realtime Broadcast مع fallback تلقائي عبر إعادة الجلب بعد العمليات.
- التصدير الحالي بصيغة `CSV` ويدعم النص العربي مع BOM لفتح مباشر في Excel.
- الأرشفة تحفظ الطلب داخل النظام وتخرجه من العرض النشط بدل حذفه.
- النظام يعمل بالكامل `RTL` مع رسائل وتجربة عربية.
