import { redirect } from "next/navigation";

import { CustomerDashboardClient } from "@/components/account/customer-dashboard-client";
import { getCustomerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getCustomerSession();

  if (!session) {
    redirect("/account/login");
  }

  return <CustomerDashboardClient />;
}
