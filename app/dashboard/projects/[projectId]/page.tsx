"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import BoardView from "@/components/views/BoardView";
import ListView from "@/components/views/ListView";
import TableView from "@/components/views/TableView";
import BurndownView from "@/components/views/BurndownView";
import TaskDetailsPanel from "@/components/views/TaskDetailsPanel";

type Project = {
  id: string;
  name: string;
  manager: string;
  members_count: number;
  sprint_length?: number;
  columns?: string[];
};

export default function ProjectPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [activeView, setActiveView] =
    useState<"kanban" | "list" | "table" | "burndown">("kanban");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>(["Todo", "Sprint", "Review", "Completed"]);

  /* -------------------------------------------------
     LOAD PROJECT
  ------------------------------------------------- */
  useEffect(() => {
    if (!projectId) return;

    fetch(`/api/projects/${projectId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch project");
        return res.json();
      })
      .then((proj) => {
        setProject(proj);
        // Load columns from project
        const projectColumns = Array.isArray(proj.columns)
          ? proj.columns
          : (proj.columns ? JSON.parse(proj.columns) : ["Todo", "Sprint", "Review", "Completed"]);
        setColumns(projectColumns);
      })
      .catch((err) => {
        console.error(err);
        setError("Project not found");
      });
  }, [projectId]);

  /* -------------------------------------------------
     LOAD TASKS
  ------------------------------------------------- */
  useEffect(() => {
    if (!projectId) return;

    fetch(`/api/projects/${projectId}/tasks`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load tasks");
        return res.json();
      })
      .then(setTasks)
      .catch((err) => console.error("Load tasks error:", err));
  }, [projectId]);

  if (error) return <div>{error}</div>;
  if (!project) return <div>Loading project...</div>;

  return (
    <div className="project-page">
      {/* HEADER */}
      <div className="project-header">
        <div>
          <h1>{project.name}</h1>
          <p>
            Manager: {project.manager || "Unassigned"} · Team:{" "}
            {project.members_count} members
          </p>
        </div>

        <div className="view-switch">
          <button onClick={() => setActiveView("kanban")}>Kanban</button>
          <button onClick={() => setActiveView("list")}>List</button>
          <button onClick={() => setActiveView("table")}>Table</button>
          <button onClick={() => setActiveView("burndown")}>Burndown</button>
        </div>
      </div>

      {/* BODY */}
      <div
        className={
          selectedTask
            ? "project-body with-sidebar"
            : "project-body full-width"
        }
      >
        <div className="project-main">
          {activeView === "kanban" && (
            <BoardView
              onTaskSelect={setSelectedTask}
              tasks={tasks}
              setTasks={setTasks}
              projectId={project.id}
              columns={columns}
            />
          )}
          {activeView === "list" && (
            <ListView onTaskSelect={setSelectedTask} tasks={tasks} projectId={project.id} columns={columns} />
          )}
          {activeView === "table" && (
            <TableView onTaskSelect={setSelectedTask} tasks={tasks} projectId={project.id} columns={columns} />
          )}
          {activeView === "burndown" && (
            <BurndownView
              tasks={tasks}
              projectInfo={project}
              sprintLength={project?.sprint_length || 10}
            />
          )}
        </div>

        {/* 🔥 FIX IS HERE */}
        {selectedTask && (
          <aside className="project-sidebar">
            <TaskDetailsPanel
              task={selectedTask}
              projectId={project.id}   // ✅ THIS WAS MISSING
                onClose={() => setSelectedTask(null)}
                onDelete={(id: string) => {
                  setTasks((prev) => prev.filter((t) => t.id !== id));
                  setSelectedTask(null);
                }}
                onTaskUpdate={(updated: any) => {
                  setTasks((prev) => (prev || []).map((t) => (t.id === updated.id ? updated : t)));
                  setSelectedTask(updated);
                }}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
