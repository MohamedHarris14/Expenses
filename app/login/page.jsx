import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  const session = getSession();
  if (session) {
    redirect("/");
  }
  return <LoginForm />;
}
