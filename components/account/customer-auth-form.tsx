"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { HomeLinkButton } from "@/components/ui/home-link-button";
import { Input } from "@/components/ui/input";

type CustomerAuthMode = "login" | "register" | "reset";

const MODE_TEXT: Record<CustomerAuthMode, { title: string; submit: string }> = {
  login: { title: "حساب الزبون", submit: "تسجيل الدخول" },
  register: { title: "إنشاء حساب", submit: "إنشاء الحساب" },
  reset: { title: "استعادة الحساب", submit: "تحديث كلمة المرور" },
};

export function CustomerAuthForm({ mode }: { mode: CustomerAuthMode }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    identifier: "",
    password: "",
    confirm_password: "",
  });

  const submit = async () => {
    try {
      setSubmitting(true);
      const endpoint =
        mode === "login"
          ? "/api/account/login"
          : mode === "register"
            ? "/api/account/register"
            : "/api/account/reset-password";
      const payload =
        mode === "login"
          ? {
              identifier: form.identifier,
              password: form.password,
            }
          : mode === "register"
            ? {
                full_name: form.full_name,
                email: form.email,
                phone: form.phone,
                password: form.password,
              }
            : {
                email: form.email,
                phone: form.phone,
                password: form.password,
                confirm_password: form.confirm_password,
              };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "تعذر تنفيذ الطلب.");
      }

      toast.success(result.message || "تمت العملية.");
      router.push(mode === "reset" ? "/account/login" : "/account");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تنفيذ الطلب.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell pb-24 pt-8 sm:pt-12">
      <div className="section-shell space-y-6">
        <HomeLinkButton />

        <AnimatedServicePanel className="surface-panel-strong noise-overlay mx-auto max-w-xl p-6 sm:p-8">
          <div className="mb-6 space-y-2 text-center">
            <h1 className="text-3xl font-bold text-white">{MODE_TEXT[mode].title}</h1>
          </div>

          <div className="space-y-4">
            {mode === "register" ? (
              <Input
                placeholder="الاسم الكامل"
                value={form.full_name}
                onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              />
            ) : null}

            {mode === "login" ? (
              <Input
                placeholder="البريد أو رقم الهاتف"
                value={form.identifier}
                onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
              />
            ) : (
              <>
                <Input
                  placeholder="البريد الإلكتروني"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
                <Input
                  placeholder="رقم الهاتف"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </>
            )}

            <Input
              type="password"
              placeholder="كلمة المرور"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />

            {mode === "reset" ? (
              <Input
                type="password"
                placeholder="تأكيد كلمة المرور"
                value={form.confirm_password}
                onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))}
              />
            ) : null}

            <Button className="w-full" onClick={submit} disabled={submitting}>
              {submitting ? "جاري الإرسال..." : MODE_TEXT[mode].submit}
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-ajn-muted">
            {mode !== "login" ? <Link href="/account/login">تسجيل الدخول</Link> : null}
            {mode !== "register" ? <Link href="/account/register">إنشاء حساب</Link> : null}
            {mode !== "reset" ? <Link href="/account/reset-password">نسيت كلمة المرور</Link> : null}
          </div>
        </AnimatedServicePanel>
      </div>
    </div>
  );
}
