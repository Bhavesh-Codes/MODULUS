"use client";

import { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Pin, Repeat } from "lucide-react";
import { PersonalTaskWithDetails } from "@/lib/types/personal-tasks";
import { useUpdateTask } from "@/lib/hooks/use-personal-tasks";

interface CalendarViewProps {
  tasks: PersonalTaskWithDetails[];
  onTaskClick: (task: PersonalTaskWithDetails) => void;
  onTaskComplete: (task: PersonalTaskWithDetails) => void;
  onTaskArchive: (task: PersonalTaskWithDetails) => void;
  onTaskDelete: (task: PersonalTaskWithDetails) => void;
}

export function CalendarView({
  tasks,
  onTaskClick,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const updateTaskMutation = useUpdateTask();

  const isOverdue = (task: PersonalTaskWithDetails) => {
    if (!task.deadline) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return task.deadline < todayStr && task.status !== "done";
  };

  const events = tasks.reduce((acc, task) => {
    if (task.status === "archived") return acc;

    let start = task.date;
    if (!start) start = task.deadline;
    if (!start) return acc;

    let end = task.deadline && task.deadline !== start ? task.deadline : undefined;

    let backgroundColor = "#6b7280";
    let borderColor = "#6b7280";

    if (isOverdue(task)) {
      backgroundColor = "#dc2626";
      borderColor = "#dc2626";
    } else {
      switch (task.priority) {
        case "high":
          backgroundColor = "#ef4444";
          borderColor = "#ef4444";
          break;
        case "medium":
          backgroundColor = "#FF9500";
          borderColor = "#FF9500";
          break;
        case "low":
          backgroundColor = "#22c55e";
          borderColor = "#22c55e";
          break;
      }
    }

    acc.push({
      id: task.id,
      title: task.title,
      start,
      ...(end ? { end } : {}),
      backgroundColor,
      borderColor,
      textColor: "#ffffff",
      extendedProps: { task },
    });
    return acc;
  }, [] as any[]);

  const handleEventDrop = async (info: any) => {
    const task = info.event.extendedProps.task;
    const newDate = info.event.startStr;
    try {
      await updateTaskMutation.mutateAsync({ taskId: task.id, fields: { date: newDate } });
    } catch (e) {
      console.error("Failed to move task in calendar", e);
    }
  };

  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps.task;
    onTaskClick(task);
  };

  const renderEventContent = (eventInfo: any) => {
    const task = eventInfo.event.extendedProps.task;
    const isMonthView = eventInfo.view.type === 'dayGridMonth';
    
    return (
      <div className={`flex items-center gap-1 w-full overflow-hidden text-white leading-none ${isMonthView ? 'px-1 py-[1px]' : 'px-2 py-1.5'}`}>
        <div className={`${isMonthView ? 'w-1 h-1' : 'w-2 h-2'} rounded-full bg-white shrink-0`} />
        <span className={`font-vietnam font-semibold whitespace-nowrap overflow-hidden text-ellipsis flex-1 leading-tight ${isMonthView ? 'text-[9px]' : 'text-[13px]'}`}>
          {eventInfo.event.title}
        </span>
        {task.is_pinned && <Pin className={`${isMonthView ? 'w-2.5 h-2.5' : 'w-4 h-4'} shrink-0`} />}
        {task.is_recurring && <Repeat className={`${isMonthView ? 'w-2.5 h-2.5' : 'w-4 h-4'} shrink-0`} />}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 bg-white border-[3px] border-black rounded-[1.5rem] shadow-[6px_6px_0_black] p-4 md:p-6 h-full fc-wrapper overflow-hidden flex flex-col">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
        height="100%"
        editable={true}
        droppable={true}
        dayMaxEvents={false}
        events={events}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventContent={renderEventContent}
        dayHeaderContent={(arg) => {
          const date = arg.date;
          const weekday = date.toLocaleString('default', { weekday: 'short' });
          const day = date.getDate();
          const month = date.getMonth() + 1;
          return `${weekday} ${day}/${month}`;
        }}
        dayCellClassNames={(arg) => {
          return arg.isToday ? 'modulus-today' : '';
        }}
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week'
        }}
      />
      <style jsx global>{`
        .fc-wrapper .fc-toolbar {
          gap: 1.5rem !important;
        }
        .fc-wrapper .fc-toolbar-chunk {
          display: flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
        }
        .fc-wrapper .fc-button-group {
          gap: 0.5rem !important;
        }
        .fc-wrapper .fc-button-group .fc-button {
          margin-left: 0 !important;
        }
        .fc-wrapper {
          --fc-page-bg-color: #ffffff;
          --fc-neutral-bg-color: #F5F5F0;
          --fc-neutral-text-color: #555550;
          --fc-border-color: #0A0A0A;
          --fc-event-text-color: #ffffff;
        }
        .fc-wrapper .fc {
          font-family: 'Be Vietnam Pro', sans-serif;
          height: 100%;
        }

        .fc-wrapper .fc-theme-standard td, 
        .fc-wrapper .fc-theme-standard th {
          border-color: #0A0A0A;
          border-width: 2px;
        }

        .fc-wrapper .fc-theme-standard th {
          background-color: #F5F5F0 !important;
        }

        .fc-wrapper .fc-day-sat, .fc-wrapper .fc-day-sun {
          background-color: #FAFAFA !important;
        }

        .fc-wrapper .fc-theme-standard .fc-scrollgrid {
          border: 3px solid #0A0A0A;
          border-radius: 1rem;
          overflow: hidden;
          background-color: #FFFFFF;
        }

        .fc-wrapper .fc-scroller {
          overflow: hidden !important;
        }

        .fc-wrapper .fc-button {
          background-color: #FFFFFF !important;
          color: #0A0A0A !important;
          border: 2px solid #0A0A0A !important;
          border-radius: 0.875rem !important;
          box-shadow: 3px 3px 0px #0A0A0A !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-weight: 700 !important;
          text-transform: capitalize !important;
          transition: all 0.15s ease !important;
          padding: 0.4rem 1rem !important;
          opacity: 1 !important;
        }

        .fc-wrapper .fc-button:hover {
          transform: translate(3px, 3px) !important;
          box-shadow: none !important;
          background-color: #F5F5F0 !important;
        }

        .fc-wrapper .fc-button-primary:not(:disabled).fc-button-active,
        .fc-wrapper .fc-button-primary:not(:disabled):active {
          background-color: #FFD600 !important;
          color: #0A0A0A !important;
        }
        
        .fc-wrapper .fc-button-primary:disabled {
          background-color: #E8E8E0 !important;
          color: #999990 !important;
          box-shadow: none !important;
          transform: translate(3px, 3px) !important;
        }

        .fc-wrapper .fc-toolbar-title {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-weight: 800 !important;
          font-size: 1.5rem !important;
          color: #0A0A0A !important;
        }

        .fc-wrapper .fc-col-header-cell-cushion {
          font-family: 'Space Grotesk', sans-serif !important;
          font-weight: 500 !important;
          color: #0A0A0A !important;
          padding: 0.75rem !important;
        }

        .fc-wrapper .modulus-today {
          background-color: #FFFDE7 !important;
        }

        .fc-wrapper .fc-daygrid-day-number {
          font-family: 'Space Grotesk', sans-serif !important;
          font-weight: 700 !important;
          color: #0A0A0A !important;
          padding: 0.25rem 0.5rem !important;
          font-size: 0.75rem !important;
          text-decoration: none !important;
        }

        .fc-wrapper .modulus-today .fc-daygrid-day-number {
          background-color: #FFD600 !important;
          border: 2px solid #0A0A0A !important;
          border-radius: 50% !important;
          width: 1.25rem !important;
          height: 1.25rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0.25rem !important;
          padding: 0 !important;
        }

        .fc-wrapper .fc-event {
          border-radius: 0.25rem !important;
          border-width: 1.5px !important;
          border-style: solid !important;
          box-shadow: 1px 1px 0px #0A0A0A !important;
          transition: transform 0.15s ease, box-shadow 0.15s ease !important;
          cursor: pointer !important;
          margin-bottom: 2px !important;
        }

        .fc-wrapper .fc-view-dayGridWeek .fc-event {
          border-radius: 0.5rem !important;
          border-width: 2px !important;
          box-shadow: 3px 3px 0px #0A0A0A !important;
          margin-bottom: 6px !important;
        }

        .fc-wrapper .fc-event:hover {
          transform: translate(1px, 1px) !important;
          box-shadow: none !important;
        }

        .fc-wrapper .fc-view-dayGridWeek .fc-event:hover {
          transform: translate(3px, 3px) !important;
          box-shadow: none !important;
        }

        .fc-wrapper .fc-popover {
          border: 3px solid #0A0A0A !important;
          border-radius: 1.5rem !important;
          box-shadow: 8px 8px 0px #0A0A0A !important;
          font-family: 'Be Vietnam Pro', sans-serif !important;
          z-index: 50 !important;
        }

        .fc-wrapper .fc-popover-header {
          background-color: #F5F5F0 !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-weight: 700 !important;
          color: #0A0A0A !important;
          border-bottom: 2px solid #0A0A0A !important;
          border-top-left-radius: 1.25rem !important;
          border-top-right-radius: 1.25rem !important;
          padding: 0.75rem 1rem !important;
        }
          
        .fc-wrapper .fc-popover-body {
          padding: 0.75rem !important;
        }

        .fc-wrapper .fc-popover-close {
          opacity: 1 !important;
          color: #0A0A0A !important;
          background: #E8E8E0 !important;
          border-radius: 50% !important;
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: background 0.15s ease !important;
        }

        .fc-wrapper .fc-popover-close:hover {
          background: #FFD600 !important;
        }
          
        .fc-wrapper .fc-daygrid-more-link {
          font-family: 'Space Grotesk', sans-serif !important;
          font-weight: 700 !important;
          font-size: 0.75rem !important;
          color: #555550 !important;
          margin-left: 0.25rem !important;
        }

        .fc-wrapper .fc-daygrid-more-link:hover {
          color: #0A0A0A !important;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
}

