import { notFound } from "next/navigation";

import { ServiceBookingForm } from "@/components/booking/service-booking-form";
import { getBookingServiceBySlug, BOOKING_SERVICES } from "@/lib/booking-services";

interface BookServicePageProps {
  params: Promise<{ service: string }>;
}

export function generateStaticParams() {
  return BOOKING_SERVICES.map((service) => ({ service: service.slug }));
}

export default async function BookServicePage({ params }: BookServicePageProps) {
  const { service: serviceSlug } = await params;
  const service = getBookingServiceBySlug(serviceSlug);

  if (!service) {
    notFound();
  }

  return (
    <div className="page-shell pb-24">
      <div className="section-shell pt-6 sm:pt-8">
        <ServiceBookingForm key={service.slug} service={service} />
      </div>
    </div>
  );
}
