import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <div className="page-shell flex min-h-screen items-center px-4 py-10 sm:py-14">
      <div className="section-shell">
        <div className="surface-panel-strong noise-overlay overflow-hidden rounded-[36px] border border-ajn-gold/18">
          <div className="grid min-h-[78vh] gap-0 lg:grid-cols-[1.1fr_480px]">
            <div className="relative hidden overflow-hidden lg:block">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.22),transparent_26%),linear-gradient(140deg,rgba(8,8,8,0.9),rgba(4,4,4,0.76))]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.4))]" />
              <div className="relative flex h-full flex-col justify-between p-10">
                <div className="inline-flex w-max items-center gap-2 rounded-full border border-ajn-gold/18 bg-black/35 px-4 py-2 text-xs font-semibold tracking-[0.24em] text-ajn-goldSoft">
                  <span className="h-1.5 w-1.5 rounded-full bg-ajn-gold" />
                  AJN ADMIN
                </div>

                <div className="max-w-xl space-y-5 text-right">
                  <p className="text-sm font-semibold text-ajn-goldSoft">لوحة تحكم AJN</p>
                  <h1 className="font-display text-6xl font-semibold leading-[0.9] text-white">
                    إدارة
                    <span className="mt-2 block bg-gradient-to-l from-[#f7e4a2] via-[#d4af37] to-[#fff6d0] bg-clip-text text-transparent">
                      منظمة
                    </span>
                  </h1>
                  <p className="max-w-md text-sm leading-8 text-white/76">
                    متابعة الطلبات والمتجر والأعمال من لوحة واحدة.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-right">
                    <p className="text-sm font-semibold text-white">الطلبات</p>
                    <p className="mt-1 text-xs text-ajn-muted">متابعة سريعة</p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-right">
                    <p className="text-sm font-semibold text-white">المتجر</p>
                    <p className="mt-1 text-xs text-ajn-muted">طلبات ومخزون</p>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-right">
                    <p className="text-sm font-semibold text-white">الإحصائيات</p>
                    <p className="mt-1 text-xs text-ajn-muted">تقارير واضحة</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
