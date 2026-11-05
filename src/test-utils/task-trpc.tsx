import type { ReactElement } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { useTRPC } from "@/trpc/client";
import type { Task } from "@/app/server/api/db/task-store";

type TaskInput = Pick<Task, "title" | "description">;
type UpdateTaskInput = TaskInput & Pick<Task, "id">;
type DeleteTaskInput = Pick<Task, "id">;

export const taskApi = {
  listTasks: jest.fn<Promise<Task[]>, []>(),
  createTask: jest.fn<Promise<Task>, [TaskInput]>(),
  updateTask: jest.fn<Promise<Task>, [UpdateTaskInput]>(),
  deleteTask: jest.fn<Promise<{ success: true }>, [DeleteTaskInput]>(),
};

const defaultTask: Task = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Saved task",
  creationDate: 1_700_000_000_000,
};

export function configureTaskTrpcMock() {
  taskApi.listTasks.mockReset().mockResolvedValue([]);
  taskApi.createTask.mockReset().mockResolvedValue(defaultTask);
  taskApi.updateTask.mockReset().mockResolvedValue(defaultTask);
  taskApi.deleteTask.mockReset().mockResolvedValue({ success: true });

  const mockedTrpc = {
    task: {
      list: {
        queryKey: () => ["task", "list"],
        queryOptions: () => ({
          queryKey: ["task", "list"],
          queryFn: () => taskApi.listTasks(),
        }),
      },
      create: {
        mutationOptions: (options: { onSuccess?: () => void }) => ({
          mutationFn: (input: TaskInput) => taskApi.createTask(input),
          onSuccess: options.onSuccess,
        }),
      },
      update: {
        mutationOptions: (options: { onSuccess?: () => void }) => ({
          mutationFn: (input: UpdateTaskInput) =>
            taskApi.updateTask(input),
          onSuccess: options.onSuccess,
        }),
      },
      delete: {
        mutationOptions: (options: { onSuccess?: () => void }) => ({
          mutationFn: (input: DeleteTaskInput) =>
            taskApi.deleteTask(input),
          onSuccess: options.onSuccess,
        }),
      },
    },
  } as unknown as ReturnType<typeof useTRPC>;

  jest.mocked(useTRPC).mockReturnValue(mockedTrpc);
}

export function renderWithTaskQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  };
}

export function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "00000000-0000-4000-8000-000000000002",
    title: "Buy groceries",
    description: "Milk and bread",
    creationDate: 1_700_000_000_000,
    ...overrides,
  };
}
