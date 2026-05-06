"use client";

import { useEffect, useState } from "react";
import { Copy, FileText, ImagePlus, Package, Ruler, UploadCloud, X } from "lucide-react";
import { type UseFormRegisterReturn, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AnimatedServicePanel } from "@/components/ui/animated-service-panel";
import { Button } from "@/components/ui/button";
import { ChoiceButtonGroup } from "@/components/ui/choice-button-group";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ALBUM_SESSION_TYPES,
  GRADUATION_PACKAGE_TYPES,
  GRADUATION_ROBE_TYPES,
  GRADUATION_SASH_TYPES,
  GRADUATION_WRITING_TYPES,
  KOSHAT_TYPES,
  PHOTOGRAPHER_OPTIONS,
  RESEARCH_BINDING_TYPES,
  RESEARCH_COPY_OPTIONS,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
} from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";
import {
  buildOrderCode,
  buildOrderImageProxyUrl,
  calculateRemainingAmount,
  createEmptyGraduationDetails,
  createEmptyResearchDetails,
  formatAmountInputValue,
  formatAmountWithCurrency,
  getResearchIncludedNotes,
  getResearchCopyLabel,
  getStaffFieldLabel,
  getOrderStatusSteps,
  normalizePhone,
  normalizeStatusForService,
  supportsAlbumSessionType,
  supportsGraduationDetails,
  supportsKoshatType,
  supportsResearchDetails,
  supportsStaffField,
} from "@/lib/utils";
import { orderSchema } from "@/lib/validators";
import type { z } from "zod";

type OrderFormInput = z.input<typeof orderSchema>;
type OrderValues = z.output<typeof orderSchema>;

interface OrderModalProps {
  open: boolean;
  order: OrderRecord | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (
    values: OrderValues,
    uploads: { imageFiles: File[]; researchFiles: File[] },
  ) => Promise<void>;
}

const defaultValues: OrderFormInput = {
  name: "",
  phone: "",
  service_type: "Album",
  photographer: "",
  session_type: "",
  koshat_type: "",
  research_details: createEmptyResearchDetails(),
  research_files: [],
  graduation_details: createEmptyGraduationDetails(),
  booking_date: new Date().toISOString().split("T")[0],
  status: "تم الحجز",
  notes: "",
  images: [],
  total_amount: "0",
  received_amount: "0",
};

export function OrderModal({ open, order, busy, onClose, onSubmit }: OrderModalProps) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [researchFiles, setResearchFiles] = useState<File[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<OrderFormInput, undefined, OrderValues>({
    resolver: zodResolver(orderSchema),
    defaultValues,
  });

  const phone = useWatch({ control, name: "phone" });
  const serviceType = useWatch({ control, name: "service_type" }) ?? "Album";
  const photographer = useWatch({ control, name: "photographer" }) ?? "";
  const sessionType = useWatch({ control, name: "session_type" }) ?? "";
  const koshatType = useWatch({ control, name: "koshat_type" }) ?? "";
  const currentStatus = useWatch({ control, name: "status" }) ?? "تم الحجز";
  const images = useWatch({ control, name: "images" }) ?? [];
  const researchStoredFiles = useWatch({ control, name: "research_files" }) ?? [];
  const researchDetails = useWatch({ control, name: "research_details" }) ?? createEmptyResearchDetails();
  const graduationDetails =
    useWatch({ control, name: "graduation_details" }) ?? createEmptyGraduationDetails();
  const totalAmountInput = useWatch({ control, name: "total_amount" }) ?? "0";
  const receivedAmountInput = useWatch({ control, name: "received_amount" }) ?? "0";
  const remainingAmount = calculateRemainingAmount(totalAmountInput, receivedAmountInput);
  const availableStatuses = getOrderStatusSteps(serviceType);
  const shouldShowStaffField = supportsStaffField(serviceType);
  const shouldShowAlbumSessionType = supportsAlbumSessionType(serviceType);
  const shouldShowKoshatType = supportsKoshatType(serviceType);
  const shouldShowResearchPanel = supportsResearchDetails(serviceType);
  const shouldShowGraduationPanel = supportsGraduationDetails(serviceType);
  const staffFieldLabel = getStaffFieldLabel(serviceType);
  const phoneField = register("phone");
  const serviceTypeField = register("service_type");
  const sessionTypeField = register("session_type");
  const koshatTypeField = register("koshat_type");

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      order
        ? {
            name: order.name,
            phone: order.phone,
            service_type: order.service_type,
            photographer: order.photographer,
            session_type: order.session_type,
            koshat_type: order.koshat_type,
            research_details: order.research_details,
            research_files: order.research_files,
            graduation_details: order.graduation_details,
            booking_date: order.booking_date,
            status: normalizeStatusForService(order.status, order.service_type),
            notes: order.notes,
            images: order.images,
            total_amount: formatAmountInputValue(order.total_amount),
            received_amount: formatAmountInputValue(order.received_amount),
          }
        : defaultValues,
    );

    const timeout = window.setTimeout(() => {
      setImageFiles([]);
      setResearchFiles([]);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [open, order, reset]);

  useEffect(() => {
    if (!shouldShowStaffField && photographer) {
      setValue("photographer", "", { shouldDirty: true, shouldValidate: true });
    }

    if (!shouldShowAlbumSessionType && sessionType) {
      setValue("session_type", "", { shouldDirty: true, shouldValidate: true });
    }

    if (!shouldShowKoshatType && koshatType) {
      setValue("koshat_type", "", { shouldDirty: true, shouldValidate: true });
    }

    if (!shouldShowResearchPanel) {
      if (
        researchDetails.title ||
        researchDetails.student_names ||
        researchDetails.supervisor_name ||
        researchDetails.academic_entity ||
        researchDetails.delivery_date ||
        researchDetails.print_enabled ||
        researchDetails.copy_count ||
        researchDetails.binding_type
      ) {
        setValue("research_details", createEmptyResearchDetails(), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (researchStoredFiles.length) {
        setValue("research_files", [], { shouldDirty: true, shouldValidate: true });
      }
    }

    if (!shouldShowGraduationPanel) {
      const hasGraduationValues =
        graduationDetails.package_type ||
        graduationDetails.sash_type ||
        graduationDetails.robe_type ||
        graduationDetails.writing_type ||
        graduationDetails.measurements.sash_length ||
        graduationDetails.measurements.shoulder ||
        graduationDetails.measurements.robe_length ||
        graduationDetails.measurements.hand ||
        graduationDetails.has_cap;

      if (hasGraduationValues) {
        setValue("graduation_details", createEmptyGraduationDetails(), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }

    if (!researchDetails.print_enabled && researchDetails.copy_count !== 0) {
      setValue("research_details.copy_count", 0, { shouldDirty: true, shouldValidate: true });
    }

    if ((serviceType === "Session" || serviceType === "Koshat") && currentStatus) {
      const normalizedStatus = normalizeStatusForService(currentStatus, serviceType);

      if (normalizedStatus !== currentStatus) {
        setValue("status", normalizedStatus, { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [
    currentStatus,
    graduationDetails,
    koshatType,
    photographer,
    researchDetails,
    researchFiles.length,
    researchStoredFiles.length,
    serviceType,
    sessionType,
    setValue,
    shouldShowAlbumSessionType,
    shouldShowGraduationPanel,
    shouldShowKoshatType,
    shouldShowResearchPanel,
    shouldShowStaffField,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-md">
      <div className="mx-auto max-w-5xl">
        <div className="surface-panel-strong relative p-6 sm:p-8">
          <button
            type="button"
            className="absolute left-5 top-5 rounded-full border border-ajn-line p-2 text-ajn-muted transition hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">
              {order ? "تحديث بيانات الطلب" : "إنشاء طلب جديد"}
            </h2>
          </div>

          <form
            className="space-y-6"
            onSubmit={handleSubmit(async (values) => {
              await onSubmit(values, { imageFiles, researchFiles });
            })}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">اسم العميل</label>
                <Input {...register("name")} placeholder="الاسم الكامل" />
                {errors.name ? <p className="mt-2 text-sm text-red-300">{errors.name.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">رقم الهاتف</label>
                <Input
                  {...phoneField}
                  placeholder="96477..."
                  dir="ltr"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(event) => {
                    event.target.value = normalizePhone(event.target.value);
                    phoneField.onChange(event);
                  }}
                />
                {errors.phone ? <p className="mt-2 text-sm text-red-300">{errors.phone.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">نوع الخدمة</label>
                <Select
                  {...serviceTypeField}
                  onChange={(event) => {
                    serviceTypeField.onChange(event);

                    if (event.target.value !== "Research") {
                      setResearchFiles([]);
                    }
                  }}
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-black">
                      {SERVICE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </Select>
              </div>

              {shouldShowStaffField ? (
                <div>
                  <label className="mb-2 block text-sm text-ajn-goldSoft">{staffFieldLabel}</label>
                  <Select {...register("photographer")}>
                    <option value="" className="bg-black">
                      {serviceType === "Album" ? "اختر اسم الكادر" : "اختر الكادر"}
                    </option>
                    {PHOTOGRAPHER_OPTIONS.map((member) => (
                      <option key={member} value={member} className="bg-black">
                        {member}
                      </option>
                    ))}
                  </Select>
                  {errors.photographer ? (
                    <p className="mt-2 text-sm text-red-300">{errors.photographer.message}</p>
                  ) : null}
                </div>
              ) : null}

              {shouldShowAlbumSessionType ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-ajn-goldSoft">نوع الجلسة</label>
                  <input type="hidden" {...sessionTypeField} value={sessionType} />
                  <ChoiceButtonGroup
                    options={ALBUM_SESSION_TYPES.map((type) => ({
                      value: type,
                      title: type,
                    }))}
                    value={sessionType}
                    onChange={(value) =>
                      setValue("session_type", value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  {errors.session_type ? (
                    <p className="mt-2 text-sm text-red-300">{errors.session_type.message}</p>
                  ) : null}
                </div>
              ) : null}

              {shouldShowKoshatType ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-ajn-goldSoft">نوع الكوشة</label>
                  <input type="hidden" {...koshatTypeField} value={koshatType} />
                  <ChoiceButtonGroup
                    options={KOSHAT_TYPES.map((type) => ({
                      value: type,
                      title: type,
                    }))}
                    value={koshatType}
                    onChange={(value) =>
                      setValue("koshat_type", value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  {errors.koshat_type ? (
                    <p className="mt-2 text-sm text-red-300">{errors.koshat_type.message}</p>
                  ) : null}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">تاريخ الحجز</label>
                <Input type="date" {...register("booking_date")} />
              </div>

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">الحالة</label>
                <Select {...register("status")}>
                  {availableStatuses.map((status) => (
                    <option key={status.value} value={status.value} className="bg-black">
                      {status.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-4 md:col-span-2">
                <p className="mb-2 text-sm text-ajn-goldSoft">الكود</p>
                <p className="text-2xl font-bold text-white">{buildOrderCode(phone || "0000")}</p>
              </div>
            </div>

            {shouldShowResearchPanel ? (
              <AnimatedServicePanel className="rounded-[30px] border border-ajn-gold/20 bg-ajn-gold/[0.04] p-5 sm:p-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">تفاصيل البحث</h3>
                  </div>
                  <div className="rounded-2xl border border-ajn-line bg-white/[0.03] px-4 py-3 text-sm text-ajn-ivory">
                    {getResearchIncludedNotes().map((note) => (
                      <p key={note} className="leading-7">
                        • {note}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-ajn-goldSoft">العنوان</label>
                    <Input {...register("research_details.title")} placeholder="عنوان البحث" />
                    {errors.research_details?.title ? (
                      <p className="mt-2 text-sm text-red-300">{errors.research_details.title.message}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-ajn-goldSoft">اسم المشرف</label>
                    <Input {...register("research_details.supervisor_name")} placeholder="اسم المشرف" />
                    {errors.research_details?.supervisor_name ? (
                      <p className="mt-2 text-sm text-red-300">
                        {errors.research_details.supervisor_name.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-ajn-goldSoft">أسماء الطلبة</label>
                    <Textarea {...register("research_details.student_names")} rows={4} />
                    {errors.research_details?.student_names ? (
                      <p className="mt-2 text-sm text-red-300">
                        {errors.research_details.student_names.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm text-ajn-goldSoft">
                        جامعة - كلية - قسم
                      </label>
                      <Textarea
                        {...register("research_details.academic_entity")}
                        placeholder="الجامعة - الكلية - القسم"
                        rows={4}
                      />
                      {errors.research_details?.academic_entity ? (
                        <p className="mt-2 text-sm text-red-300">
                          {errors.research_details.academic_entity.message}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-ajn-goldSoft">تاريخ التسليم</label>
                      <Input type="date" {...register("research_details.delivery_date")} />
                      {errors.research_details?.delivery_date ? (
                        <p className="mt-2 text-sm text-red-300">
                          {errors.research_details.delivery_date.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-3xl border border-ajn-line bg-black/20 p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-full bg-ajn-gold/15 p-3 text-ajn-gold">
                        <Copy className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">خيار الطبع</h4>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        className={`rounded-[22px] border px-4 py-4 text-right transition ${
                          researchDetails.print_enabled
                            ? "border-ajn-gold bg-ajn-gold/[0.12] text-ajn-gold"
                            : "border-ajn-line bg-white/[0.03] text-white hover:border-ajn-gold/40"
                        }`}
                        onClick={() => {
                          setValue("research_details.print_enabled", true, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });

                          if (!researchDetails.copy_count) {
                            setValue("research_details.copy_count", 1, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            });
                          }
                        }}
                      >
                        <p className="font-semibold">طبع</p>
                      </button>
                      <button
                        type="button"
                        className={`rounded-[22px] border px-4 py-4 text-right transition ${
                          !researchDetails.print_enabled
                            ? "border-ajn-gold bg-ajn-gold/[0.12] text-ajn-gold"
                            : "border-ajn-line bg-white/[0.03] text-white hover:border-ajn-gold/40"
                        }`}
                        onClick={() => {
                          setValue("research_details.print_enabled", false, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                          setValue("research_details.copy_count", 0, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                        }}
                      >
                        <p className="font-semibold">بدون طبع</p>
                      </button>
                    </div>

                    {researchDetails.print_enabled ? (
                      <div className="mt-4">
                        <label className="mb-2 block text-sm text-ajn-goldSoft">عدد النسخ</label>
                        <ChoiceButtonGroup
                          gridClassName="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
                          options={RESEARCH_COPY_OPTIONS.map((count) => ({
                            value: String(count),
                            title: `نسخة ${count}`,
                          }))}
                          value={researchDetails.copy_count ? String(researchDetails.copy_count) : ""}
                          onChange={(value) =>
                            setValue("research_details.copy_count", Number(value), {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                        />
                        {errors.research_details?.copy_count ? (
                          <p className="mt-2 text-sm text-red-300">
                            {errors.research_details.copy_count.message}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-3xl border border-ajn-line bg-black/20 p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-full bg-ajn-gold/15 p-3 text-ajn-gold">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">التجليد / التغليف</h4>
                      </div>
                    </div>

                    <ChoiceButtonGroup
                      options={RESEARCH_BINDING_TYPES.map((type) => ({
                        value: type,
                        title: type,
                      }))}
                      value={researchDetails.binding_type ?? ""}
                      onChange={(value) =>
                        setValue("research_details.binding_type", value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    {errors.research_details?.binding_type ? (
                      <p className="mt-2 text-sm text-red-300">
                        {errors.research_details.binding_type.message}
                      </p>
                    ) : null}

                  </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-3xl border border-dashed border-ajn-line bg-white/[0.03] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-full bg-ajn-gold/15 p-3 text-ajn-gold">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">رفع ملفات PDF</h4>
                      </div>
                    </div>

                    <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-[26px] border border-ajn-line bg-black/20 p-6 text-center transition hover:border-ajn-gold/40">
                      <FileText className="mb-3 h-7 w-7 text-ajn-gold" />
                      <span className="text-sm text-white">اختر ملفات PDF</span>
                      <span className="mt-2 text-xs text-ajn-muted">PDF فقط</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          const selectedFiles = Array.from(event.target.files ?? []).filter(
                            (file) =>
                              file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
                          );
                          setResearchFiles(selectedFiles);
                        }}
                      />
                    </label>

                    {researchFiles.length ? (
                      <div className="mt-4 space-y-2">
                        {researchFiles.map((file) => (
                          <div
                            key={`${file.name}-${file.size}`}
                            className="rounded-2xl border border-ajn-line bg-white/[0.03] px-4 py-3 text-sm text-ajn-ivory"
                          >
                            {file.name}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h4 className="font-semibold text-white">ملفات البحث الحالية</h4>
                      <span className="text-sm text-ajn-muted">{researchStoredFiles.length} ملف</span>
                    </div>

                    {researchStoredFiles.length ? (
                      <div className="space-y-3">
                        {researchStoredFiles.map((file) => (
                          <div
                            key={file.url}
                            className="flex flex-col gap-3 rounded-2xl border border-ajn-line bg-black/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl border border-ajn-line bg-white/[0.04] px-3 py-2 text-xs text-white transition hover:bg-white/[0.08]"
                              >
                                فتح الملف
                              </a>
                              <button
                                type="button"
                                className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/15"
                                onClick={() =>
                                  setValue(
                                    "research_files",
                                    researchStoredFiles.filter((item) => item.url !== file.url),
                                    { shouldDirty: true, shouldValidate: true },
                                  )
                                }
                              >
                                إزالة
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-ajn-line bg-black/20 p-6 text-center text-sm text-ajn-muted">
                        لا توجد ملفات.
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedServicePanel>
            ) : null}

            {shouldShowGraduationPanel ? (
              <AnimatedServicePanel className="rounded-[30px] border border-ajn-gold/20 bg-ajn-gold/[0.04] p-5 sm:p-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">تفاصيل التجهيز</h3>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm text-ajn-goldSoft">نوع التجهيز</label>
                    <Select {...register("graduation_details.package_type")}>
                      <option value="" className="bg-black">
                        اختر نوع التجهيز
                      </option>
                      {GRADUATION_PACKAGE_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-black">
                          {type}
                        </option>
                      ))}
                    </Select>
                    {errors.graduation_details?.package_type ? (
                      <p className="mt-2 text-sm text-red-300">
                        {errors.graduation_details.package_type.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-ajn-goldSoft">الوشاح</label>
                    <Select {...register("graduation_details.sash_type")}>
                      <option value="" className="bg-black">
                        اختر نوع الوشاح
                      </option>
                      {GRADUATION_SASH_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-black">
                          {type}
                        </option>
                      ))}
                    </Select>
                    {errors.graduation_details?.sash_type ? (
                      <p className="mt-2 text-sm text-red-300">
                        {errors.graduation_details.sash_type.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-ajn-goldSoft">الروب</label>
                    <Select {...register("graduation_details.robe_type")}>
                      <option value="" className="bg-black">
                        اختر نوع الروب
                      </option>
                      {GRADUATION_ROBE_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-black">
                          {type}
                        </option>
                      ))}
                    </Select>
                    {errors.graduation_details?.robe_type ? (
                      <p className="mt-2 text-sm text-red-300">
                        {errors.graduation_details.robe_type.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-3xl border border-ajn-line bg-black/20 p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-full bg-ajn-gold/15 p-3 text-ajn-gold">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">نوع الكتابة</h4>
                      </div>
                    </div>

                    <ChoiceButtonGroup
                      options={GRADUATION_WRITING_TYPES.map((type) => ({
                        value: type,
                        title: type,
                        description:
                          type === "طبع"
                            ? "حل عملي وسريع بإخراج أنيق"
                            : "تفصيل فاخر ولمسة أوضح على القطعة",
                      }))}
                      value={graduationDetails.writing_type ?? ""}
                      onChange={(value) =>
                        setValue("graduation_details.writing_type", value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    {errors.graduation_details?.writing_type ? (
                      <p className="mt-2 text-sm text-red-300">
                        {errors.graduation_details.writing_type.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-3xl border border-ajn-line bg-black/20 p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-full bg-ajn-gold/15 p-3 text-ajn-gold">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">القبعة</h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`w-full rounded-[22px] border px-4 py-4 text-right transition ${
                        graduationDetails.has_cap
                          ? "border-ajn-gold bg-ajn-gold/[0.12] text-ajn-gold"
                          : "border-ajn-line bg-white/[0.03] text-white hover:border-ajn-gold/40"
                      }`}
                      onClick={() =>
                        setValue("graduation_details.has_cap", !graduationDetails.has_cap, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <p className="font-semibold">{graduationDetails.has_cap ? "قبعة مضافة" : "قبعة"}</p>
                    </button>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-ajn-line bg-black/20 p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-full bg-ajn-gold/15 p-3 text-ajn-gold">
                      <Ruler className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">القياسات</h4>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <MeasurementField
                      label="طول وشاح"
                      placeholder="سم"
                      error={errors.graduation_details?.measurements?.sash_length?.message}
                      registration={register("graduation_details.measurements.sash_length")}
                    />
                    <MeasurementField
                      label="كتف"
                      placeholder="سم"
                      error={errors.graduation_details?.measurements?.shoulder?.message}
                      registration={register("graduation_details.measurements.shoulder")}
                    />
                    <MeasurementField
                      label="طول روب"
                      placeholder="سم"
                      error={errors.graduation_details?.measurements?.robe_length?.message}
                      registration={register("graduation_details.measurements.robe_length")}
                    />
                    <MeasurementField
                      label="اليد"
                      placeholder="سم"
                      error={errors.graduation_details?.measurements?.hand?.message}
                      registration={register("graduation_details.measurements.hand")}
                    />
                  </div>
                </div>
              </AnimatedServicePanel>
            ) : null}

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">المبلغ الكلي</label>
                <Input
                  {...register("total_amount")}
                  placeholder="0"
                  inputMode="decimal"
                  dir="ltr"
                />
                {errors.total_amount ? (
                  <p className="mt-2 text-sm text-red-300">{errors.total_amount.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">المبلغ الواصل</label>
                <Input
                  {...register("received_amount")}
                  placeholder="0"
                  inputMode="decimal"
                  dir="ltr"
                />
                {errors.received_amount ? (
                  <p className="mt-2 text-sm text-red-300">{errors.received_amount.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">المبلغ المتبقي</label>
                <Input
                  value={formatAmountWithCurrency(remainingAmount)}
                  readOnly
                  className="border-ajn-gold/20 bg-ajn-gold/[0.08] text-ajn-gold focus:border-ajn-gold/20 focus:bg-ajn-gold/[0.08]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-ajn-goldSoft">الملاحظات</label>
              <Textarea {...register("notes")} />
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-dashed border-ajn-line bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-full bg-ajn-gold/15 p-3 text-ajn-gold">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">رفع صور الطلب</h3>
                  </div>
                </div>

                <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-[26px] border border-ajn-line bg-black/20 p-6 text-center transition hover:border-ajn-gold/40">
                  <ImagePlus className="mb-3 h-7 w-7 text-ajn-gold" />
                  <span className="text-sm text-white">اختر الصور</span>
                  <span className="mt-2 text-xs text-ajn-muted">JPEG / PNG / WEBP</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const selectedFiles = Array.from(event.target.files ?? []);
                      setImageFiles(selectedFiles);
                    }}
                  />
                </label>

                {imageFiles.length ? (
                  <div className="mt-4 space-y-2">
                    {imageFiles.map((file) => (
                      <div
                        key={`${file.name}-${file.size}`}
                        className="rounded-2xl border border-ajn-line bg-white/[0.03] px-4 py-3 text-sm text-ajn-ivory"
                      >
                        {file.name}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">الصور الحالية</h3>
                  <span className="text-sm text-ajn-muted">{images.length} صورة</span>
                </div>

                {images.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {images.map((imageUrl) => (
                      <div key={imageUrl} className="overflow-hidden rounded-2xl border border-ajn-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={buildOrderImageProxyUrl(imageUrl)}
                          alt="order media"
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          className="w-full border-t border-ajn-line bg-black/40 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/12"
                          onClick={() => setValue("images", images.filter((item) => item !== imageUrl))}
                        >
                          إزالة
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-ajn-line bg-black/20 p-6 text-center text-sm text-ajn-muted">
                    لا توجد صور.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "جاري الحفظ..." : order ? "حفظ التعديلات" : "إنشاء الطلب"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MeasurementField({
  label,
  placeholder,
  registration,
  error,
}: {
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-ajn-goldSoft">{label}</label>
      <Input {...registration} placeholder={placeholder} />
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
