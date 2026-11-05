import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskList } from "./task-list";
import {
  configureTaskTrpcMock,
  createTask,
  renderWithTaskQueryClient,
  taskApi,
} from "@/test-utils/task-trpc";

beforeEach(() => {
  configureTaskTrpcMock();
});

describe("TaskList", () => {
  it("shows an empty state when there are no tasks", () => {
    renderWithTaskQueryClient(<TaskList initialTasks={[]} />);

    expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
  });

  it("renders task title, description, and creation date", () => {
    const task = createTask();

    renderWithTaskQueryClient(<TaskList initialTasks={[task]} />);

    expect(
      screen.getByRole("heading", { name: task.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(task.description!)).toBeInTheDocument();
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });

  it("shows loading feedback while refreshing the task list", async () => {
    taskApi.listTasks.mockReturnValue(new Promise(() => {}));

    renderWithTaskQueryClient(<TaskList initialTasks={[]} />);

    expect(await screen.findByText("Updating task list...")).toBeVisible();
  });

  it("shows a retry action when refreshing the task list fails", async () => {
    const user = userEvent.setup();
    const task = createTask();
    taskApi.listTasks
      .mockRejectedValueOnce(new Error("Internal server details"))
      .mockResolvedValueOnce([task]);

    renderWithTaskQueryClient(<TaskList initialTasks={[task]} />);

    expect(
      await screen.findByText(
        "We couldn't refresh the task list. The tasks shown may be out of date.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: task.title }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(taskApi.listTasks).toHaveBeenCalledTimes(2);
    });
    expect(
      screen.queryByText(
        "We couldn't refresh the task list. The tasks shown may be out of date.",
      ),
    ).not.toBeInTheDocument();
  });

  it("creates a task and shows success feedback", async () => {
    const user = userEvent.setup();
    const task = createTask({ title: "New task" });
    taskApi.createTask.mockResolvedValue(task);
    taskApi.listTasks.mockResolvedValue([task]);

    renderWithTaskQueryClient(<TaskList initialTasks={[]} />);

    await user.type(screen.getByRole("textbox", { name: "Title" }), task.title);
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText("Task created successfully!")).toBeVisible();
    expect(
      await screen.findByRole("heading", { name: task.title }),
    ).toBeInTheDocument();
  });

  it("shows saving feedback and disables form controls during creation", async () => {
    const user = userEvent.setup();
    let resolveCreate!: (task: ReturnType<typeof createTask>) => void;
    taskApi.createTask.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    renderWithTaskQueryClient(<TaskList initialTasks={[]} />);

    const titleInput = screen.getByRole("textbox", { name: "Title" });
    const descriptionInput = screen.getByRole("textbox", {
      name: "Description",
    });
    await user.type(titleInput, "Pending task");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(titleInput).toBeDisabled();
    expect(descriptionInput).toBeDisabled();

    resolveCreate(createTask({ title: "Pending task" }));
    expect(await screen.findByText("Task created successfully!")).toBeVisible();
  });

  it("shows a friendly error when task creation fails", async () => {
    const user = userEvent.setup();
    taskApi.createTask.mockRejectedValue(new Error("Internal server details"));

    renderWithTaskQueryClient(<TaskList initialTasks={[]} />);

    await user.type(screen.getByRole("textbox", { name: "Title" }), "New task");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't create this task. Please check your connection and try again.",
    );
    expect(screen.queryByText("Internal server details")).not.toBeInTheDocument();
  });

  it("edits a task and shows success feedback", async () => {
    const user = userEvent.setup();
    const task = createTask();
    const updatedTask = { ...task, title: "Updated task" };
    taskApi.updateTask.mockResolvedValue(updatedTask);
    taskApi.listTasks.mockResolvedValue([updatedTask]);

    renderWithTaskQueryClient(<TaskList initialTasks={[task]} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const titleInput = screen.getByRole("textbox", { name: "Title" });
    await user.clear(titleInput);
    await user.type(titleInput, updatedTask.title);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Task updated successfully!")).toBeVisible();
    expect(
      await screen.findByRole("heading", { name: updatedTask.title }),
    ).toBeInTheDocument();
  });

  it("shows a friendly error when task editing fails", async () => {
    const user = userEvent.setup();
    const task = createTask();
    taskApi.updateTask.mockRejectedValue(new Error("Internal server details"));
    taskApi.listTasks.mockResolvedValue([task]);

    renderWithTaskQueryClient(<TaskList initialTasks={[task]} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't save your changes. The task may no longer exist.",
    );
    expect(screen.queryByText("Internal server details")).not.toBeInTheDocument();
  });

  it("does not delete a task when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const task = createTask();
    jest.spyOn(window, "confirm").mockReturnValue(false);
    taskApi.listTasks.mockResolvedValue([task]);

    renderWithTaskQueryClient(<TaskList initialTasks={[task]} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining(task.title),
    );
    expect(taskApi.deleteTask).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: task.title })).toBeInTheDocument();
  });

  it("deletes a task after confirmation and shows success feedback", async () => {
    const user = userEvent.setup();
    const task = createTask();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    taskApi.listTasks
      .mockResolvedValueOnce([task])
      .mockResolvedValueOnce([]);

    renderWithTaskQueryClient(<TaskList initialTasks={[task]} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(taskApi.deleteTask).toHaveBeenCalledWith({ id: task.id });
    });
    expect(await screen.findByText("Task deleted successfully!")).toBeVisible();
  });

  it("shows a friendly error when task deletion fails", async () => {
    const user = userEvent.setup();
    const task = createTask();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    taskApi.deleteTask.mockRejectedValue(new Error("Internal server details"));
    taskApi.listTasks.mockResolvedValue([task]);

    renderWithTaskQueryClient(<TaskList initialTasks={[task]} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't delete this task. Please try again.",
    );
    expect(screen.queryByText("Internal server details")).not.toBeInTheDocument();
  });
});
