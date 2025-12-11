'use client';

import { Project } from '@/lib/api';
import { format } from 'date-fns';
import { useState } from 'react';

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => void;
  onClick: () => void;
}

export default function ProjectCard({ project, onDelete, onClick }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const projectName = project.project_name || 'Untitled';
  const formattedDate = format(new Date(project.created_at), 'MMM d, yyyy');

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (window.confirm(`Delete "${projectName}"?`)) {
      onDelete(project.project_id);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-lg border border-zinc-200 bg-white transition-all hover:border-blue-500 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600"
    >
      {/* Document Icon Preview */}
      <div className="flex h-48 items-center justify-center border-b border-zinc-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-zinc-800 dark:from-blue-950 dark:to-indigo-950">
        <svg
          className="h-20 w-20 text-blue-600 dark:text-blue-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          <path d="M8 12h8v2H8v-2zm0 4h5v2H8v-2z"/>
        </svg>
      </div>

      {/* Project Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {projectName}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span>{project.environment?.environment_name || 'Unknown'}</span>
              <span>•</span>
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Three Dots Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded p-1 opacity-0 transition-opacity hover:bg-zinc-100 group-hover:opacity-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-50 dark:text-red-400 dark:hover:bg-zinc-700"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
