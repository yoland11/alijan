"use client";

import { useEffect, useState } from "react";
import { CalendarCheck2, ClipboardCheck, Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EmployeeProfileRecord } from "@/lib/operations-types";

const emptyEmployee = {
  name: "",
  phone: "",
  role: "",
  permissions: [] as string[],
  monthly_salary: 0,
  notes: "",
  is_active: true,
};

type EmployeeFormState = typeof emptyEmployee;

export function EmployeesManager() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeProfileRecord[]>([]);
  const [form, setForm] = useState<EmployeeFormState>(emptyEmployee);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, { attendance_date: string; check_in_time: string; check_out_time: string; status: string; notes: string }>>({});
  const [taskForms, setTaskForms] = useState<Record<string, { title: string; due_date: string; notes: string }>>({});

  const load = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ops/employees", { cache: "no-store" });
      const payload = (await response.json()) as { message?: string; employees?: EmployeeProfileRecord[] };
      if (!response.ok) throw new Error(payload.message || "تعذر تحميل الموظفين.");
      setEmployees(payload.employees ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل الموظفين.");
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

  const saveEmployee = async () => {
    try {
      const endpoint = editingId ? `/api/admin/ops/employees/${editingId}` : "/api/admin/ops/employees";
      const method = editingId ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "تعذر حفظ الموظف.");
      toast.success(editingId ? "تم تحديث الموظف." : "تمت إضافة الموظف.");
      setForm(emptyEmployee);
      setEditingId(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الموظف.");
    }
  };

  const removeEmployee = async (id: string) => {
    if (!window.confirm("حذف الموظف؟")) return;
    try {
      const response = await fetch(`/api/admin/ops/employees/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "تعذر حذف الموظف.");
      toast.success("تم حذف الموظف.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الموظف.");
    }
  };

  const addAttendance = async (employeeId: string) => {
    const value = attendance[employeeId] ?? {
      attendance_date: new Date().toISOString().slice(0, 10),
      check_in_time: "",
      check_out_time: "",
      status: "حاضر",
      notes: "",
    };
    try {
      const response = await fetch("/api/admin/ops/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "attendance", payload: { employee_id: employeeId, ...value } }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "تعذر تسجيل الحضور.");
      toast.success("تم تسجيل الحضور.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تسجيل الحضور.");
    }
  };

  const addTask = async (employeeId: string) => {
    const value = taskForms[employeeId] ?? { title: "", due_date: "", notes: "" };
    try {
      const response = await fetch("/api/admin/ops/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "task", payload: { employee_id: employeeId, ...value } }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "تعذر إضافة المهمة.");
      toast.success("تمت إضافة المهمة.");
      setTaskForms((current) => ({ ...current, [employeeId]: { title: "", due_date: "", notes: "" } }));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إضافة المهمة.");
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch("/api/admin/ops/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "task-status", payload: { task_id: taskId, status } }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "تعذر تحديث المهمة.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث المهمة.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-panel p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-white">الموظفون والمهام</h2>
          <p className="mt-1 text-sm text-ajn-muted">إدارة الطاقم والحضور والمهام اليومية</p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-white/8 bg-black/20 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <UsersRound className="h-5 w-5 text-ajn-gold" />
              <h3 className="text-lg font-bold text-white">{editingId ? "تعديل موظف" : "إضافة موظف"}</h3>
            </div>
            <div className="grid gap-3">
              <Input placeholder="الاسم" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              <Input placeholder="الهاتف" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
              <Input placeholder="الدور" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))} />
              <Input
                placeholder="الصلاحيات مفصولة بفاصلة"
                value={form.permissions.join(", ")}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    permissions: e.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  }))
                }
              />
              <Input placeholder="الراتب الشهري" value={String(form.monthly_salary)} onChange={(e) => setForm((s) => ({ ...s, monthly_salary: Number(e.target.value || 0) }))} />
              <Input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
              <Select value={form.is_active ? "active" : "inactive"} onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.value === "active" }))}>
                <option value="active">نشط</option>
                <option value="inactive">موقوف</option>
              </Select>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={saveEmployee}>
                <Plus className="h-4 w-4" />
                {editingId ? "حفظ التعديل" : "إضافة موظف"}
              </Button>
              {editingId ? (
                <Button variant="secondary" onClick={() => { setEditingId(null); setForm(emptyEmployee); }}>
                  إلغاء
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <div key={index} className="shimmer-skeleton h-56 rounded-[28px]" />)
            ) : (
              employees.map((employee) => {
                const attendanceForm = attendance[employee.id] ?? {
                  attendance_date: new Date().toISOString().slice(0, 10),
                  check_in_time: "",
                  check_out_time: "",
                  status: "حاضر",
                  notes: "",
                };
                const taskForm = taskForms[employee.id] ?? { title: "", due_date: "", notes: "" };
                return (
                  <div key={employee.id} className="rounded-[28px] border border-white/8 bg-black/20 p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{employee.name}</h3>
                        <p className="mt-1 text-sm text-ajn-muted">{employee.role || "موظف"}</p>
                        <p className="mt-1 text-xs text-ajn-goldSoft">{employee.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="px-3"
                          onClick={() => {
                            setEditingId(employee.id);
                            setForm({
                              name: employee.name,
                              phone: employee.phone,
                              role: employee.role,
                              permissions: employee.permissions,
                              monthly_salary: employee.monthly_salary,
                              notes: employee.notes,
                              is_active: employee.is_active,
                            });
                          }}
                        >
                          تعديل
                        </Button>
                        <Button variant="danger" className="px-3" onClick={() => removeEmployee(employee.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[22px] border border-white/8 bg-black/25 p-3">
                        <div className="mb-3 flex items-center gap-2">
                          <CalendarCheck2 className="h-4.5 w-4.5 text-ajn-gold" />
                          <p className="text-sm font-semibold text-white">الحضور</p>
                        </div>
                        <div className="grid gap-2">
                          <Input type="date" value={attendanceForm.attendance_date} onChange={(e) => setAttendance((s) => ({ ...s, [employee.id]: { ...attendanceForm, attendance_date: e.target.value } }))} />
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="time" value={attendanceForm.check_in_time} onChange={(e) => setAttendance((s) => ({ ...s, [employee.id]: { ...attendanceForm, check_in_time: e.target.value } }))} />
                            <Input type="time" value={attendanceForm.check_out_time} onChange={(e) => setAttendance((s) => ({ ...s, [employee.id]: { ...attendanceForm, check_out_time: e.target.value } }))} />
                          </div>
                          <Select value={attendanceForm.status} onChange={(e) => setAttendance((s) => ({ ...s, [employee.id]: { ...attendanceForm, status: e.target.value } }))}>
                            <option value="حاضر">حاضر</option>
                            <option value="متأخر">متأخر</option>
                            <option value="إجازة">إجازة</option>
                            <option value="غائب">غائب</option>
                          </Select>
                          <Button variant="secondary" onClick={() => addAttendance(employee.id)}>
                            تسجيل حضور
                          </Button>
                        </div>
                        <div className="mt-3 space-y-2">
                          {employee.attendance.map((entry) => (
                            <div key={entry.id} className="rounded-[16px] border border-white/6 bg-black/20 px-3 py-2 text-sm text-white">
                              {entry.attendance_date} • {entry.status}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-white/8 bg-black/25 p-3">
                        <div className="mb-3 flex items-center gap-2">
                          <ClipboardCheck className="h-4.5 w-4.5 text-ajn-gold" />
                          <p className="text-sm font-semibold text-white">المهام</p>
                        </div>
                        <div className="grid gap-2">
                          <Input placeholder="عنوان المهمة" value={taskForm.title} onChange={(e) => setTaskForms((s) => ({ ...s, [employee.id]: { ...taskForm, title: e.target.value } }))} />
                          <Input type="date" value={taskForm.due_date} onChange={(e) => setTaskForms((s) => ({ ...s, [employee.id]: { ...taskForm, due_date: e.target.value } }))} />
                          <Input placeholder="ملاحظات" value={taskForm.notes} onChange={(e) => setTaskForms((s) => ({ ...s, [employee.id]: { ...taskForm, notes: e.target.value } }))} />
                          <Button variant="secondary" onClick={() => addTask(employee.id)}>
                            إضافة مهمة
                          </Button>
                        </div>
                        <div className="mt-3 space-y-2">
                          {employee.tasks.map((task) => (
                            <div key={task.id} className="rounded-[16px] border border-white/6 bg-black/20 px-3 py-2 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium text-white">{task.title}</span>
                                <Select value={task.status} className="h-9 w-32 text-xs" onChange={(e) => updateTaskStatus(task.id, e.target.value)}>
                                  <option value="جديدة">جديدة</option>
                                  <option value="قيد التنفيذ">قيد التنفيذ</option>
                                  <option value="مكتملة">مكتملة</option>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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
