"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      className={cn(className)}
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
