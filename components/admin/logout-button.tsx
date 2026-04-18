"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await fetch("/api/auth/logout", { method: "POST" });
            toast.success("تم تسجيل الخروج.");
            router.replace("/admin/login");
            router.refresh();
          } catch {
            toast.error("تعذر تسجيل الخروج.");
          }
        });
      }}
    >
      <LogOut className="h-4 w-4" />
      تسجيل الخروج
    </Button>
  );
}

