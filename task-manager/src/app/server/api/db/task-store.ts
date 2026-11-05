export interface Task {
  id: string;
  title: string;
  description?: string;
  creationDate: number;
}

const tasks: Task[] = [];

export function listTasks(): Task[] {
  return [...tasks];
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((task) => task.id === id);
}

export function createTask(data: Pick<Task, "title" | "description">): Task {
  const newTask: Task = {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    creationDate: Date.now(),
  };

  tasks.push(newTask);

  return newTask;
}

export function updateTask(
  id: string,
  data: Pick<Task, "title" | "description">,
): Task | undefined {
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) {
    return undefined;
  }

  const updatedTask: Task = {
    ...tasks[taskIndex],
    title: data.title,
    description: data.description,
  };

  tasks[taskIndex] = updatedTask;

  return updatedTask;
}

export function deleteTask(id: string): boolean {
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) {
    return false;
  }

  tasks.splice(taskIndex, 1);

  return true;
}
