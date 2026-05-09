# AJN Print Agent

تطبيق Electron محلي لالتقاط طلبات متجر AJN الجديدة من Supabase وطباعتها تلقائياً على طابعة المحل.

## التشغيل

```bash
npm install
npm run dev
```

أو من جذر المشروع:

```bash
npm run print-agent:dev
```

## الإعداد

من داخل التطبيق أضف:

- `Supabase URL`
- `Service Role Key`
- نوع الفاتورة
- عدد النسخ
- اسم الطابعة إن لزم
- رابط لوحة الإدارة

مهم: `Service Role Key` يبقى داخل هذا التطبيق المحلي فقط، ولا يتم وضعه داخل الموقع.
