"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  ImagePlus,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import type { BookingServiceConfig } from "@/lib/booking-services";
import {
  GRADUATION_PACKAGE_TYPES,
  GRADUATION_ROBE_TYPES,
  GRADUATION_SASH_TYPES,
  GRADUATION_WRITING_TYPES,
  KOSHAT_TYPES,
  PHOTOGRAPHER_OPTIONS,
  RESEARCH_BINDING_TYPES,
  RESEARCH_COPY_OPTIONS,
} from "@/lib/constants";
import {
  buildOrderCode,
  buildOrderTrackingLink,
  createEmptyGraduationDetails,
  createEmptyResearchDetails,
  createEmptyServiceDetails,
  getResearchCopyLabel,
  normalizePhone,
} from "@/lib/utils";
import { customerBookingSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { ChoiceButtonGroup } from "@/components/ui/choice-button-group";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CustomerBookingInput = z.input<typeof customerBookingSchema>;
type CustomerBookingValues = z.output<typeof customerBookingSchema>;

interface ServiceBookingFormProps {
  service: BookingServiceConfig;
}

const venueOptions = ["داخلية", "خارجية"] as const;

export function ServiceBookingForm({ service }: ServiceBookingFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [researchFiles, setResearchFiles] = useState<File[]>([]);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);

  const defaultValues = useMemo<CustomerBookingInput>(
    () => ({
      name: "",
      phone: "",
      service_type: service.serviceType,
      photographer: "",
      session_type: "",
      koshat_type: "",
      research_details: createEmptyResearchDetails(),
      research_files: [],
      graduation_details: createEmptyGraduationDetails(),
      service_details: createEmptyServiceDetails(),
      images: [],
      booking_date: new Date().toISOString().split("T")[0],
      notes: "",
    }),
    [service.serviceType],
  );

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

  const phoneField = register("phone");
  const phone = useWatch({ control, name: "phone" }) ?? "";
  const koshatType = useWatch({ control, name: "koshat_type" }) ?? "";
  const serviceDetails = useWatch({ control, name: "service_details" }) ?? createEmptyServiceDetails();
  const researchDetails = useWatch({ control, name: "research_details" }) ?? createEmptyResearchDetails();
  const graduationDetails =
    useWatch({ control, name: "graduation_details" }) ?? createEmptyGraduationDetails();

  useEffect(() => {
    if (!researchDetails.print_enabled && researchDetails.copy_count !== 0) {
      setValue("research_details.copy_count", 0, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [researchDetails.copy_count, researchDetails.print_enabled, setValue]);

  const previewOrderCode = useMemo(() => buildOrderCode(phone || "0000"), [phone]);

  const submitForm = handleSubmit(async (values) => {
    try {
      setSubmitting(true);

      let uploadedImages = values.images ?? [];
      let uploadedResearchFiles = values.research_files;

      if (referenceFiles.length) {
        const imageFormData = new FormData();
        referenceFiles.forEach((file) => imageFormData.append("files", file));

        const uploadResponse = await fetch("/api/shop/uploads", {
          method: "POST",
          body: imageFormData,
        });
        const uploadPayload = (await uploadResponse.json()) as {
          message?: string;
          files?: { url: string }[];
        };

        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.message || "تعذر رفع الصور المرجعية.");
        }

        uploadedImages = [...uploadedImages, ...(uploadPayload.files ?? []).map((file) => file.url)];
      }

      if (service.serviceType === "Research" && researchFiles.length) {
        const pdfFormData = new FormData();
        researchFiles.forEach((file) => pdfFormData.append("files", file));

        const uploadResponse = await fetch("/api/research-files", {
          method: "POST",
          body: pdfFormData,
        });
        const uploadPayload = (await uploadResponse.json()) as {
          message?: string;
          files?: { name: string; url: string }[];
        };

        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.message || "تعذر رفع ملفات البحث.");
        }

        uploadedResearchFiles = [...values.research_files, ...(uploadPayload.files ?? [])];
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          images: uploadedImages,
          research_files: uploadedResearchFiles,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        order?: { order_code?: string };
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر إرسال الطلب.");
      }

      const orderCode = payload.order?.order_code ?? previewOrderCode;
      setCreatedOrderCode(orderCode);
      toast.success("تم إرسال الطلب.");
      setReferenceFiles([]);
      setResearchFiles([]);
      reset(defaultValues);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إرسال الطلب.");
    } finally {
      setSubmitting(false);
    }
  });

  const showReferenceImages = service.serviceType !== "Research";

  return (
    <section className="surface-panel-strong noise-overlay p-5 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Link href="/book" className="inline-flex items-center gap-2 text-sm text-ajn-goldSoft transition hover:text-white">
            <Search className="h-4 w-4" />
            كل الخدمات
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-ajn-goldSoft">{service.subtitle}</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{service.title}</h1>
            <p className="mt-2 text-sm text-ajn-muted">{service.description}</p>
          </div>
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
            <p className="text-sm font-semibold">تم استلام الطلب</p>
          </div>
          <p className="text-sm leading-8 text-white/90">{createdOrderCode}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/track?code=${encodeURIComponent(createdOrderCode)}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-ajn-gold px-5 text-sm font-semibold text-black transition hover:bg-ajn-goldSoft"
            >
              <Search className="h-4 w-4" />
              تتبع الطلب
            </Link>
            <a
              href={buildOrderTrackingLink(createdOrderCode)}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              نسخ الرابط
            </a>
          </div>
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={submitForm}>
        <SectionCard title="بيانات العميل" icon={<UserRound className="h-4 w-4" />}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel>الاسم</FieldLabel>
              <Input {...register("name")} placeholder="الاسم الكامل" />
              <FieldError message={errors.name?.message} />
            </Field>

            <Field>
              <FieldLabel>رقم الهاتف</FieldLabel>
              <Input
                {...phoneField}
                placeholder="077..."
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(event) => {
                  event.target.value = normalizePhone(event.target.value);
                  phoneField.onChange(event);
                }}
              />
              <FieldError message={errors.phone?.message} />
            </Field>

            <Field>
              <FieldLabel>تاريخ الحجز</FieldLabel>
              <Input type="date" {...register("booking_date")} />
              <FieldError message={errors.booking_date?.message} />
            </Field>

            {service.serviceType === "Session" ? (
              <Field>
                <FieldLabel>الكادر التصويري</FieldLabel>
                <Select {...register("photographer")}>
                  <option value="" className="bg-black">
                    اختر الكادر
                  </option>
                  {PHOTOGRAPHER_OPTIONS.map((member) => (
                    <option key={member} value={member} className="bg-black">
                      {member}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.photographer?.message} />
              </Field>
            ) : null}
          </div>
        </SectionCard>

        {service.serviceType === "Koshat" ? (
          <SectionCard title="تفاصيل الكوشات" icon={<Package className="h-4 w-4" />}>
            <div className="space-y-5">
              <Field>
                <FieldLabel>نوع الكوشة</FieldLabel>
                <ChoiceButtonGroup
                  options={KOSHAT_TYPES.map((type) => ({ value: type, title: type }))}
                  value={koshatType}
                  onChange={(value) => setValue("koshat_type", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                />
                <FieldError message={errors.koshat_type?.message} />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel>المحافظة</FieldLabel>
                  <Input {...register("service_details.province")} placeholder="المحافظة" />
                  <FieldError message={errors.service_details?.province?.message} />
                </Field>
                <Field>
                  <FieldLabel>العنوان</FieldLabel>
                  <Input {...register("service_details.address")} placeholder="العنوان" />
                  <FieldError message={errors.service_details?.address?.message} />
                </Field>
                <Field>
                  <FieldLabel>وقت الحجز</FieldLabel>
                  <Input type="time" {...register("service_details.booking_time")} />
                  <FieldError message={errors.service_details?.booking_time?.message} />
                </Field>
                <Field>
                  <FieldLabel>عدد الكراسي</FieldLabel>
                  <Input {...register("service_details.chair_count")} placeholder="مثال: 30" />
                  <FieldError message={errors.service_details?.chair_count?.message} />
                </Field>
              </div>

              <Field>
                <FieldLabel>داخلية / خارجية</FieldLabel>
                <ChoiceButtonGroup
                  options={venueOptions.map((item) => ({ value: item, title: item }))}
                  value={serviceDetails.venue_type ?? ""}
                  onChange={(value) => setValue("service_details.venue_type", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                />
                <FieldError message={errors.service_details?.venue_type?.message} />
              </Field>

              <Field>
                <FieldLabel>النقل</FieldLabel>
                <ChoiceButtonGroup
                  options={[
                    { value: "yes", title: "مطلوب" },
                    { value: "no", title: "غير مطلوب" },
                  ]}
                  value={serviceDetails.transport_required ? "yes" : "no"}
                  onChange={(value) =>
                    setValue("service_details.transport_required", value === "yes", {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                />
              </Field>
            </div>
          </SectionCard>
        ) : null}

        {service.serviceType === "Session" ? (
          <SectionCard title="تفاصيل التصوير" icon={<Clock3 className="h-4 w-4" />}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel>وقت الجلسة</FieldLabel>
                <Input type="time" {...register("service_details.booking_time")} />
                <FieldError message={errors.service_details?.booking_time?.message} />
              </Field>
              <Field>
                <FieldLabel>موقع التصوير</FieldLabel>
                <Input {...register("service_details.session_location")} placeholder="موقع التصوير" />
                <FieldError message={errors.service_details?.session_location?.message} />
              </Field>
              <Field>
                <FieldLabel>نوع الجلسة</FieldLabel>
                <Input {...register("service_details.session_kind")} placeholder="نوع الجلسة" />
                <FieldError message={errors.service_details?.session_kind?.message} />
              </Field>
              <Field>
                <FieldLabel>عدد الأشخاص</FieldLabel>
                <Input {...register("service_details.people_count")} placeholder="عدد الأشخاص" />
                <FieldError message={errors.service_details?.people_count?.message} />
              </Field>
            </div>

            <div className="mt-5 space-y-5">
              <Field>
                <FieldLabel>داخلي / خارجي</FieldLabel>
                <ChoiceButtonGroup
                  options={venueOptions.map((item) => ({ value: item, title: item }))}
                  value={serviceDetails.venue_type ?? ""}
                  onChange={(value) => setValue("service_details.venue_type", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                />
                <FieldError message={errors.service_details?.venue_type?.message} />
              </Field>

              <Field>
                <FieldLabel>فيديو مطلوب</FieldLabel>
                <ChoiceButtonGroup
                  options={[
                    { value: "yes", title: "نعم" },
                    { value: "no", title: "لا" },
                  ]}
                  value={serviceDetails.video_required ? "yes" : "no"}
                  onChange={(value) =>
                    setValue("service_details.video_required", value === "yes", {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                />
              </Field>
            </div>
          </SectionCard>
        ) : null}

        {service.serviceType === "Album" ? (
          <SectionCard title="تفاصيل الألبوم" icon={<FileText className="h-4 w-4" />}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel>نوع الألبوم</FieldLabel>
                <Input {...register("service_details.album_type")} placeholder="نوع الألبوم" />
                <FieldError message={errors.service_details?.album_type?.message} />
              </Field>
              <Field>
                <FieldLabel>عدد الصفحات</FieldLabel>
                <Input {...register("service_details.page_count")} placeholder="عدد الصفحات" />
                <FieldError message={errors.service_details?.page_count?.message} />
              </Field>
              <Field>
                <FieldLabel>المقاس</FieldLabel>
                <Input {...register("service_details.album_size")} placeholder="المقاس" />
                <FieldError message={errors.service_details?.album_size?.message} />
              </Field>
              <Field>
                <FieldLabel>نوع الغلاف</FieldLabel>
                <Input {...register("service_details.cover_type")} placeholder="نوع الغلاف" />
                <FieldError message={errors.service_details?.cover_type?.message} />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>الاسم على الغلاف</FieldLabel>
                <Input {...register("service_details.cover_name")} placeholder="الاسم على الغلاف" />
              </Field>
            </div>
          </SectionCard>
        ) : null}

        {service.serviceType === "Research" ? (
          <>
            <SectionCard title="تفاصيل البحث" icon={<FileText className="h-4 w-4" />}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel>عنوان البحث</FieldLabel>
                  <Input {...register("research_details.title")} placeholder="عنوان البحث" />
                  <FieldError message={errors.research_details?.title?.message} />
                </Field>
                <Field>
                  <FieldLabel>اسم المشرف</FieldLabel>
                  <Input {...register("research_details.supervisor_name")} placeholder="اسم المشرف" />
                  <FieldError message={errors.research_details?.supervisor_name?.message} />
                </Field>
                <Field>
                  <FieldLabel>الجامعة</FieldLabel>
                  <Input {...register("service_details.university")} placeholder="الجامعة" />
                  <FieldError message={errors.service_details?.university?.message} />
                </Field>
                <Field>
                  <FieldLabel>القسم</FieldLabel>
                  <Input {...register("service_details.department")} placeholder="القسم" />
                  <FieldError message={errors.service_details?.department?.message} />
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>أسماء الطلبة</FieldLabel>
                  <Textarea {...register("research_details.student_names")} rows={4} />
                  <FieldError message={errors.research_details?.student_names?.message} />
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>الجامعة - الكلية - القسم</FieldLabel>
                  <Textarea {...register("research_details.academic_entity")} rows={3} />
                  <FieldError message={errors.research_details?.academic_entity?.message} />
                </Field>
                <Field>
                  <FieldLabel>موعد التسليم</FieldLabel>
                  <Input type="date" {...register("research_details.delivery_date")} />
                  <FieldError message={errors.research_details?.delivery_date?.message} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="الطباعة والتجليد" icon={<Copy className="h-4 w-4" />}>
              <div className="space-y-5">
                <Field>
                  <FieldLabel>خيار الطباعة</FieldLabel>
                  <ChoiceButtonGroup
                    options={[
                      { value: "yes", title: "طبع" },
                      { value: "no", title: "بدون طبع" },
                    ]}
                    value={researchDetails.print_enabled ? "yes" : "no"}
                    onChange={(value) => {
                      const enabled = value === "yes";
                      setValue("research_details.print_enabled", enabled, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                      if (!enabled) {
                        setValue("research_details.copy_count", 0, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                </Field>

                {researchDetails.print_enabled ? (
                  <Field>
                    <FieldLabel>عدد النسخ</FieldLabel>
                    <ChoiceButtonGroup
                      gridClassName="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
                      options={RESEARCH_COPY_OPTIONS.map((count) => ({
                        value: String(count),
                        title: getResearchCopyLabel(count),
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
                    <FieldError message={errors.research_details?.copy_count?.message} />
                  </Field>
                ) : null}

                <Field>
                  <FieldLabel>التجليد أو التغليف</FieldLabel>
                  <ChoiceButtonGroup
                    options={RESEARCH_BINDING_TYPES.map((item) => ({ value: item, title: item }))}
                    value={researchDetails.binding_type ?? ""}
                    onChange={(value) =>
                      setValue("research_details.binding_type", value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  <FieldError message={errors.research_details?.binding_type?.message} />
                </Field>
              </div>
            </SectionCard>
          </>
        ) : null}

        {service.serviceType === "Graduation" ? (
          <>
            <SectionCard title="الموقع والموعد" icon={<MapPin className="h-4 w-4" />}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel>المحافظة</FieldLabel>
                  <Input {...register("service_details.province")} placeholder="المحافظة" />
                  <FieldError message={errors.service_details?.province?.message} />
                </Field>
                <Field>
                  <FieldLabel>العنوان</FieldLabel>
                  <Input {...register("service_details.address")} placeholder="العنوان" />
                  <FieldError message={errors.service_details?.address?.message} />
                </Field>
                <Field>
                  <FieldLabel>وقت الحجز</FieldLabel>
                  <Input type="time" {...register("service_details.booking_time")} />
                  <FieldError message={errors.service_details?.booking_time?.message} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="تفاصيل التخرج" icon={<ShieldCheck className="h-4 w-4" />}>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Field>
                  <FieldLabel>نوع التجهيز</FieldLabel>
                  <Select {...register("graduation_details.package_type")}>
                    <option value="" className="bg-black">اختر</option>
                    {GRADUATION_PACKAGE_TYPES.map((item) => (
                      <option key={item} value={item} className="bg-black">{item}</option>
                    ))}
                  </Select>
                  <FieldError message={errors.graduation_details?.package_type?.message} />
                </Field>
                <Field>
                  <FieldLabel>نوع الوشاح</FieldLabel>
                  <Select {...register("graduation_details.sash_type")}>
                    <option value="" className="bg-black">اختر</option>
                    {GRADUATION_SASH_TYPES.map((item) => (
                      <option key={item} value={item} className="bg-black">{item}</option>
                    ))}
                  </Select>
                  <FieldError message={errors.graduation_details?.sash_type?.message} />
                </Field>
                <Field>
                  <FieldLabel>نوع الروب</FieldLabel>
                  <Select {...register("graduation_details.robe_type")}>
                    <option value="" className="bg-black">اختر</option>
                    {GRADUATION_ROBE_TYPES.map((item) => (
                      <option key={item} value={item} className="bg-black">{item}</option>
                    ))}
                  </Select>
                  <FieldError message={errors.graduation_details?.robe_type?.message} />
                </Field>
                <Field>
                  <FieldLabel>نوع الكتابة</FieldLabel>
                  <Select {...register("graduation_details.writing_type")}>
                    <option value="" className="bg-black">اختر</option>
                    {GRADUATION_WRITING_TYPES.map((item) => (
                      <option key={item} value={item} className="bg-black">{item}</option>
                    ))}
                  </Select>
                  <FieldError message={errors.graduation_details?.writing_type?.message} />
                </Field>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel>طول الوشاح</FieldLabel>
                  <Input {...register("graduation_details.measurements.sash_length")} />
                  <FieldError message={errors.graduation_details?.measurements?.sash_length?.message} />
                </Field>
                <Field>
                  <FieldLabel>الكتف</FieldLabel>
                  <Input {...register("graduation_details.measurements.shoulder")} />
                  <FieldError message={errors.graduation_details?.measurements?.shoulder?.message} />
                </Field>
                <Field>
                  <FieldLabel>طول الروب</FieldLabel>
                  <Input {...register("graduation_details.measurements.robe_length")} />
                  <FieldError message={errors.graduation_details?.measurements?.robe_length?.message} />
                </Field>
                <Field>
                  <FieldLabel>اليد</FieldLabel>
                  <Input {...register("graduation_details.measurements.hand")} />
                  <FieldError message={errors.graduation_details?.measurements?.hand?.message} />
                </Field>
              </div>

              <div className="mt-5">
                <FieldLabel>القبعة</FieldLabel>
                <ChoiceButtonGroup
                  options={[
                    { value: "yes", title: "مضافة" },
                    { value: "no", title: "غير مضافة" },
                  ]}
                  value={graduationDetails.has_cap ? "yes" : "no"}
                  onChange={(value) =>
                    setValue("graduation_details.has_cap", value === "yes", {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </SectionCard>
          </>
        ) : null}

        {service.serviceType === "Gifts" ? (
          <SectionCard title="تفاصيل الهدية" icon={<Package className="h-4 w-4" />}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel>المحافظة</FieldLabel>
                <Input {...register("service_details.province")} placeholder="المحافظة" />
                <FieldError message={errors.service_details?.province?.message} />
              </Field>
              <Field>
                <FieldLabel>العنوان</FieldLabel>
                <Input {...register("service_details.address")} placeholder="العنوان" />
                <FieldError message={errors.service_details?.address?.message} />
              </Field>
              <Field>
                <FieldLabel>نوع الهدية</FieldLabel>
                <Input {...register("service_details.gift_type")} placeholder="نوع الهدية" />
                <FieldError message={errors.service_details?.gift_type?.message} />
              </Field>
              <Field>
                <FieldLabel>اسم المستلم</FieldLabel>
                <Input {...register("service_details.recipient_name")} placeholder="اسم المستلم" />
                <FieldError message={errors.service_details?.recipient_name?.message} />
              </Field>
              <Field>
                <FieldLabel>تاريخ المناسبة</FieldLabel>
                <Input type="date" {...register("service_details.occasion_date")} />
                <FieldError message={errors.service_details?.occasion_date?.message} />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>رسالة الهدية</FieldLabel>
                <Textarea {...register("service_details.gift_message")} rows={4} />
              </Field>
            </div>
          </SectionCard>
        ) : null}

        {showReferenceImages ? (
          <SectionCard title={service.serviceType === "Album" ? "رفع الصور" : "صور مرجعية"} icon={<ImagePlus className="h-4 w-4" />}>
            <UploadField
              accept="image/*"
              helper="JPG / PNG / WEBP"
              files={referenceFiles}
              onChange={(files) => setReferenceFiles(files)}
            />
          </SectionCard>
        ) : null}

        {service.serviceType === "Research" ? (
          <SectionCard title="رفع ملفات البحث" icon={<FileText className="h-4 w-4" />}>
            <UploadField
              accept="application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              helper="PDF / Word"
              files={researchFiles}
              onChange={(files) => setResearchFiles(files)}
            />
          </SectionCard>
        ) : null}

        <SectionCard title="ملاحظات" icon={<Phone className="h-4 w-4" />}>
          <Textarea {...register("notes")} rows={4} placeholder="ملاحظات إضافية" />
          <FieldError message={errors.notes?.message} />
        </SectionCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} className="min-w-[180px]">
            {submitting ? "جارِ الإرسال..." : "إرسال الطلب"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-ajn-line bg-white/[0.03] p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ajn-gold/16 bg-ajn-gold/10 text-ajn-goldSoft">
          {icon}
        </span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function UploadField({
  accept,
  helper,
  files,
  onChange,
}: {
  accept: string;
  helper: string;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  return (
    <>
      <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-[26px] border border-dashed border-ajn-line bg-black/20 p-6 text-center transition hover:border-ajn-gold/35">
        <ImagePlus className="mb-3 h-7 w-7 text-ajn-gold" />
        <span className="text-sm font-semibold text-white">اختر الملفات</span>
        <span className="mt-2 text-xs text-ajn-muted">{helper}</span>
        <input
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(event) => onChange(Array.from(event.target.files ?? []))}
        />
      </label>

      {files.length ? (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="rounded-2xl border border-ajn-line bg-white/[0.04] px-4 py-3 text-sm text-ajn-ivory"
            >
              {file.name}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

function Field({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm text-ajn-goldSoft">{children}</label>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-red-300">{message}</p> : null;
}
