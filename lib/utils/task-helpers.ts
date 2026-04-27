export function getRelativeTimeString(dateString: string | null) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  
  // Strip time portion to compare only dates
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays === -1) return "Due yesterday";
  if (diffDays > 1) return `Due in ${diffDays} days`;
  return `Overdue by ${Math.abs(diffDays)} days`;
}

export function isTaskOverdue(task: { deadline: string | null; status: string }) {
  if (!task.deadline) return false;
  // Use local ISO format date string for today to match how it's stored
  const todayObj = new Date();
  const y = todayObj.getFullYear();
  const m = String(todayObj.getMonth() + 1).padStart(2, '0');
  const d = String(todayObj.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  return task.deadline < todayStr && task.status !== "done";
}

export function getPriorityColor(priority: string | null) {
  switch (priority) {
    case 'high': return 'bg-[#FF3B30]';
    case 'medium': return 'bg-[#FFD600]';
    case 'low': return 'bg-[#00C853]';
    default: return 'bg-[#E8E8E0]';
  }
}
