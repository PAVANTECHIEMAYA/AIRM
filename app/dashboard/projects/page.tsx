"use client";

import "./projects.css";
import { useEffect, useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import CreateProjectModal from "@/components/CreateProjectModal/CreateProjectModal";
import { ProjectTemplate } from "@/lib/templates";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  /* ================= LOAD PROJECTS ================= */

  const loadProjects = async () => {
    const res = await fetch("/api/projects");
    if (!res.ok) return;
    const data = await res.json();
    setProjects(data);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  /* ================= CREATE / UPDATE ================= */

  const saveProject = async (data: any) => {
    const payload = {
      name: data.name,
      description: data.description,
      manager: data.managerName,
      sprintLength: parseInt(data.sprintLength),
      membersCount: data.teamMembers.length,
      members: [
        // Ensure exactly one Manager entry, and don't duplicate if already present in teamMembers
        {
          name: data.managerName,
          email: data.managerEmail,
          role: "Manager",
        },
        ...data.teamMembers
          .filter((m: any) => m.role !== "Manager")
          .map((m: any) => ({
            name: m.name,
            email: m.email,
            role: m.role || "Member",
          })),
      ],
    };

    if (editingProject) {
      // ✏️ UPDATE
      await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      // ➕ CREATE
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setEditingProject(null);
    setShowCreateModal(false);
    loadProjects();
  };

  /* ================= CREATE WITH TEMPLATE ================= */

  const saveProjectWithTemplate = async (template: ProjectTemplate, data: any) => {
    const payload = {
      name: data.name,
      description: data.description,
      manager: data.managerName,
      sprintLength: parseInt(data.sprintLength),
      membersCount: data.teamMembers.length,
      members: [
        {
          name: data.managerName,
          email: data.managerEmail,
          role: "Manager",
        },
        ...data.teamMembers
          .filter((m: any) => m.role !== "Manager")
          .map((m: any) => ({
            name: m.name,
            email: m.email,
            role: m.role || "Member",
          })),
      ],
      templateId: template.id,
      templatePhases: template.phases, // Send phases so backend can create tasks
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create project with template");

      setEditingProject(null);
      setShowCreateModal(false);
      loadProjects();
    } catch (err) {
      console.error("Error creating project with template:", err);
      alert("Failed to create project. Please try again.");
    }
  };

  /* ================= DELETE ================= */

  const deleteProject = async (project: any) => {
    const ok = confirm(`Delete project "${project.name}"?`);
    if (!ok) return;

    await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
    });

    loadProjects();
  };

  /* ================= RENDER ================= */

  return (
    <>
      <main className="projects-page">
        <header className="projects-header">
          <div>
            <h1>Projects</h1>
            <p>
              Select a project to open its board, list, table and burndown chart.
            </p>
          </div>

          <div className="projects-actions">
            <button
              className="btn-add-project"
              onClick={() => {
                setEditingProject(null);
                setShowCreateModal(true);
              }}
            >
              + Add project
            </button>
          </div>
        </header>

        <section className="projects-grid">
          {projects.length === 0 && <p>No projects found.</p>}

          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={async () => {
  // 1️⃣ fetch project
  const projectRes = await fetch(`/api/projects/${project.id}`);
  if (!projectRes.ok) return;
  const projectData = await projectRes.json();

  // 2️⃣ fetch members
  const membersRes = await fetch(`/api/projects/${project.id}/members`);
  const members = membersRes.ok ? await membersRes.json() : [];

  // 3️⃣ merge them
  setEditingProject({
    ...projectData,
    members, // 🔥 THIS WAS MISSING
  });

  setShowCreateModal(true);
}}

              onDelete={() => deleteProject(project)}
            />
          ))}
        </section>
      </main>

      <CreateProjectModal
        open={showCreateModal}
        mode={editingProject ? "edit" : "create"}
        initialData={editingProject}
        onClose={() => {
          setShowCreateModal(false);
          setEditingProject(null);
        }}
        onCreateScratch={saveProject}
        onUpdate={(id, data) => saveProject(data)}
        onCreateTemplate={saveProjectWithTemplate}
      />
    </>
  );
}
