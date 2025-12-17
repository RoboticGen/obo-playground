/**
 * Projects Grid Component
 * Displays list of project cards
 */

import React from 'react';
import { Project } from '@/lib/api';
import ProjectCard from '@/components/ProjectCard';

interface ProjectsGridProps {
  projects: Project[];
  onDelete: (projectId: string) => void;
  onClick: (project: Project) => void;
}

export default function ProjectsGrid({ projects, onDelete, onClick }: ProjectsGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.project_id}
          project={project}
          onDelete={onDelete}
          onClick={() => onClick(project)}
        />
      ))}
    </div>
  );
}
