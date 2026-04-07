import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const POMODORO_DURATION = 25 * 60; // 25 minutes
export const BREAK_DURATION = 5 * 60; // 5 minutes

export type TimerType = 'pomodoro' | 'stopwatch';
export type TimerMode = 'work' | 'break';

interface FocusTimerState {
  timerType: TimerType;
  mode: TimerMode;
  isActive: boolean;
  timeLeft: number; // For pomodoro
  secondsElapsed: number; // For stopwatch
  subjectLabel: string | null;
  communityId: string | null;
  lastTickTimestamp: number | null;

  setTimerType: (type: TimerType) => void;
  setLabel: (label: string | null) => void;
  setCommunityId: (id: string | null) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setMode: (mode: TimerMode) => void;
  switchMode: () => void;
  catchUp: () => void;
}

export const useFocusTimerStore = create<FocusTimerState>()(
  persist(
    (set, get) => ({
      timerType: 'pomodoro',
      mode: 'work',
      isActive: false,
      timeLeft: POMODORO_DURATION,
      secondsElapsed: 0,
      subjectLabel: null,
      communityId: null,
      lastTickTimestamp: null,

      setTimerType: (type) =>
        set({
          timerType: type,
          isActive: false,
          timeLeft: type === 'pomodoro' ? POMODORO_DURATION : 0,
          secondsElapsed: 0,
        }),

      setLabel: (label) => set({ subjectLabel: label }),
      
      setCommunityId: (id) => set({ communityId: id }),

      startTimer: () =>
        set({
          isActive: true,
          lastTickTimestamp: Date.now(),
        }),

      pauseTimer: () =>
        set({
          isActive: false,
          lastTickTimestamp: null,
        }),

      setMode: (mode) => set({ mode }),

      resetTimer: () => {
        const currentMode = get().mode;
        set({
          isActive: false,
          timeLeft: currentMode === 'work' ? POMODORO_DURATION : BREAK_DURATION,
          secondsElapsed: 0,
          lastTickTimestamp: null,
        });
      },

      switchMode: () => {
        const currentMode = get().mode;
        if (currentMode === 'work') {
          set({
            mode: 'break',
            timeLeft: BREAK_DURATION,
            isActive: false,
            lastTickTimestamp: null,
          });
        } else {
          set({
            mode: 'work',
            timeLeft: POMODORO_DURATION,
            isActive: false,
            lastTickTimestamp: null,
          });
        }
      },

      tick: () => {
        const state = get();
        if (!state.isActive) return;

        const now = Date.now();
        const deltaSeconds = state.lastTickTimestamp 
          ? Math.round((now - state.lastTickTimestamp) / 1000) 
          : 1;

        if (state.timerType === 'stopwatch') {
          set({
            secondsElapsed: state.secondsElapsed + deltaSeconds,
            lastTickTimestamp: now,
          });
        } else {
          // Pomodoro logic
          const newTimeLeft = Math.max(0, state.timeLeft - deltaSeconds);
          set({
            timeLeft: newTimeLeft,
            lastTickTimestamp: now,
          });
          
          if (newTimeLeft === 0) {
            set({ isActive: false, lastTickTimestamp: null });
            // The component handles calling the API and automatically switching modes
          }
        }
      },

      catchUp: () => {
        const state = get();
        if (!state.isActive || !state.lastTickTimestamp) return;

        const now = Date.now();
        const deltaSeconds = Math.floor((now - state.lastTickTimestamp) / 1000);
        
        if (deltaSeconds > 0) {
          if (state.timerType === 'stopwatch') {
            set({
              secondsElapsed: state.secondsElapsed + deltaSeconds,
              lastTickTimestamp: now,
            });
          } else {
            const newTimeLeft = Math.max(0, state.timeLeft - deltaSeconds);
            set({
              timeLeft: newTimeLeft,
              lastTickTimestamp: Math.max(now, state.lastTickTimestamp + deltaSeconds * 1000), // Approximate catchup timestamp
            });
            if (newTimeLeft === 0) {
              set({ isActive: false, lastTickTimestamp: null });
            }
          }
        }
      },
    }),
    {
      name: 'modulus-focus-timer', // unique name
      partialize: (state) => ({
        // only persist what we need
        timerType: state.timerType,
        mode: state.mode,
        isActive: state.isActive,
        timeLeft: state.timeLeft,
        secondsElapsed: state.secondsElapsed,
        subjectLabel: state.subjectLabel,
        communityId: state.communityId,
        lastTickTimestamp: state.lastTickTimestamp,
      }),
    }
  )
);
