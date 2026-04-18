import { ArrowLeft, CheckCircle2, Clock3, Images, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { HomeSearchCard } from "@/components/home/home-search-card";
import { HeroSlider } from "@/components/home/hero-slider";

export default function HomePage() {
  return (
    <div className="page-shell pb-24">
      <div className="section-shell pt-8">
        <nav className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-full border border-ajn-line bg-black/30 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="font-display text-xl uppercase tracking-[0.4em] text-ajn-goldSoft">AJN</p>
            <p className="text-sm text-ajn-muted">Booking & Order Tracking</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link className="text-ajn-muted transition hover:text-white" href="/track">
              التتبع
            </Link>
            <Link className="text-ajn-muted transition hover:text-white" href="/admin/login">
              الإدارة
            </Link>
          </div>
        </nav>

        <section className="surface-panel-strong noise-overlay rounded-[34px] p-6 sm:p-8 lg:p-10">
          <HeroSlider />
        </section>

        <section className="grid gap-6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-panel p-6 sm:p-8">
            <div className="mb-5">
              <p className="mb-2 text-sm text-ajn-goldSoft">ابدأ من هنا</p>
              <h2 className="text-3xl font-bold text-white">تتبع الطلب خلال ثوانٍ</h2>
            </div>

            <HomeSearchCard />

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/track"
                className="inline-flex items-center gap-2 text-sm font-semibold text-ajn-gold transition hover:text-ajn-goldSoft"
              >
                فتح صفحة التتبع الكاملة
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="دخول إدارة محمي"
              description="جلسة آمنة لإدارة الطلبات والتحديثات الداخلية."
            />
            <FeatureCard
              icon={<Images className="h-5 w-5" />}
              title="رفع صور الطلب"
              description="إضافة معاينات الألبومات والجلسات مباشرة لكل عميل."
            />
            <FeatureCard
              icon={<Clock3 className="h-5 w-5" />}
              title="تحديثات فورية"
              description="مزامنة الحالة بين لوحة الإدارة وصفحة العميل بشكل لحظي."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="رحلة واضحة للطلب"
              description="Timeline عربي يوضح المنجز والحالة الحالية والقادم."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="surface-panel p-6">
      <div className="mb-4 inline-flex rounded-2xl bg-ajn-gold/15 p-3 text-ajn-gold">{icon}</div>
      <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
      <p className="leading-8 text-ajn-muted">{description}</p>
    </div>
  );
}
