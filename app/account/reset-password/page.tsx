import { CustomerAuthForm } from "@/components/account/customer-auth-form";

export const dynamic = "force-dynamic";

export default function AccountResetPasswordPage() {
  return <CustomerAuthForm mode="reset" />;
}
