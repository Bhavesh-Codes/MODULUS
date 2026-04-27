"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  PersonalTaskWithDetails,
  PersonalTaskCategory,
} from "@/lib/types/personal-tasks";
import {
  getTasks,
  getCategories,
  getArchivedTasks,
  createTask,
  updateTask,
  deleteTask,
  archiveTask,
  completeTask,
  createCategory,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  type CreateTaskOptions,
  type UpdateTaskFields,
  type UpdateSubtaskFields,
} from "@/actions/personal-tasks";

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const taskKeys = {
  all: ["personal-tasks"] as const,
  tasks: () => [...taskKeys.all, "tasks"] as const,
  archived: () => [...taskKeys.all, "archived"] as const,
  categories: () => [...taskKeys.all, "categories"] as const,
};

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export function usePersonalTasks(initialData?: PersonalTaskWithDetails[]) {
  return useQuery({
    queryKey: taskKeys.tasks(),
    queryFn: () => getTasks(),
    initialData,
    staleTime: 60 * 1000,
  });
}

export function useArchivedTasks(enabled = true) {
  return useQuery({
    queryKey: taskKeys.archived(),
    queryFn: () => getArchivedTasks(),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useTaskCategories(initialData?: PersonalTaskCategory[]) {
  return useQuery({
    queryKey: taskKeys.categories(),
    queryFn: () => getCategories(),
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

/**
 * Optimistically removes a task from the cache while the server processes it.
 * Used by complete, archive, and delete mutations.
 */
function useOptimisticRemoveTask() {
  const queryClient = useQueryClient();

  return {
    onMutate: async (taskId: string) => {
      // Cancel in-flight fetches
      await queryClient.cancelQueries({ queryKey: taskKeys.tasks() });

      // Snapshot current data
      const previousTasks = queryClient.getQueryData<PersonalTaskWithDetails[]>(
        taskKeys.tasks()
      );

      // Optimistically remove the task
      queryClient.setQueryData<PersonalTaskWithDetails[]>(
        taskKeys.tasks(),
        (old) => old?.filter((t) => t.id !== taskId) ?? []
      );

      return { previousTasks };
    },
    onError: (
      _err: unknown,
      _taskId: string,
      context: { previousTasks?: PersonalTaskWithDetails[] } | undefined
    ) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.tasks(), context.previousTasks);
      }
    },
    onSettled: () => {
      // Always refetch to stay in sync with server
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: taskKeys.archived() });
    },
  };
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      title,
      opts,
      subtaskTitles,
    }: {
      title: string;
      opts?: CreateTaskOptions;
      subtaskTitles?: string[];
    }) =>
      createTask(title, opts).then(async (result) => {
        if (subtaskTitles && subtaskTitles.length > 0 && result.id) {
          await Promise.all(
            subtaskTitles.map((st) => createSubtask(result.id, st))
          );
        }
        return result;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      fields,
    }: {
      taskId: string;
      fields: UpdateTaskFields;
    }) => updateTask(taskId, fields),
    onMutate: async ({ taskId, fields }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.tasks() });

      const previousTasks = queryClient.getQueryData<PersonalTaskWithDetails[]>(
        taskKeys.tasks()
      );

      // Optimistically update the task in cache
      queryClient.setQueryData<PersonalTaskWithDetails[]>(
        taskKeys.tasks(),
        (old) =>
          old?.map((t) =>
            t.id === taskId ? { ...t, ...fields } : t
          ) ?? []
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.tasks(), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const optimistic = useOptimisticRemoveTask();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onMutate: (taskId) => optimistic.onMutate(taskId),
    onError: (err, taskId, context) => optimistic.onError(err, taskId, context),
    onSettled: optimistic.onSettled,
  });
}

export function useArchiveTask() {
  const queryClient = useQueryClient();
  const optimistic = useOptimisticRemoveTask();

  return useMutation({
    mutationFn: (taskId: string) => archiveTask(taskId),
    onMutate: (taskId) => optimistic.onMutate(taskId),
    onError: (err, taskId, context) => optimistic.onError(err, taskId, context),
    onSettled: optimistic.onSettled,
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => completeTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.tasks() });

      const previousTasks = queryClient.getQueryData<PersonalTaskWithDetails[]>(
        taskKeys.tasks()
      );

      // Optimistically mark as done
      queryClient.setQueryData<PersonalTaskWithDetails[]>(
        taskKeys.tasks(),
        (old) =>
          old?.map((t) =>
            t.id === taskId
              ? { ...t, status: "done" as const, completed_at: new Date().toISOString() }
              : t
          ) ?? []
      );

      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.tasks(), context.previousTasks);
      }
    },
    onSettled: () => {
      // Delayed refetch so the completion animation finishes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: taskKeys.tasks() });
        queryClient.invalidateQueries({ queryKey: taskKeys.archived() });
      }, 2000);
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.categories() });
    },
  });
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      createSubtask(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.tasks() });
    },
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subtaskId,
      fields,
    }: {
      subtaskId: string;
      fields: UpdateSubtaskFields;
    }) => updateSubtask(subtaskId, fields),
    onMutate: async ({ subtaskId, fields }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.tasks() });

      const previousTasks = queryClient.getQueryData<PersonalTaskWithDetails[]>(
        taskKeys.tasks()
      );

      // Optimistically update subtask in cache
      queryClient.setQueryData<PersonalTaskWithDetails[]>(
        taskKeys.tasks(),
        (old) =>
          old?.map((t) => ({
            ...t,
            subtasks: t.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, ...fields } : st
            ),
          })) ?? []
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.tasks(), context.previousTasks);
      }
    },
    // No onSettled invalidation for subtask toggles — optimistic is enough,
    // and the next major mutation will sync anyway. Prevents flickering.
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subtaskId: string) => deleteSubtask(subtaskId),
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.tasks() });

      const previousTasks = queryClient.getQueryData<PersonalTaskWithDetails[]>(
        taskKeys.tasks()
      );

      queryClient.setQueryData<PersonalTaskWithDetails[]>(
        taskKeys.tasks(),
        (old) =>
          old?.map((t) => ({
            ...t,
            subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
          })) ?? []
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.tasks(), context.previousTasks);
      }
    },
  });
}
