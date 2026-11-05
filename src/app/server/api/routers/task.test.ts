/** @jest-environment node */

import { appRouter } from "../root";

const missingTaskId = "00000000-0000-4000-8000-000000000001";

describe("task procedures", () => {
  const caller = appRouter.createCaller({});
  const createdTaskIds: string[] = [];

  afterEach(async () => {
    for (const id of createdTaskIds.splice(0)) {
      await caller.task.delete({ id });
    }
  });

  it("lists tasks created through the procedure", async () => {
    const task = await caller.task.create({ title: "Test task" });
    createdTaskIds.push(task.id);

    await expect(caller.task.list()).resolves.toContainEqual(task);
  });

  it("creates tasks with a generated UUID and creation timestamp", async () => {
    const startedAt = Date.now();
    const task = await caller.task.create({
      title: "New task",
      description: "Task description",
    });

    createdTaskIds.push(task.id);

    expect(task.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(task.creationDate).toBeGreaterThanOrEqual(startedAt);
    expect(task.creationDate).toBeLessThanOrEqual(Date.now());
    expect(task).toMatchObject({
      title: "New task",
      description: "Task description",
    });
  });

  it.each(["", "   ", "\t\n"])(
    "rejects a title containing only whitespace (%p)",
    async (title) => {
      await expect(caller.task.create({ title })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    },
  );

  it("accepts titles up to the configured length and rejects longer titles", async () => {
    const title = "a".repeat(120);
    const task = await caller.task.create({ title });
    createdTaskIds.push(task.id);

    expect(task.title).toHaveLength(120);
    await expect(
      caller.task.create({ title: `${title}a` }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("normalizes an empty or whitespace-only description to undefined", async () => {
    const task = await caller.task.create({
      title: "Task without description",
      description: "   ",
    });
    createdTaskIds.push(task.id);

    expect(task.description).toBeUndefined();
  });

  it("updates an existing task", async () => {
    const task = await caller.task.create({ title: "Original" });
    createdTaskIds.push(task.id);

    await expect(
      caller.task.update({
        id: task.id,
        title: "Updated",
        description: "New description",
      }),
    ).resolves.toMatchObject({
      id: task.id,
      title: "Updated",
      description: "New description",
      creationDate: task.creationDate,
    });
  });

  it("returns NOT_FOUND when updating a task that does not exist", async () => {
    await expect(
      caller.task.update({ id: missingTaskId, title: "Missing" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Task not found",
    });
  });

  it("returns NOT_FOUND when looking up a task that does not exist", async () => {
    await expect(
      caller.task.getById({ id: missingTaskId }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Task not found",
    });
  });

  it("rejects malformed task IDs", async () => {
    await expect(
      caller.task.getById({ id: "not-a-uuid" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.task.update({ id: "not-a-uuid", title: "Invalid ID" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.task.delete({ id: "not-a-uuid" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("deletes an existing task", async () => {
    const task = await caller.task.create({ title: "Delete me" });

    await expect(caller.task.delete({ id: task.id })).resolves.toEqual({
      success: true,
    });

    await expect(caller.task.getById({ id: task.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("returns NOT_FOUND when deleting a task that does not exist", async () => {
    await expect(
      caller.task.delete({ id: missingTaskId }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Task not found",
    });
  });
});
