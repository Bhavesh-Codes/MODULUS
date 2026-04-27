"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, ListFilter, CircleSlash } from "lucide-react";
import { PersonalTaskWithDetails, PersonalTaskCategory } from "@/lib/types/personal-tasks";
import { TaskCard } from "@/components/personal-tasks/TaskCard";
import { Badge } from "@/components/ui/badge";

interface ListViewProps {
  tasks: PersonalTaskWithDetails[];
  categories: PersonalTaskCategory[];
  onTaskClick: (task: PersonalTaskWithDetails) => void;
  onTaskComplete: (task: PersonalTaskWithDetails) => void;
  onTaskArchive: (task: PersonalTaskWithDetails) => void;
  onUpdate: () => void;
}

type SortField = 'date' | 'deadline' | 'priority' | 'category';
type GroupBy = 'none' | 'date' | 'category';

export function ListView({
  tasks,
  categories,
  onTaskClick,
  onTaskComplete,
  onTaskArchive,
  onUpdate
}: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterToday, setFilterToday] = useState<boolean>(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const listContainerRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const isOverdue = (task: PersonalTaskWithDetails) => {
    return task.deadline && task.deadline < todayStr && task.status !== "done";
  };

  const isToday = (task: PersonalTaskWithDetails) => {
    return task.date === todayStr;
  };

  const isFiltersActive = useMemo(() => {
    return sortField !== 'date' ||
      !sortAsc ||
      groupBy !== 'none' ||
      filterPriority !== 'all' ||
      filterStatus !== 'all' ||
      filterCategory !== 'all' ||
      !filterToday;
  }, [sortField, sortAsc, groupBy, filterPriority, filterStatus, filterCategory, filterToday]);

  const handleClearFilters = () => {
    setSortField('date');
    setSortAsc(true);
    setGroupBy('none');
    setFilterPriority('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterToday(true);
    setCollapsedGroups(new Set());
  };

  const toggleGroup = (groupName: string) => {
    const newSet = new Set(collapsedGroups);
    if (newSet.has(groupName)) {
      newSet.delete(groupName);
    } else {
      newSet.add(groupName);
    }
    setCollapsedGroups(newSet);
  };

  // 1. Apply Filters
  const filtered = tasks.filter(task => {
    if (filterToday) {
      if (!isToday(task) && !isOverdue(task)) return false;
    }
    if (filterPriority !== 'all') {
      if (filterPriority === 'none') {
        if (task.priority !== null) return false;
      } else {
        if (task.priority !== filterPriority) return false;
      }
    }
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterCategory !== 'all') {
      if (filterCategory === 'none') {
        if (task.category_id !== null) return false;
      } else {
        if (task.category_id !== filterCategory) return false;
      }
    }
    return true;
  });

  // 2. Apply Sorting
  filtered.sort((a, b) => {
    // Rule 1: Pinned tasks always first
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;

    const getVal = (t: PersonalTaskWithDetails) => {
      if (sortField === 'date') return t.date;
      if (sortField === 'deadline') return t.deadline;
      if (sortField === 'category') return t.category?.name;
      if (sortField === 'priority') return t.priority;
    };

    const valA = getVal(a);
    const valB = getVal(b);

    // Rule 3: No value at bottom
    if (!valA && !valB) return 0;
    if (!valA) return 1;
    if (!valB) return -1;

    let cmp = 0;
    if (sortField === 'priority') {
      // Rule 4: Priority sorting (High first, then Medium, then Low)
      const pVals = { high: 3, medium: 2, low: 1 };
      // By default asc means high to low (3 to 1) for priority.
      // So valB - valA gives positive if B > A, placing A first.
      cmp = (pVals[b.priority as keyof typeof pVals] || 0) - (pVals[a.priority as keyof typeof pVals] || 0);
    } else {
      cmp = String(valA).localeCompare(String(valB));
    }

    // Rule 2: Sort by direction
    return sortAsc ? cmp : -cmp;
  });

  useEffect(() => {
    if (listContainerRef.current) {
      const cards = listContainerRef.current.querySelectorAll('.task-card-wrapper');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power2.out", clearProps: "all" }
        );
      }
    }
  }, [tasks, sortField, sortAsc, groupBy, filterPriority, filterStatus, filterCategory, filterToday, collapsedGroups]);

  // 3. Apply Grouping
  const groups: { name: string, tasks: PersonalTaskWithDetails[] }[] = [];

  if (groupBy === 'none') {
    groups.push({ name: 'All Tasks', tasks: filtered });
  } else if (groupBy === 'date') {
    const overdue: PersonalTaskWithDetails[] = [];
    const todayTasks: PersonalTaskWithDetails[] = [];
    const upcoming: PersonalTaskWithDetails[] = [];
    const noDate: PersonalTaskWithDetails[] = [];

    for (const t of filtered) {
      if (isOverdue(t)) {
        overdue.push(t);
      } else if (isToday(t)) {
        todayTasks.push(t);
      } else if (t.date && t.date > todayStr) {
        upcoming.push(t);
      } else {
        noDate.push(t);
      }
    }

    if (overdue.length) groups.push({ name: 'Overdue', tasks: overdue });
    if (todayTasks.length) groups.push({ name: 'Today', tasks: todayTasks });
    if (upcoming.length) groups.push({ name: 'Upcoming', tasks: upcoming });
    if (noDate.length) groups.push({ name: 'No Date', tasks: noDate });
  } else if (groupBy === 'category') {
    const catMap = new Map<string, PersonalTaskWithDetails[]>();
    const uncategorized: PersonalTaskWithDetails[] = [];

    for (const t of filtered) {
      if (t.category) {
        if (!catMap.has(t.category.name)) catMap.set(t.category.name, []);
        catMap.get(t.category.name)!.push(t);
      } else {
        uncategorized.push(t);
      }
    }

    const sortedCats = Array.from(catMap.keys()).sort();
    for (const c of sortedCats) {
      groups.push({ name: c, tasks: catMap.get(c)! });
    }
    if (uncategorized.length) groups.push({ name: 'Uncategorized', tasks: uncategorized });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-center bg-[#F5F5F0] p-4 rounded-[1.5rem] border-[2px] border-black shadow-[4px_4px_0_black]">
        <div className="flex items-center gap-2">
          <ListFilter className="w-5 h-5 text-[#555550] mr-2" />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 border-r-2 border-black/10 pr-4">
          <span className="font-space text-[10px] font-bold text-[#555550]">SORT</span>
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value as SortField)}
            className="px-2 py-1.5 bg-white border-2 border-black rounded-[0.75rem] font-vietnam text-sm focus:shadow-[2px_2px_0_black] outline-none cursor-pointer"
          >
            <option value="date">Date</option>
            <option value="deadline">Deadline</option>
            <option value="priority">Priority</option>
            <option value="category">Category</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-1.5 bg-white border-2 border-black rounded-[0.75rem] hover:shadow-[2px_2px_0_black] hover:-translate-y-[1px] transition-all cursor-pointer"
            title={sortAsc ? "Ascending" : "Descending"}
          >
            {sortAsc ? <ArrowDown className="w-4 h-4 text-black" /> : <ArrowUp className="w-4 h-4 text-black" />}
          </button>
        </div>

        {/* Group */}
        <div className="flex items-center gap-2 border-r-2 border-black/10 pr-4">
          <span className="font-space text-[10px] font-bold text-[#555550]">GROUP</span>
          <button
            onClick={() => setGroupBy(groupBy === 'date' ? 'none' : 'date')}
            className={`px-3 py-1.5 border-2 border-black rounded-[0.75rem] font-vietnam text-sm font-bold transition-all cursor-pointer ${groupBy === 'date'
                ? 'bg-[#FFD600] shadow-none translate-y-[2px] translate-x-[2px]'
                : 'bg-white shadow-[2px_2px_0_black] hover:-translate-y-[1px]'
              }`}
          >
            Date
          </button>
          <button
            onClick={() => setGroupBy(groupBy === 'category' ? 'none' : 'category')}
            className={`px-3 py-1.5 border-2 border-black rounded-[0.75rem] font-vietnam text-sm font-bold transition-all cursor-pointer ${groupBy === 'category'
                ? 'bg-[#FFD600] shadow-none translate-y-[2px] translate-x-[2px]'
                : 'bg-white shadow-[2px_2px_0_black] hover:-translate-y-[1px]'
              }`}
          >
            Category
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-space text-[10px] font-bold text-[#555550]">FILTERS</span>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-2 py-1.5 bg-white border-2 border-black rounded-[0.75rem] font-vietnam text-sm focus:shadow-[2px_2px_0_black] outline-none cursor-pointer"
          >
            <option value="all">Priority: All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="none">None</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 bg-white border-2 border-black rounded-[0.75rem] font-vietnam text-sm focus:shadow-[2px_2px_0_black] outline-none cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-2 py-1.5 bg-white border-2 border-black rounded-[0.75rem] font-vietnam text-sm focus:shadow-[2px_2px_0_black] outline-none cursor-pointer max-w-[150px]"
          >
            <option value="all">Category: All</option>
            <option value="none">Uncategorized</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => setFilterToday(!filterToday)}
            className={`ml-2 px-4 py-1.5 border-2 border-black rounded-full font-space text-sm font-bold transition-all cursor-pointer ${filterToday
                ? 'bg-black text-white shadow-none translate-y-[2px] translate-x-[2px]'
                : 'bg-white text-black shadow-[2px_2px_0_black] hover:-translate-y-[1px]'
              }`}
          >
            Today
          </button>
        </div>

        {/* Clear Filters */}
        {isFiltersActive && (
          <button
            onClick={handleClearFilters}
            className="ml-auto px-3 py-1.5 text-[#FF3B30] font-space text-xs font-bold hover:bg-[#FF3B30]/10 rounded-[0.75rem] transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-[#E8E8E0] border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_black]">
            <CircleSlash className="w-10 h-10 text-black" />
          </div>
          <h2 className="font-jakarta font-bold text-[24px] text-black">
            {filterToday ? "Nothing due today — you're all caught up." : "No tasks yet. Type above to add your first one."}
          </h2>
        </div>
      ) : (
        <div ref={listContainerRef} className="flex flex-col gap-8">
          {groups.map(group => {
            const isCollapsed = collapsedGroups.has(group.name);
            return (
              <div key={group.name} className="flex flex-col gap-4">
                {groupBy !== 'none' && (
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className="flex items-center gap-3 w-fit hover:bg-[#F5F5F0] p-2 -ml-2 rounded-lg transition-colors outline-none cursor-pointer"
                  >
                    {isCollapsed ? <ChevronRight className="w-5 h-5 text-black" /> : <ChevronDown className="w-5 h-5 text-black" />}
                    <h3 className="font-jakarta font-bold text-[20px] text-black">{group.name}</h3>
                    <Badge className="bg-black text-white hover:bg-black font-space border-none">
                      {group.tasks.length}
                    </Badge>
                  </button>
                )}

                {!isCollapsed && (
                  <div className="flex flex-col gap-3">
                    {group.tasks.map(task => (
                      <div key={task.id} className="task-card-wrapper">
                        <TaskCard
                          task={task}
                          onClick={() => onTaskClick(task)}
                          onComplete={() => onTaskComplete(task)}
                          onArchive={() => onTaskArchive(task)}
                          onUpdate={onUpdate}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
