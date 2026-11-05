"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task } from "../../app/server/api/db/task-store";
import { useTRPC } from "@/trpc/client";
import { TaskForm } from "./task-form";
import { useState, useEffect } from "react";

interface TaskListProps {
  initialTasks: Task[];
}

function TaskCreationDate({ timestamp }: { timestamp: number }) {
  const [localizedDate, setLocalizedDate] = useState<string>();
  const date = new Date(timestamp);
  const isoDate = date.toISOString();

  useEffect(() => {
    setLocalizedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  return <time dateTime={isoDate}>{localizedDate ?? isoDate}</time>;
}

export function TaskList({ initialTasks }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = setTimeout(() => {
      setSuccessMessage("");
    }, 6000);

    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData(trpc.task.list.queryKey(), initialTasks);
  }, [initialTasks, queryClient, trpc]);

  const deleteTask = useMutation(
    trpc.task.delete.mutationOptions({
    onSuccess: () => {
        setSuccessMessage("Task deleted successfully!");

      void queryClient.invalidateQueries({
          queryKey: trpc.task.list.queryKey(),
        });
      },
    }),
  );

  const handleDeleteTask = (task: Task) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
    );

    if (confirmed) {
      deleteTask.mutate({ id: task.id });
    }
  };

  const {
    data: tasks,
    isFetching,
    isRefetchError,
    refetch,
  } = useQuery({
    ...trpc.task.list.queryOptions(),
    initialData: initialTasks,
    refetchOnMount: "always",
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">
          Task Manager
        </h1>
        {successMessage && (
          <p
            role="status"
            aria-live="polite"
            className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {successMessage}
          </p>
        )}
        <TaskForm
          key={selectedTask?.id ?? "new"}
          task={selectedTask}
          onCancel={() => setSelectedTask(undefined)}
          onSuccess={(action) => {
            setSelectedTask(undefined);

            setSuccessMessage(
              action === "created"
                ? "Task created successfully!"
                : "Task updated successfully!",
            );
          }}
        />
        {deleteTask.isError && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            We couldn&apos;t delete this task. Please try again.
          </p>
        )}

        {isFetching && (
          <p role="status" aria-live="polite" className="mb-4 text-sm text-slate-600">
            Updating task list...
          </p>
        )}

        {isRefetchError && (
          <div
            role="alert"
            className="mb-4 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>
              We couldn&apos;t refresh the task list. The tasks shown may be
              out of date.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="shrink-0 rounded-lg border border-rose-300 px-3 py-1.5 font-medium transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        )}

        {tasks.length === 0 && (
          <p className="text-gray-500">No tasks yet.</p>
        )}

        {tasks.length > 0 && (
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-slate-800">
                    {task.title}
                  </h2>

                  {task.description && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {task.description}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-slate-400">
                    Created: <TaskCreationDate timestamp={task.creationDate} />
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    disabled={deleteTask.isPending}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task)}
                    disabled={deleteTask.isPending}
                    className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                  >
                    {deleteTask.isPending &&
                    deleteTask.variables?.id === task.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
