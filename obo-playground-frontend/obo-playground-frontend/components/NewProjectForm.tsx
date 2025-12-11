'use client';

import { useState, useEffect } from 'react';
import { environmentsApi, Environment } from '@/lib/api';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectName: string, environmentId: number) => void;
  isLoading: boolean;
}

export default function NewProjectModal({ isOpen, onClose, onSubmit, isLoading }: NewProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [environmentId, setEnvironmentId] = useState<number>(1);
  const [environments, setEnvironments] = useState<Environment[]>([]);

  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        const data = await environmentsApi.getEnvironments();
        setEnvironments(data);
        if (data.length > 0) {
          setEnvironmentId(data[0].environment_id);
        }
      } catch (error) {
        console.error('Failed to fetch environments:', error);
      }
    };
    
    if (isOpen) {
      fetchEnvironments();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onSubmit(projectName.trim(), environmentId);
      setProjectName('');
      if (environments.length > 0) {
        setEnvironmentId(environments[0].environment_id);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white shadow-2xl dark:bg-zinc-900">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Create new project
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Untitled project"
                autoFocus
                maxLength={100}
                className="w-full border-b-2 border-blue-500 bg-transparent px-1 py-3 text-lg text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-50 dark:placeholder-zinc-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                3D Simulation Environment
              </label>
              <select
                value={environmentId}
                onChange={(e) => setEnvironmentId(Number(e.target.value))}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                {environments.map((env) => (
                  <option key={env.environment_id} value={env.environment_id}>
                    {env.environment_name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Project will be saved as {projectName.trim() || 'untitled'}.py
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !projectName.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
