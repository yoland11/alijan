"use client";

import { Save, Trash2, Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DeliveryAgentRecord } from "@/lib/shop-types";

const defaultForm = {
  id: "",
  name: "",
  phone: "",
  username: "",
  password: "",
  is_active: true,
};

export function DeliveryAgentsManager() {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<DeliveryAgentRecord[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/shop/drivers", { cache: "no-store" });
      const payload = (await response.json()) as { message?: string; drivers?: DeliveryAgentRecord[] };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر تحميل المندوبين.");
      }

      setDrivers(payload.drivers ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل المندوبين.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDrivers();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadDrivers]);

  const submit = async () => {
    try {
      setSaving(true);
      const endpoint = form.id ? `/api/admin/shop/drivers/${form.id}` : "/api/admin/shop/drivers";
      const method = form.id ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as {
        message?: string;
        generatedPassword?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حفظ المندوب.");
      }

      if (payload.generatedPassword) {
        toast.success(`تم إنشاء المندوب. كلمة المرور: ${payload.generatedPassword}`);
      } else {
        toast.success(payload.message || "تم حفظ المندوب.");
      }

      setForm(defaultForm);
      await loadDrivers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ المندوب.");
    } finally {
      setSaving(false);
    }
  };

  const removeDriver = async (driverId: string) => {
    if (!window.confirm("هل تريد حذف المندوب؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shop/drivers/${driverId}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر حذف المندوب.");
      }

      toast.success(payload.message || "تم حذف المندوب.");
      await loadDrivers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف المندوب.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="surface-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Truck className="h-5 w-5 text-ajn-gold" />
          <h2 className="text-xl font-bold text-white">إضافة مندوب</h2>
        </div>
        <div className="space-y-4">
          <Input placeholder="الاسم" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Input placeholder="رقم الهاتف" value={form.phone} inputMode="numeric" pattern="[0-9]*" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <Input placeholder="اسم المستخدم" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} />
          <Input placeholder="كلمة المرور" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <label className="flex items-center gap-3 text-sm text-white">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
            مفعّل
          </label>
          <Button className="w-full" onClick={submit} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "جاري الحفظ..." : form.id ? "تحديث" : "إضافة"}
          </Button>
        </div>
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <h2 className="mb-4 text-xl font-bold text-white">المندوبون</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="shimmer-skeleton h-24 rounded-[24px]" />
            ))}
          </div>
        ) : !drivers.length ? (
          <div className="luxury-empty">لا يوجد مندوبون.</div>
        ) : (
          <div className="space-y-4">
            {drivers.map((driver) => (
              <div key={driver.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-white">{driver.name}</p>
                  <span className="rounded-full border border-ajn-gold/25 bg-ajn-gold/[0.08] px-3 py-1 text-xs font-semibold text-ajn-gold">
                    {driver.is_active ? "مفعّل" : "موقوف"}
                  </span>
                </div>
                <p className="text-sm text-ajn-muted">{driver.phone}</p>
                <p className="mt-1 text-sm text-ajn-muted">{driver.username}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="h-10 px-4 text-xs"
                    onClick={() =>
                      setForm({
                        id: driver.id,
                        name: driver.name,
                        phone: driver.phone,
                        username: driver.username,
                        password: "",
                        is_active: driver.is_active,
                      })
                    }
                  >
                    تعديل
                  </Button>
                  <Button variant="danger" className="h-10 px-4 text-xs" onClick={() => void removeDriver(driver.id)}>
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
