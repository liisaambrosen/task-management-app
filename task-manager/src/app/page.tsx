import { TaskList } from "@/components/tasks/task-list";
import { appRouter } from "../app/server/api/root";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tasks = await appRouter.createCaller({}).task.list();

  return <TaskList initialTasks={tasks} />;
}
