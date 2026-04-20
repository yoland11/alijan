import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { HomeSearchCard } from "@/components/home/home-search-card";

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

        <section className="py-8">
          <div className="surface-panel mx-auto max-w-4xl p-6 sm:p-8">
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
        </section>
      </div>
    </div>
  );
}
