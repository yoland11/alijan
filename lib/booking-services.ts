import type { ServiceType } from "@/lib/types";

export interface BookingServiceConfig {
  slug: string;
  serviceType: ServiceType;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
}

export const BOOKING_SERVICES: BookingServiceConfig[] = [
  {
    slug: "koshat",
    serviceType: "Koshat",
    title: "حجز الكوشات",
    shortTitle: "كوشات",
    subtitle: "الكوشات والتنسيق",
    description: "تفاصيل الحجز والتنفيذ",
  },
  {
    slug: "photography",
    serviceType: "Session",
    title: "طلب التصوير",
    shortTitle: "التصوير",
    subtitle: "جلسات وتصوير مناسبات",
    description: "موعد وموقع وكادر التصوير",
  },
  {
    slug: "albums",
    serviceType: "Album",
    title: "طلب الألبومات",
    shortTitle: "ألبومات",
    subtitle: "ألبومات وتصميم",
    description: "نوع الألبوم والصفحات والغلاف",
  },
  {
    slug: "research",
    serviceType: "Research",
    title: "طلب البحوث",
    shortTitle: "بحوث",
    subtitle: "كتابة وطباعة البحوث",
    description: "ملفات وتجليد وموعد تسليم",
  },
  {
    slug: "graduation",
    serviceType: "Graduation",
    title: "طلب تجهيزات التخرج",
    shortTitle: "تجهيزات تخرج",
    subtitle: "روب ووشاح وتفاصيل القياس",
    description: "قياسات وخيارات التخرج",
  },
  {
    slug: "gifts",
    serviceType: "Gifts",
    title: "طلب الهدايا",
    shortTitle: "هدايا",
    subtitle: "هدايا وتغليف",
    description: "نوع الهدية والعنوان والمناسبة",
  },
];

export function getBookingServiceBySlug(slug: string) {
  return BOOKING_SERVICES.find((service) => service.slug === slug) ?? null;
}

export function getBookingServiceByType(serviceType: ServiceType) {
  return BOOKING_SERVICES.find((service) => service.serviceType === serviceType) ?? null;
}
