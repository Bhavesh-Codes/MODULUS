import { redirect } from "next/navigation";

export default function HomePage() {
  // If the user is unauthenticated, proxy.ts already redirects them to /login
  // If they are authenticated and land on the root, we send them straight to their dashboard.
  redirect("/dashboard");
}
