"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, Plus, Repeat2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { InventoryItemRecord } from "@/lib/operations-types";
import { formatAmountWithCurrency } from "@/lib/utils";

const emptyItem = {
  name: "",
  category: "",
  unit: "قطعة",
  quantity: 0,
  min_quantity: 0,
  purchase_price: 0,
  sale_price: 0,
  notes: "",
  is_active: true,
};

type InventoryFormState = typeof emptyItem;

export function InventoryManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<InventoryFormState>(emptyItem);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [movementValues, setMovementValues] = useState<Record<string, { movement_type: string; quantity: string; unit_cost: string; note: string }>>({});

  const load = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ops/inventory", { cache: "no-store" });
      const payload = (await response.json()) as { message?: string; items?: InventoryItemRecord[] };
      if (!response.ok) throw new Error(payload.message || "تعذر تحميل المخزون.");
      setItems(payload.items ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل المخزون.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => [item.name, item.category, item.notes].join(" ").toLowerCase().includes(term));
  }, [items, search]);

  const resetForm = () => {
    setForm(emptyItem);
    setEditingId(null);
  };

  const saveItem = async () => {
    try {
      setSaving(true);
      const endpoint = editingId ? `/api/admin/ops/inventory/${editingId}` : "/api/admin/ops/inventory";
      const method = editingId ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "تعذر حفظ المادة.");
      toast.success(editingId ? "تم تحديث المادة." : "تمت إضافة المادة.");
      resetForm();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ المادة.");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm("حذف المادة وسجل حركتها؟")) return;
    try {
      const response = await fetch(`/api/admin/ops/inventory/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "تعذر حذف المادة.");
      toast.success("تم حذف المادة.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف المادة.");
    }
  };

  const submitMovement = async (itemId: string) => {
    const value = movementValues[itemId] ?? { movement_type: "purchase", quantity: "", unit_cost: "", note: "" };
    try {
      const response = await fetch("/api/admin/ops/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "movement",
          payload: {
            item_id: itemId,
            movement_type: value.movement_type,
            quantity: value.quantity,
            unit_cost: value.unit_cost,
            note: value.note,
          },
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "تعذر تسجيل الحركة.");
      toast.success("تم تسجيل الحركة.");
      setMovementValues((current) => ({ ...current, [itemId]: { movement_type: "purchase", quantity: "", unit_cost: "", note: "" } }));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تسجيل الحركة.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-panel p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">المخزون والمواد</h2>
            <p className="mt-1 text-sm text-ajn-muted">إدارة المواد، الأسعار، والتنبيهات</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث" />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/8 bg-black/20 p-4 sm:p-5">
            <h3 className="mb-4 text-lg font-bold text-white">{editingId ? "تعديل مادة" : "إضافة مادة"}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="اسم المادة" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              <Input placeholder="التصنيف" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
              <Input placeholder="الوحدة" value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} />
              <Input placeholder="الكمية" value={String(form.quantity)} onChange={(e) => setForm((s) => ({ ...s, quantity: Number(e.target.value || 0) }))} />
              <Input placeholder="حد التنبيه" value={String(form.min_quantity)} onChange={(e) => setForm((s) => ({ ...s, min_quantity: Number(e.target.value || 0) }))} />
              <Input placeholder="سعر الشراء" value={String(form.purchase_price)} onChange={(e) => setForm((s) => ({ ...s, purchase_price: Number(e.target.value || 0) }))} />
              <Input placeholder="سعر البيع" value={String(form.sale_price)} onChange={(e) => setForm((s) => ({ ...s, sale_price: Number(e.target.value || 0) }))} />
              <Select value={form.is_active ? "active" : "inactive"} onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.value === "active" }))}>
                <option value="active">نشطة</option>
                <option value="inactive">مخفية</option>
              </Select>
              <div className="md:col-span-2">
                <Input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={saveItem} disabled={saving}>
                <Plus className="h-4 w-4" />
                {editingId ? "حفظ التعديل" : "إضافة مادة"}
              </Button>
              {editingId ? (
                <Button variant="secondary" onClick={resetForm}>
                  إلغاء
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => <div key={index} className="shimmer-skeleton h-44 rounded-[28px]" />)
            ) : (
              filtered.map((item) => {
                const low = item.quantity <= item.min_quantity;
                const movement = movementValues[item.id] ?? { movement_type: "purchase", quantity: "", unit_cost: "", note: "" };
                return (
                  <div key={item.id} className="rounded-[28px] border border-white/8 bg-black/20 p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{item.name}</h3>
                          {low ? <AlertTriangle className="h-4.5 w-4.5 text-amber-300" /> : null}
                        </div>
                        <p className="mt-1 text-sm text-ajn-muted">{item.category || item.unit}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="px-3"
                          onClick={() => {
                            setEditingId(item.id);
                            setForm({
                              name: item.name,
                              category: item.category,
                              unit: item.unit,
                              quantity: item.quantity,
                              min_quantity: item.min_quantity,
                              purchase_price: item.purchase_price,
                              sale_price: item.sale_price,
                              notes: item.notes,
                              is_active: item.is_active,
                            });
                          }}
                        >
                          تعديل
                        </Button>
                        <Button variant="danger" className="px-3" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-4 grid gap-3 sm:grid-cols-4">
                      <MiniInfo label="الكمية" value={`${item.quantity} ${item.unit}`} />
                      <MiniInfo label="التنبيه" value={`${item.min_quantity} ${item.unit}`} />
                      <MiniInfo label="شراء" value={formatAmountWithCurrency(item.purchase_price)} />
                      <MiniInfo label="بيع" value={formatAmountWithCurrency(item.sale_price)} />
                    </div>

                    <div className="rounded-[22px] border border-white/8 bg-black/25 p-3">
                      <div className="mb-3 flex items-center gap-2">
                        <Repeat2 className="h-4.5 w-4.5 text-ajn-gold" />
                        <p className="text-sm font-semibold text-white">حركة المادة</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <Select value={movement.movement_type} onChange={(e) => setMovementValues((s) => ({ ...s, [item.id]: { ...movement, movement_type: e.target.value } }))}>
                          <option value="purchase">شراء</option>
                          <option value="sale">بيع</option>
                          <option value="restock">إرجاع</option>
                          <option value="booking_use">استخدام خدمة</option>
                          <option value="adjustment">تسوية</option>
                        </Select>
                        <Input placeholder="الكمية" value={movement.quantity} onChange={(e) => setMovementValues((s) => ({ ...s, [item.id]: { ...movement, quantity: e.target.value } }))} />
                        <Input placeholder="سعر الوحدة" value={movement.unit_cost} onChange={(e) => setMovementValues((s) => ({ ...s, [item.id]: { ...movement, unit_cost: e.target.value } }))} />
                        <Input placeholder="ملاحظة" value={movement.note} onChange={(e) => setMovementValues((s) => ({ ...s, [item.id]: { ...movement, note: e.target.value } }))} />
                      </div>
                      <div className="mt-3">
                        <Button variant="secondary" onClick={() => submitMovement(item.id)}>
                          تسجيل الحركة
                        </Button>
                      </div>
                    </div>

                    {item.movements.length ? (
                      <div className="mt-4 space-y-2">
                        {item.movements.map((row) => (
                          <div key={row.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-white/6 bg-black/25 px-3 py-2 text-sm">
                            <span className="text-white">{row.movement_type}</span>
                            <span className="text-ajn-gold">{row.quantity}</span>
                            <span className="text-ajn-muted">{row.created_at.slice(0, 10)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-black/25 px-3 py-3">
      <p className="text-xs text-ajn-goldSoft">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
