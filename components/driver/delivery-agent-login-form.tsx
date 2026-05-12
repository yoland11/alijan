"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { HomeLinkButton } from "@/components/ui/home-link-button";
import { Input } from "@/components/ui/input";

export function DeliveryAgentLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/driver/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تسجيل الدخول.");
      }

      toast.success(payload.message || "تم تسجيل الدخول.");
      router.push("/driver");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تسجيل الدخول.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell pb-24 pt-8 sm:pt-12">
      <div className="section-shell space-y-6">
        <HomeLinkButton />

        <AnimatedServicePanel className="surface-panel-strong noise-overlay mx-auto max-w-lg p-6 sm:p-8">
          <div className="mb-6 space-y-2 text-center">
            <h1 className="text-3xl font-bold text-white">لوحة المندوب</h1>
          </div>

          <div className="space-y-4">
            <Input placeholder="اسم المستخدم" value={username} onChange={(event) => setUsername(event.target.value)} />
            <Input type="password" placeholder="كلمة المرور" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Button className="w-full" onClick={submit} disabled={submitting}>
              {submitting ? "جاري الدخول..." : "دخول"}
            </Button>
          </div>
        </AnimatedServicePanel>
      </div>
    </div>
  );
}
