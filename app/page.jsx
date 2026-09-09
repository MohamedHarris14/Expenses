import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Dashboard from "@/components/Dashboard";

export default function HomePage() {
  const session = getSession();
  if (!session) {
    redirect("/login");
  }
  return <Dashboard user={session} />;
}
