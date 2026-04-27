"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Activity } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface AnalyticsData {
  barChartData: Array<{ name: string; hours: number }>;
  lineChartData: Array<{ date: string; hours: number }>;
}

export function PersonalAnalytics({ communityId }: { communityId: string }) {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["focus", communityId, "analytics"],
    enabled: !!communityId,
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}/focus/me/analytics`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="bg-card border-2 border-foreground rounded-[24px] shadow-[4px_4px_0px_black] p-6 lg:p-8 animate-pulse text-center">
        <Activity className="w-8 h-8 mx-auto mb-4 text-gray-300 animate-bounce" />
        <p>Crunching the numbers...</p>
      </div>
    );
  }

  const hasData = data && (data.barChartData.length > 0 || data.lineChartData.length > 0);
  const tooltipStyle: React.CSSProperties = {
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    borderRadius: "12px",
    border: "2px solid #000000",
    borderBottomWidth: "4px",
    borderRightWidth: "4px",
    boxShadow: "4px 4px 0px #000000",
    fontWeight: "bold",
  };
  const tooltipLabelStyle: React.CSSProperties = {
    color: "var(--popover-foreground)",
    fontWeight: 800,
  };
  const tooltipItemStyle: React.CSSProperties = {
    color: "var(--popover-foreground)",
  };

  return (
    <div className="bg-card border-2 border-foreground rounded-[24px] shadow-[4px_4px_0px_black] p-6 lg:p-8">
      <div className="flex items-center mb-8">
        <Activity className="text-[#0057FF] w-6 h-6 mr-3" strokeWidth={3} />
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Personal Analytics</h2>
      </div>

      {!hasData ? (
        <div className="text-center py-12 text-gray-500 font-medium border-2 border-dashed border-border rounded-xl">
          <Activity className="w-12 h-12 text-muted mx-auto mb-3" />
          Log a session to track your stats.
        </div>
      ) : (
        <div className="space-y-12">
          {/* Label Bar Chart */}
          <div className="pt-2">
            <h3 className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-6 flex items-center">
              Hours per Subject
            </h3>
            <div className="h-64 w-full border-b-2 border-foreground">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.barChartData}>
                  <XAxis dataKey="name" tick={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }} axisLine={{ stroke: 'var(--foreground)', strokeWidth: 2 }} tickLine={false} dy={10} />
                  <YAxis tick={{ fontFamily: "'Space Grotesk', sans-serif" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any) => [formatDuration(value * 3600), "Time Focused"]}
                    cursor={{ fill: 'rgba(255, 214, 0, 0.2)' }} 
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Bar dataKey="hours" fill="#0057FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time Line Chart */}
          <div className="pt-2">
            <h3 className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-6 flex items-center">
              Focus Trajectory
            </h3>
            <div className="h-64 w-full border-b-2 border-foreground">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12 }} axisLine={{ stroke: 'var(--foreground)', strokeWidth: 2 }} tickLine={false} dy={10} minTickGap={30} />
                  <YAxis tick={{ fontFamily: "'Space Grotesk', sans-serif" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any) => [formatDuration(value * 3600), "Time Focused"]}
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Line type="monotone" dataKey="hours" stroke="#FF6B00" strokeWidth={4} activeDot={{ r: 8, fill: "#FFD600", stroke: "var(--foreground)", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
