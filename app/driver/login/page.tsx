import { redirect } from "next/navigation";

import { DeliveryAgentLoginForm } from "@/components/driver/delivery-agent-login-form";
import { getDriverSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DriverLoginPage() {
  const session = await getDriverSession();

  if (session) {
    redirect("/driver");
  }

  return <DeliveryAgentLoginForm />;
}
