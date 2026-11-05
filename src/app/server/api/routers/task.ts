import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "../trpc";
import { MAX_TASK_TITLE_LENGTH } from "@/lib/task-validation";
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../db/task-store";

// Shared validation schema for task data.
const taskInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(
      MAX_TASK_TITLE_LENGTH,
      `Title must contain at most ${MAX_TASK_TITLE_LENGTH} characters`,
    ),
  description: z
    .string()
    .trim()
    .optional()
    .transform((description) => description || undefined),
});

export const taskRouter = router({
  // Returns all tasks.
  list: publicProcedure.query(() => {
    return listTasks();
  }),

  // Returns a task by its ID.
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input }) => {
      const task = getTaskById(input.id);

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      return task;
    }),

  // Creates a new task.
  create: publicProcedure.input(taskInputSchema).mutation(({ input }) => {
    return createTask(input);
  }),

  // Updates an existing task.
  update: publicProcedure
    .input(
      taskInputSchema.extend({
        id: z.string().uuid(),
      }),
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;

      const updatedTask = updateTask(id, data);

      if (!updatedTask) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      return updatedTask;
    }),

  // Deletes an existing task.
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => {
      const deleted = deleteTask(input.id);

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      return { success: true };
    }),
});
