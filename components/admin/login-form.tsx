"use client";

import { useTransition } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validators";
import type { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(payload.message || "تعذر تسجيل الدخول.");
        }

        toast.success("تم تسجيل الدخول بنجاح.");
        router.replace("/admin");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر تسجيل الدخول.");
      }
    });
  });

  return (
    <div className="surface-panel-strong noise-overlay mx-auto w-full max-w-md rounded-[34px] border border-ajn-gold/16 bg-black/55 p-7 sm:p-9">
      <div className="mb-8 space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-ajn-line bg-white/[0.04] text-ajn-gold">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.24em] text-ajn-goldSoft">AJN LUXURY GROUP</p>
          <h1 className="text-3xl font-bold text-white">لوحة الإدارة</h1>
          <p className="mt-2 text-sm text-ajn-muted">admin / 123456</p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <Input placeholder="اسم المستخدم" {...register("username")} />
          {errors.username ? <p className="mt-2 text-sm text-red-300">{errors.username.message}</p> : null}
        </div>

        <div>
          <Input type="password" placeholder="كلمة المرور" {...register("password")} />
          {errors.password ? <p className="mt-2 text-sm text-red-300">{errors.password.message}</p> : null}
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl" disabled={isPending}>
          <LockKeyhole className="h-4 w-4" />
          {isPending ? "جاري التحقق..." : "دخول"}
        </Button>
      </form>
    </div>
  );
}
