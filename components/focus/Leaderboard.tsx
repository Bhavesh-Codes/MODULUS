"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface LeaderboardUser {
  id: string;
  name: string;
  profile_pic: string | null;
  total_duration: number; // in seconds
}

export function Leaderboard({ communityId }: { communityId: string }) {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["focus", communityId, "leaderboard"],
    enabled: !!communityId,
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}/focus/leaderboard`);
      if (!res.ok) throw new Error("Failed to load leaderboard");
      return res.json() as Promise<LeaderboardUser[]>;
    },
    refetchInterval: 30000, // Background updates every 30s
  });

  if (isLoading) {
    return (
      <div className="bg-card border-2 border-foreground rounded-[24px] shadow-[4px_4px_0px_black] p-6 lg:p-8 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-48 mb-6" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-muted rounded-xl mb-4 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-foreground rounded-[24px] shadow-[4px_4px_0px_black] p-6 lg:p-8 h-full">
      <div className="flex items-center mb-6">
        <Trophy className="text-[#FFD600] w-6 h-6 mr-3" strokeWidth={3} />
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Leaderboard</h2>
      </div>

      <div className="space-y-4">
        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.map((user, index) => (
            <div 
              key={user.id} 
              className={`flex items-center p-4 border-2 border-foreground rounded-xl transition-transform hover:-translate-y-1 hover:shadow-[3px_3px_0px_black] ${index === 0 ? 'bg-[#FFD600]' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-[#F2AE72]' : 'bg-card'}`}
            >
              <div className="w-8 flex justify-center font-bold font-mono">
                {index === 0 ? <Medal className="w-5 h-5" /> : `#${index + 1}`}
              </div>
              
              <div className="ml-4 flex-1">
                <span className="font-semibold block">{user.name || "Anonymous"}</span>
              </div>
              
              <div className="font-mono text-sm font-bold ml-4">
                {formatDuration(user.total_duration)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 font-medium">
            <Trophy className="w-12 h-12 text-muted mx-auto mb-3" />
            No active focus sessions yet.<br/>Be the first to hit the books!
          </div>
        )}
      </div>
    </div>
  );
}
