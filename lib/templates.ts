import templatesData from './templates.json';

export interface TemplatePhase {
  name: string;
  tasks: string[];
}

export interface ProjectTemplate {
  id: string;
  title: string;
  subtitle: string;
  phases: TemplatePhase[];
  taskCount: number;
  sprintLength: string;
  description: string;
}

export const templates: ProjectTemplate[] = templatesData as ProjectTemplate[];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return templates.find(t => t.id === id);
}



