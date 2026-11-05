import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskForm } from "./task-form";
import {
  configureTaskTrpcMock,
  createTask,
  renderWithTaskQueryClient,
  taskApi,
} from "@/test-utils/task-trpc";

beforeEach(() => {
  configureTaskTrpcMock();
});

describe("TaskForm", () => {
  it("rejects a title containing only spaces", async () => {
    const user = userEvent.setup();
    renderWithTaskQueryClient(<TaskForm />);

    const titleInput = screen.getByRole("textbox", { name: "Title" });
    await user.type(titleInput, "   ");
    await user.tab();

    expect(screen.getByText("Please enter a title.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Create task" })).toBeDisabled();
    expect(taskApi.createTask).not.toHaveBeenCalled();
  });

  it("limits the title input to 120 characters", () => {
    renderWithTaskQueryClient(<TaskForm />);

    expect(screen.getByRole("textbox", { name: "Title" })).toHaveAttribute(
      "maxLength",
      "120",
    );
  });

  it("passes an empty description as undefined when creating a task", async () => {
    const user = userEvent.setup();
    taskApi.createTask.mockResolvedValue(createTask({ title: "New task" }));
    renderWithTaskQueryClient(<TaskForm />);

    await user.type(screen.getByRole("textbox", { name: "Title" }), "New task");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() => {
      expect(taskApi.createTask).toHaveBeenCalledWith({
        title: "New task",
        description: undefined,
      });
    });
  });
});
