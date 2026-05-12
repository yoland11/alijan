import { redirect } from "next/navigation";

import { CustomerAuthForm } from "@/components/account/customer-auth-form";
import { getCustomerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountRegisterPage() {
  const session = await getCustomerSession();

  if (session) {
    redirect("/account");
  }

  return <CustomerAuthForm mode="register" />;
}
