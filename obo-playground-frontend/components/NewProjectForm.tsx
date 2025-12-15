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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-sm border border-neutral-800 bg-neutral-950 shadow-2xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-700">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="font-[family-name:var(--font-red-hat-display)] text-xl font-bold text-white">
                Create New Project
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 p-6">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-300">
                <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Robot Project"
                autoFocus
                maxLength={100}
                className="w-full rounded-sm border border-neutral-800 bg-black px-4 py-3 text-white placeholder-neutral-500 transition-colors focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/50"
              />
              <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Will be saved as {projectName.trim() || 'untitled'}.py
              </p>
            </div>

            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-300">
                <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                3D Environment
              </label>
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-700">
                  {environments.map((env) => (
                    <button
                      key={env.environment_id}
                      type="button"
                      onClick={() => setEnvironmentId(env.environment_id)}
                      className={`group relative flex-shrink-0 overflow-hidden rounded-sm border-2 p-3 transition-all ${
                        environmentId === env.environment_id
                          ? 'border-blue-700 bg-blue-700/10'
                          : 'border-neutral-800 bg-black hover:border-neutral-700 hover:bg-neutral-900'
                      }`}
                      style={{ width: '140px' }}
                    >
                      {/* Icon/Thumbnail Area */}
                      <div className="mb-2 flex h-20 items-center justify-center rounded bg-neutral-900">
                        <svg 
                          className={`h-10 w-10 transition-colors ${
                            environmentId === env.environment_id ? 'text-blue-400' : 'text-neutral-600 group-hover:text-neutral-500'
                          }`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      
                      {/* Environment Name */}
                      <div className="text-center">
                        <span className={`block text-xs font-medium leading-tight ${
                          environmentId === env.environment_id ? 'text-white' : 'text-neutral-300'
                        }`}>
                          {env.environment_name}
                        </span>
                      </div>

                      {/* Selected Indicator */}
                      {environmentId === env.environment_id && (
                        <div className="absolute right-2 top-2">
                          <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Scroll to see all environments
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-neutral-800 p-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-neutral-700 px-6 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-900 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !projectName.trim()}
              className="inline-flex items-center gap-2 rounded-sm bg-blue-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
