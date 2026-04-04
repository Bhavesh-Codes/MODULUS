import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Gracefully bounce users resolving directly to /dashboard natively over to the Vault
  redirect("/vault");
}
