export default function Loading() {
  return (
    <div className="page-shell pb-24 pt-10">
      <div className="section-shell space-y-6">
        <div className="shimmer-skeleton h-[18rem] rounded-[32px] sm:h-[22rem]" />
        <div className="shimmer-skeleton h-16 rounded-[28px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="surface-panel p-4">
              <div className="shimmer-skeleton mb-4 h-56 rounded-[24px]" />
              <div className="shimmer-skeleton mb-3 h-5 rounded-full" />
              <div className="shimmer-skeleton mb-3 h-4 w-2/3 rounded-full" />
              <div className="shimmer-skeleton h-10 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
