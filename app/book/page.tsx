import { CustomerBookingForm } from "@/components/booking/customer-booking-form";

export default function BookPage() {
  return (
    <div className="page-shell pb-24">
      <div className="section-shell pt-5 sm:pt-8">
        <CustomerBookingForm />
      </div>
    </div>
  );
}
