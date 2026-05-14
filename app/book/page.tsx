import Link from "next/link";
import { ArrowLeft, Camera, FileText, Gift, GraduationCap, Images, Sparkles } from "lucide-react";

import { BOOKING_SERVICES } from "@/lib/booking-services";

const iconMap = {
  Koshat: Sparkles,
  Session: Camera,
  Album: Images,
  Research: FileText,
  Graduation: GraduationCap,
  Gifts: Gift,
} as const;

export default function BookPage() {
  return (
    <div className="page-shell pb-24">
      <div className="section-shell pt-6 sm:pt-8">
        <section className="surface-panel-strong noise-overlay p-6 sm:p-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.24em] text-ajn-goldSoft">AJN BOOKING</p>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">اختر الخدمة</h1>
            <p className="mt-3 text-sm text-ajn-muted">كل خدمة لها صفحة طلب مستقلة وحقولها الخاصة.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {BOOKING_SERVICES.map((service) => {
              const Icon = iconMap[service.serviceType];

              return (
                <Link
                  key={service.slug}
                  href={`/book/${service.slug}`}
                  className="group overflow-hidden rounded-[30px] border border-white/8 bg-black/30 p-5 transition hover:border-ajn-gold/28 hover:bg-white/[0.04]"
                >
                  <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-[20px] border border-ajn-gold/18 bg-ajn-gold/10 text-ajn-goldSoft">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-semibold tracking-[0.22em] text-ajn-goldSoft">{service.subtitle}</p>
                  <h2 className="mt-3 text-2xl font-bold text-white">{service.shortTitle}</h2>
                  <p className="mt-2 text-sm text-ajn-muted">{service.description}</p>
                  <div className="mt-5 flex items-center justify-between text-sm font-semibold text-ajn-goldSoft">
                    <span>ابدأ الطلب</span>
                    <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
