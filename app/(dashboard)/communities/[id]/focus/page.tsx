import { UnifiedTimer } from "@/components/focus/UnifiedTimer";
import { Leaderboard } from "@/components/focus/Leaderboard";
import { PersonalAnalytics } from "@/components/focus/PersonalAnalytics";
import { Suspense } from "react";

export default async function FocusDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <div className="w-full mx-auto space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300 relative">
      <div className="mb-0">
        <h1 className="text-[2.25rem] font-bold tracking-tight mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Focus Dashboard</h1>
        <p className="text-gray-600 font-medium text-lg">Hustle mode activated.</p>
      </div>

      <div className="w-full mb-8">
        <UnifiedTimer communityId={id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        <Leaderboard communityId={id} />
        <PersonalAnalytics communityId={id} />
      </div>
    </div>
  );
}
