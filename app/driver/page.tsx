import { redirect } from "next/navigation";

import { DeliveryAgentDashboardClient } from "@/components/driver/delivery-agent-dashboard-client";
import { getDriverSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DriverPage() {
  const session = await getDriverSession();

  if (!session) {
    redirect("/driver/login");
  }

  return <DeliveryAgentDashboardClient driverName={session.name} />;
}
