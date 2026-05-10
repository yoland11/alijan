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

## macOS

- لا تفتح `renderer/index.html` يدويًا.
- شغّل التطبيق فقط عبر:

```bash
npm run dev
```

أو من جذر المشروع:

```bash
npm run print-agent:dev
```

- تأكد أن الطابعة مضافة في:
  `System Settings → Printers & Scanners`
- إذا لم تظهر الطابعات داخل التطبيق، افحصها من Terminal:

```bash
lpstat -p -d
```

- إذا لم تظهر هناك أيضًا، أعد تعريف الطابعة داخل النظام.
- إذا احتاجت الصلاحيات:
  `System Settings → Privacy & Security`
