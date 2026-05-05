import { ArrowLeft, ClipboardPlus, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-shell pb-24">
      <div className="section-shell space-y-8 pt-5 sm:space-y-10 sm:pt-8">
        <section className="surface-panel-strong noise-overlay overflow-hidden p-5 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ajn-line bg-white/[0.04] px-4 py-2 text-xs font-semibold text-ajn-goldSoft">
                <ShieldCheck className="h-4 w-4" />
                لوحة الإدارة
              </div>
              <div className="hero-title-frame mx-auto max-w-2xl">
                <h1 className="hero-title-text">مجموعة علي جان نهاد لتنظيم المناسبات</h1>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <Link
                href="/admin/login"
                className="group inline-flex w-full items-center justify-between gap-3 rounded-[24px] border border-ajn-line bg-white/[0.05] px-4 py-3.5 text-right transition duration-300 hover:-translate-y-1 hover:border-ajn-gold/55 hover:bg-white/[0.08] sm:w-auto sm:min-w-[250px]"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-ajn-gold/15 text-ajn-gold">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-white">دخول للإدارة</p>
                    <p className="mt-1 text-xs text-ajn-muted">دخول فقط للموظفين</p>
                  </div>
                </div>
                <ArrowLeft className="h-4.5 w-4.5 text-ajn-gold transition group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl py-2 sm:py-6">
          <div className="mb-6 text-center sm:mb-8">
            <p className="mb-2 text-sm font-medium text-ajn-goldSoft">خدمات الزبون</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              اختر الخدمة المناسبة لك
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Link
              href="/book"
              className="group surface-panel noise-overlay relative overflow-hidden rounded-[32px] border border-ajn-line/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-ajn-gold/55 hover:bg-white/[0.06] sm:p-7"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_45%)] opacity-70 transition duration-300 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div>
                  <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-[22px] border border-ajn-gold/20 bg-ajn-gold/10 text-ajn-gold shadow-[0_18px_40px_rgba(212,175,55,0.12)]">
                    <ClipboardPlus className="h-6 w-6" />
                  </span>
                  <h3 className="text-2xl font-bold text-white">إنشاء طلب</h3>
                  <p className="mt-3 text-sm leading-8 text-ajn-muted sm:text-base">
                    احجز خدمتك بسهولة وأرسل تفاصيل طلبك مباشرة للإدارة.
                  </p>
                </div>

                <div className="inline-flex items-center gap-3 text-sm font-semibold text-ajn-gold">
                  <span className="inline-flex h-11 items-center rounded-2xl bg-ajn-gold px-5 text-black transition group-hover:bg-ajn-goldSoft">
                    ابدأ الحجز
                  </span>
                  <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                </div>
              </div>
            </Link>

            <Link
              href="/track"
              className="group surface-panel noise-overlay relative overflow-hidden rounded-[32px] border border-ajn-line/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-ajn-gold/55 hover:bg-white/[0.06] sm:p-7"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_42%)] opacity-80 transition duration-300 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div>
                  <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/12 bg-white/[0.05] text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                    <Search className="h-6 w-6" />
                  </span>
                  <h3 className="text-2xl font-bold text-white">تتبع الطلب</h3>
                  <p className="mt-3 text-sm leading-8 text-ajn-muted sm:text-base">
                    أدخل رقم الطلب أو رقم الهاتف لمعرفة حالة طلبك.
                  </p>
                </div>

                <div className="inline-flex items-center gap-3 text-sm font-semibold text-white">
                  <span className="inline-flex h-11 items-center rounded-2xl border border-ajn-line bg-white/[0.05] px-5 transition group-hover:border-ajn-gold/45 group-hover:bg-white/[0.08]">
                    تتبع الآن
                  </span>
                  <ArrowLeft className="h-4 w-4 text-ajn-gold transition group-hover:-translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
