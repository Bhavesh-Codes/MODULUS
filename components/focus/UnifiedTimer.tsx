"use client";

import React, { useEffect, useState } from "react";
import { useFocusTimerStore } from "@/lib/stores/useFocusTimerStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDuration } from "@/lib/utils";

export function UnifiedTimer({ communityId }: { communityId: string }) {
  const queryClient = useQueryClient();
  const {
    timerType,
    setTimerType,
    isActive,
    timeLeft,
    secondsElapsed,
    subjectLabel,
    setLabel,
    startTimer,
    pauseTimer,
    resetTimer,
    tick,
    catchUp,
    setCommunityId,
    mode,
    switchMode,
  } = useFocusTimerStore();

  const [inputVal, setInputVal] = useState(subjectLabel || "");

  // Update store communityId if it changes
  useEffect(() => {
    setCommunityId(communityId);
    // ensure we catch up immediately on mount
    catchUp();
  }, [communityId]);

  // Tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, tick]);

  // Handle auto-complete for pomodoro
  const saveSession = useMutation({
    mutationFn: async ({ duration }: { duration: number }) => {
      const res = await fetch(`/api/communities/${communityId}/focus/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: subjectLabel,
          timer_type: timerType,
          duration_seconds: Math.round(duration),
        }),
      });
      if (!res.ok) {
         console.error('Save session response not ok:', await res.text());
         throw new Error("Failed to save session");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["focus", communityId] });
      toast.success(`Session saved: ${formatDuration(Math.round(variables.duration))}`);
    },
    onError: () => {
      toast.error("Could not save session. Please try again.");
    },
  });

  // Check if pomodoro finished
  useEffect(() => {
    if (timerType === "pomodoro" && isActive === false && timeLeft === 0) {
       if (mode === "work" && subjectLabel) {
         // Only save if we actually started it and it reached 0 organically
         const dur = 25 * 60; // 25 mins pomodoro
         saveSession.mutateAsync({ duration: dur }).then(() => {
           switchMode();
           toast.info("Time for a break!", { icon: "☕" });
         }).catch(console.error);
       } else if (mode === "break") {
         switchMode();
         toast.info("Break is over! Select a label and hit Start Focusing.", { icon: "🎯" });
       }
    }
  }, [timeLeft, isActive, timerType, mode, subjectLabel, switchMode]);

  // Fetch Labels
  const { data: labels = [] } = useQuery({
    queryKey: ["focusLabels", communityId],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}/focus/labels`);
      if (!res.ok) throw new Error("Failed to fetch labels");
      return res.json() as Promise<string[]>;
    },
  });

  const formatPomodoroTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const currentDisplayTime = timerType === "pomodoro" ? timeLeft : secondsElapsed;

  const handleStop = async () => {
    if (!isActive) return;
    pauseTimer();
    
    // For stopwatch, manual stop should trigger save if time > 0
    if (timerType === "stopwatch" && secondsElapsed > 0) {
      try {
        await saveSession.mutateAsync({ duration: secondsElapsed });
        resetTimer();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="bg-white border-2 border-black rounded-[24px] shadow-[4px_4px_0px_#0A0A0A] p-6 lg:p-8 flex flex-col items-center">
      
      {/* Tabs */}
      <div className="flex px-1 py-1 mb-6 bg-[#F5F5F0] border-2 border-black rounded-full shadow-[3px_3px_0px_#0A0A0A]">
        <button
          onClick={() => { if (!isActive) { setTimerType("pomodoro"); if(mode==='break')switchMode(); } }}
          className={`px-6 py-2 rounded-full font-bold transition-all text-sm ${
            timerType === "pomodoro" ? "bg-[#FFD600] border-2 border-black shadow-[3px_3px_0px_#0A0A0A]" : "text-black border-2 border-transparent"
          }`}
          disabled={isActive}
        >
          Pomodoro
        </button>
        <button
          onClick={() => { if (!isActive) { setTimerType("stopwatch"); if(mode==='break')switchMode(); } }}
          className={`px-6 py-2 rounded-full font-bold transition-all text-sm ${
            timerType === "stopwatch" ? "bg-[#FFD600] border-2 border-black shadow-[3px_3px_0px_#0A0A0A]" : "text-black border-2 border-transparent"
          }`}
          disabled={isActive}
        >
          Stopwatch
        </button>
      </div>

      {mode === "break" && timerType === "pomodoro" && (
        <div className="mb-4 text-[#0057FF] font-bold tracking-tight uppercase flex items-center">
          ☕ Break Time
        </div>
      )}

      {/* Timer Display */}
      <motion.div 
        animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
        transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
        className={`text-[4rem] lg:text-[6rem] font-extrabold tracking-tighter mb-8 leading-none ${mode === 'break' ? 'text-[#0057FF]' : 'text-black'}`}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {timerType === "pomodoro" ? formatPomodoroTime(currentDisplayTime) : formatDuration(currentDisplayTime)}
      </motion.div>

      {/* Label Select  */}
      {mode === "work" && (
        <div className="w-full max-w-xs mb-8 relative">
          <label className="block text-sm font-medium mb-1 font-mono text-gray-700">Study Label</label>
          <div className="relative border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_#0A0A0A]">
            <Input 
               list="focus-labels"
               placeholder="e.g. Math, Coding, Reading"
               value={inputVal}
               onChange={(e) => {
                 setInputVal(e.target.value);
                 setLabel(e.target.value.trim() || null);
               }}
               disabled={isActive}
               className="w-full border-none rounded-none focus-visible:ring-0 text-base"
            />
            <datalist id="focus-labels">
              {labels.map((l: string) => <option key={l} value={l} />)}
            </datalist>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex space-x-4">
        {!isActive ? (
          <Button 
            className={`rounded-[14px] border-[3px] border-black font-bold h-14 px-8 text-lg hover:-translate-y-1 transition-transform relative group hover:shadow-none shadow-[6px_6px_0px_#0A0A0A] active:translate-x-[6px] active:translate-y-[6px] ${mode === 'break' ? 'bg-[#0057FF] text-white' : 'bg-[#FFD600] text-black'}`}
            onClick={startTimer}
            disabled={mode === 'work' && !subjectLabel}
          >
            <Play className={`mr-2 h-6 w-6 ${mode === 'break' ? 'fill-white' : 'fill-black'}`} />
            {mode === 'break' ? 'Start Break' : 'Start Focusing'}
          </Button>
        ) : (
          <Button 
            className="rounded-[14px] bg-[#FF3B30] border-[3px] border-black text-white font-bold h-14 px-8 text-lg hover:-translate-y-1 transition-transform relative group hover:shadow-none shadow-[6px_6px_0px_#0A0A0A] active:translate-x-[6px] active:translate-y-[6px]"
            onClick={handleStop}
          >
            <Pause className="mr-2 h-6 w-6 fill-white" />
            {timerType === 'stopwatch' ? 'Stop & Save' : 'Pause'}
          </Button>
        )}
        <Button 
          variant="outline"
          className="rounded-[14px] bg-white border-[2px] border-black text-black font-bold h-14 px-4 hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_#0A0A0A] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
          onClick={resetTimer}
          disabled={isActive || (timerType === 'pomodoro' && timeLeft === (mode === 'work' ? 25 * 60 : 5 * 60)) || (timerType === 'stopwatch' && secondsElapsed === 0)}
          title="Reset"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
        
        {mode === 'break' && !isActive && (
          <Button
            variant="outline"
            className="rounded-[14px] bg-white border-[2px] border-black text-black font-bold h-14 px-6 hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_#0A0A0A] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            onClick={() => switchMode()}
          >
            Skip Break
          </Button>
        )}
      </div>

    </div>
  );
}
