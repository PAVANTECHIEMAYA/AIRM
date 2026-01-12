"use client";

const STORAGE_KEY_PREFIX = "tasks_";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  label?: string;
  status: "todo" | "in-progress" | "completed" | "backlog";
  priority?: "low" | "medium" | "high";
  assignee?: string;
  dueDate?: string;
  progress?: number;
};

export function getTasks(projectId: string): Task[] {
  if (typeof window === "undefined") return [];
  const key = `${STORAGE_KEY_PREFIX}${projectId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function saveTasks(projectId: string, tasks: Task[]) {
  const key = `${STORAGE_KEY_PREFIX}${projectId}`;
  localStorage.setItem(key, JSON.stringify(tasks));
}

export function addTask(projectId: string, task: Task) {
  const tasks = getTasks(projectId);
  saveTasks(projectId, [...tasks, task]);
}

export function updateTask(projectId: string, taskId: string, updates: Partial<Task>) {
  const tasks = getTasks(projectId);
  const updated = tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
  saveTasks(projectId, updated);
}

export function deleteTask(projectId: string, taskId: string) {
  const tasks = getTasks(projectId);
  saveTasks(projectId, tasks.filter((t) => t.id !== taskId));
}

