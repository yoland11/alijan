"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardPlus, Copy, FileText, Package, Ruler, Search } from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { type UseFormRegisterReturn, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

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
import {
  buildOrderCode,
  buildOrderTrackingLink,
  createEmptyGraduationDetails,
  createEmptyResearchDetails,
  getResearchCopyLabel,
  getResearchIncludedNotes,
  getStaffFieldLabel,
  normalizePhone,
  supportsAlbumSessionType,
  supportsGraduationDetails,
  supportsKoshatType,
  supportsResearchDetails,
  supportsStaffField,
} from "@/lib/utils";
import { customerBookingSchema } from "@/lib/validators";

type CustomerBookingInput = z.input<typeof customerBookingSchema>;
type CustomerBookingValues = z.output<typeof customerBookingSchema>;

const defaultValues: CustomerBookingInput = {
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
  notes: "",
};

export function CustomerBookingForm() {
  const [submitting, setSubmitting] = useState(false);
  const [researchFiles, setResearchFiles] = useState<File[]>([]);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomerBookingInput, undefined, CustomerBookingValues>({
    resolver: zodResolver(customerBookingSchema),
    defaultValues,
  });

  const phone = useWatch({ control, name: "phone" }) ?? "";
  const serviceType = useWatch({ control, name: "service_type" }) ?? "Album";
  const photographer = useWatch({ control, name: "photographer" }) ?? "";
  const sessionType = useWatch({ control, name: "session_type" }) ?? "";
  const koshatType = useWatch({ control, name: "koshat_type" }) ?? "";
  const researchDetails = useWatch({ control, name: "research_details" }) ?? createEmptyResearchDetails();
  const researchStoredFiles = useWatch({ control, name: "research_files" }) ?? [];
  const graduationDetails =
    useWatch({ control, name: "graduation_details" }) ?? createEmptyGraduationDetails();
  const phoneField = register("phone");
  const serviceTypeField = register("service_type");
  const sessionTypeField = register("session_type");
  const koshatTypeField = register("koshat_type");

  const shouldShowStaffField = supportsStaffField(serviceType);
  const shouldShowAlbumSessionType = supportsAlbumSessionType(serviceType);
  const shouldShowKoshatType = supportsKoshatType(serviceType);
  const shouldShowResearchPanel = supportsResearchDetails(serviceType);
  const shouldShowGraduationPanel = supportsGraduationDetails(serviceType);
  const staffFieldLabel = getStaffFieldLabel(serviceType);
  const previewOrderCode = useMemo(() => buildOrderCode(phone || "0000"), [phone]);

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
      const hasResearchValues =
        researchDetails.title ||
        researchDetails.student_names ||
        researchDetails.supervisor_name ||
        researchDetails.academic_entity ||
        researchDetails.delivery_date ||
        researchDetails.print_enabled ||
        researchDetails.copy_count ||
        researchDetails.binding_type ||
        researchStoredFiles.length ||
        researchFiles.length;

      if (hasResearchValues) {
        setValue("research_details", createEmptyResearchDetails(), {
          shouldDirty: true,
          shouldValidate: true,
        });
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
      setValue("research_details.copy_count", 0, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [
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

  const submitForm = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      let uploadedResearchFiles = values.research_files;

      if (serviceType === "Research" && researchFiles.length) {
        const uploadBody = new FormData();
        researchFiles.forEach((file) => uploadBody.append("files", file));

        const uploadResponse = await fetch("/api/research-files", {
          method: "POST",
          body: uploadBody,
        });
        const uploadPayload = (await uploadResponse.json()) as {
          message?: string;
          files?: { name: string; url: string }[];
        };

        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.message || "تعذر رفع ملفات PDF.");
        }

        uploadedResearchFiles = [...values.research_files, ...(uploadPayload.files ?? [])];
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          research_files: uploadedResearchFiles,
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        order?: { order_code?: string };
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر إرسال الحجز.");
      }

      const orderCode = payload.order?.order_code ?? previewOrderCode;
      setCreatedOrderCode(orderCode);
      toast.success("تم إرسال طلبك بنجاح.");
      setResearchFiles([]);
      reset({
        ...defaultValues,
        booking_date: defaultValues.booking_date,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إرسال الحجز.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <section className="surface-panel-strong noise-overlay p-5 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">إنشاء طلب جديد</h1>
        </div>

        <div className="rounded-[24px] border border-ajn-line bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-ajn-goldSoft">الكود</p>
          <p className="mt-1 text-xl font-bold text-white">{previewOrderCode}</p>
        </div>
      </div>

      {createdOrderCode ? (
        <div className="mb-6 rounded-[26px] border border-emerald-400/25 bg-emerald-500/10 p-5">
          <div className="mb-3 flex items-center gap-3 text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-semibold">تم الإرسال</p>
          </div>
          <p className="text-sm leading-8 text-white/90">{createdOrderCode}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/track?code=${encodeURIComponent(createdOrderCode)}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-ajn-gold px-5 text-sm font-semibold text-black transition hover:bg-ajn-goldSoft"
            >
              <Search className="h-4 w-4" />
              تتبع الطلب الآن
            </Link>
            <a
              href={buildOrderTrackingLink(createdOrderCode)}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              نسخ رابط التتبع
            </a>
          </div>
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={submitForm}>
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

          <div>
            <label className="mb-2 block text-sm text-ajn-goldSoft">تاريخ الحجز</label>
            <Input type="date" {...register("booking_date")} />
            {errors.booking_date ? (
              <p className="mt-2 text-sm text-red-300">{errors.booking_date.message}</p>
            ) : null}
          </div>

          {shouldShowStaffField ? (
            <div className="md:col-span-2">
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
        </div>

        {shouldShowResearchPanel ? (
          <AnimatedServicePanel className="rounded-[30px] border border-ajn-gold/20 bg-ajn-gold/[0.04] p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                  <label className="mb-2 block text-sm text-ajn-goldSoft">جامعة - كلية - قسم</label>
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

            <div className="mt-6 rounded-3xl border border-dashed border-ajn-line bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-ajn-gold/15 p-3 text-ajn-gold">
                  <FileText className="h-5 w-5" />
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
          </AnimatedServicePanel>
        ) : null}

        {shouldShowGraduationPanel ? (
          <AnimatedServicePanel className="rounded-[30px] border border-ajn-gold/20 bg-ajn-gold/[0.04] p-5 sm:p-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white">تفاصيل التجهيز</h3>
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
                  registration={register("graduation_details.measurements.sash_length")}
                  error={errors.graduation_details?.measurements?.sash_length?.message}
                />
                <MeasurementField
                  label="كتف"
                  placeholder="سم"
                  registration={register("graduation_details.measurements.shoulder")}
                  error={errors.graduation_details?.measurements?.shoulder?.message}
                />
                <MeasurementField
                  label="طول روب"
                  placeholder="سم"
                  registration={register("graduation_details.measurements.robe_length")}
                  error={errors.graduation_details?.measurements?.robe_length?.message}
                />
                <MeasurementField
                  label="اليد"
                  placeholder="سم"
                  registration={register("graduation_details.measurements.hand")}
                  error={errors.graduation_details?.measurements?.hand?.message}
                />
              </div>
            </div>
          </AnimatedServicePanel>
        ) : null}

        <div>
          <label className="mb-2 block text-sm text-ajn-goldSoft">الملاحظات</label>
          <Textarea {...register("notes")} />
          {errors.notes ? <p className="mt-2 text-sm text-red-300">{errors.notes.message}</p> : null}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            العودة للرئيسية
          </Link>
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            <ClipboardPlus className="h-4 w-4" />
            {submitting ? "جاري إرسال الطلب..." : "إرسال الحجز"}
          </Button>
        </div>
      </form>
    </section>
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
