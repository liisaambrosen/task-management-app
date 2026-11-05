"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { MAX_TASK_TITLE_LENGTH } from "@/lib/task-validation";
import type { Task } from "../../app/server/api/db/task-store";

interface TaskFormProps {
  task?: Task;
  onCancel?: () => void;
  onSuccess?: (action: "created" | "updated") => void;
}

export function TaskForm({ task, onCancel, onSuccess }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [titleTouched, setTitleTouched] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const refreshTasks = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.task.list.queryKey(),
    });
  };

  const createTask = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: () => {
        setTitle("");
        setDescription("");
        setTitleTouched(false);
        onSuccess?.("created");
        refreshTasks();
      },
    }),
  );

  const updateTask = useMutation(
    trpc.task.update.mutationOptions({
      onSuccess: () => {
        onSuccess?.("updated");
        refreshTasks();
      },
    }),
  );

  const isEditing = Boolean(task);
  const isPending = createTask.isPending || updateTask.isPending;
  const isTitleTooLong = title.trim().length > MAX_TASK_TITLE_LENGTH;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTitleTouched(true);

    if (!title.trim() || isTitleTooLong) return;

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
    };

    if (task) {
      updateTask.mutate({
        id: task.id,
        ...data,
      });
    } else {
      createTask.mutate(data);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">
        {isEditing ? "Edit task" : "Create a new task"}
      </h2>

      <div>
        <label
          htmlFor="title"
          className="mb-1 block font-medium text-slate-800"
        >
          Title
        </label>

        <input
          id="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => setTitleTouched(true)}
          disabled={isPending}
          maxLength={MAX_TASK_TITLE_LENGTH}
          required
          aria-invalid={titleTouched && (!title.trim() || isTitleTooLong)}
          className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Enter task title"
        />

        {titleTouched && (!title.trim() || isTitleTooLong) && (
          <p className="mt-1 text-sm text-red-600">
            {!title.trim()
              ? "Please enter a title."
              : `Title must contain at most ${MAX_TASK_TITLE_LENGTH} characters.`}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block font-medium text-slate-800"
        >
          Description
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={isPending}
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Enter task description (optional)"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !title.trim() || isTitleTooLong}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : isEditing ? "Save changes" : "Create task"}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
        )}
      </div>

      {createTask.isError && (
        <p role="alert" className="text-sm text-red-600">
          We couldn&apos;t create this task. Please check your connection and
          try again.
        </p>
      )}

      {updateTask.isError && (
        <p role="alert" className="text-sm text-red-600">
          We couldn&apos;t save your changes. The task may no longer exist.
          Please try again.
        </p>
      )}
    </form>
  );
}
