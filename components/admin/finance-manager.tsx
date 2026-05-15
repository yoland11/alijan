"use client";

import { useEffect, useState } from "react";
import { ReceiptText, Trash2, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FinanceSnapshotRecord } from "@/lib/operations-types";
import { formatAmountWithCurrency, formatDateTime } from "@/lib/utils";

const emptyForm = {
  entry_type: "sale_invoice",
  amount: "",
  direction: "in",
  reference_code: "",
  source: "",
  customer_name: "",
  customer_phone: "",
  notes: "",
  happened_at: "",
};

export function FinanceManager() {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<FinanceSnapshotRecord | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ops/finance", { cache: "no-store" });
      const payload = (await response.json()) as { message?: string; snapshot?: FinanceSnapshotRecord };
      if (!response.ok) throw new Error(payload.message || "تعذر تحميل الحسابات.");
      setSnapshot(payload.snapshot ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل الحسابات.");
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

  const createTransaction = async () => {
    try {
      const response = await fetch("/api/admin/ops/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "تعذر حفظ الحركة.");
      toast.success("تم حفظ الحركة المالية.");
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الحركة.");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!window.confirm("حذف الحركة المالية؟")) return;
    try {
      const response = await fetch(`/api/admin/ops/transactions/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "تعذر حذف الحركة.");
      toast.success("تم حذف الحركة.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الحركة.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-panel p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-white">الحسابات والصندوق</h2>
          <p className="mt-1 text-sm text-ajn-muted">إيرادات، مصروفات، وسندات مالية</p>
        </div>

        {loading || !snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="shimmer-skeleton h-28 rounded-[26px]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <FinanceCard title="داخل اليوم" value={formatAmountWithCurrency(snapshot.cashInToday)} />
              <FinanceCard title="خارج اليوم" value={formatAmountWithCurrency(snapshot.cashOutToday)} />
              <FinanceCard title="داخل الشهر" value={formatAmountWithCurrency(snapshot.cashInMonth)} />
              <FinanceCard title="الرصيد" value={formatAmountWithCurrency(snapshot.currentBalance)} />
              <FinanceCard title="ديون العملاء" value={formatAmountWithCurrency(snapshot.customerDebts)} />
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[28px] border border-white/8 bg-black/20 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <WalletCards className="h-5 w-5 text-ajn-gold" />
                  <h3 className="text-lg font-bold text-white">إضافة حركة</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select value={form.entry_type} onChange={(e) => setForm((s) => ({ ...s, entry_type: e.target.value }))}>
                    <option value="sale_invoice">فاتورة بيع</option>
                    <option value="purchase_invoice">فاتورة شراء</option>
                    <option value="receipt_voucher">سند قبض</option>
                    <option value="payment_voucher">سند صرف</option>
                    <option value="expense">مصروف</option>
                    <option value="income">إيراد</option>
                  </Select>
                  <Select value={form.direction} onChange={(e) => setForm((s) => ({ ...s, direction: e.target.value }))}>
                    <option value="in">داخل</option>
                    <option value="out">خارج</option>
                  </Select>
                  <Input placeholder="المبلغ" value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} />
                  <Input placeholder="المرجع" value={form.reference_code} onChange={(e) => setForm((s) => ({ ...s, reference_code: e.target.value }))} />
                  <Input placeholder="المصدر" value={form.source} onChange={(e) => setForm((s) => ({ ...s, source: e.target.value }))} />
                  <Input placeholder="اسم العميل" value={form.customer_name} onChange={(e) => setForm((s) => ({ ...s, customer_name: e.target.value }))} />
                  <Input placeholder="الهاتف" value={form.customer_phone} onChange={(e) => setForm((s) => ({ ...s, customer_phone: e.target.value }))} />
                  <Input placeholder="التاريخ" type="datetime-local" value={form.happened_at} onChange={(e) => setForm((s) => ({ ...s, happened_at: e.target.value }))} />
                  <div className="md:col-span-2">
                    <Input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={createTransaction}>
                    <ReceiptText className="h-4 w-4" />
                    حفظ الحركة
                  </Button>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-black/20 p-4 sm:p-5">
                <h3 className="mb-4 text-lg font-bold text-white">آخر السندات والحركات</h3>
                <div className="space-y-3">
                  {snapshot.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{transaction.entry_type}</p>
                          <p className="mt-1 text-sm text-ajn-muted">{transaction.source || transaction.customer_name || "حركة مالية"}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-ajn-gold">{formatAmountWithCurrency(transaction.amount)}</p>
                          <p className="mt-1 text-xs text-ajn-muted">{formatDateTime(transaction.happened_at)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-white/70">{transaction.notes || transaction.reference_code || "—"}</p>
                        <Button variant="danger" className="px-3" onClick={() => deleteTransaction(transaction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function FinanceCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-sm text-ajn-goldSoft">{title}</p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
