import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTasks, getCategories } from "@/actions/personal-tasks";
import { TasksPageClient } from "@/components/personal-tasks/TasksPageClient";

export const metadata = {
  title: "Tasks — Modulus",
};

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [tasks, categories] = await Promise.all([
    getTasks(),
    getCategories()
  ]);

  return (
    <TasksPageClient 
      initialTasks={tasks} 
      initialCategories={categories} 
    />
  );
}
