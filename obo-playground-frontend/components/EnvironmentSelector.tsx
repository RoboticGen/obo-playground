'use client';

import { useState, useEffect } from 'react';
import { getEnvironments, Environment } from '@/lib/environmentsApi';

interface EnvironmentSelectorProps {
  onSelect: (env: Environment) => void;
  selectedId?: number;
}

export default function EnvironmentSelector({ onSelect, selectedId }: EnvironmentSelectorProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEnvironments();
  }, []);

  async function loadEnvironments() {
    try {
      setLoading(true);
      const envs = await getEnvironments();
      setEnvironments(envs);
      setError(null);
    } catch (err) {
      console.error('Failed to load environments:', err);
      setError('Failed to load environments');
    } finally {
      setLoading(false);
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
          <p className="text-lg font-bold">Loading environments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-red-500 bg-red-50 p-4">
        <p className="font-bold text-red-800">❌ {error}</p>
        <button
          onClick={loadEnvironments}
          className="mt-2 border-2 border-black bg-white px-4 py-2 font-bold transition-all hover:bg-black hover:text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold uppercase tracking-wider">
          🎮 Select Environment
        </h3>
        <button
          onClick={loadEnvironments}
          className="border-2 border-black bg-white px-3 py-1 text-sm font-medium transition-all hover:bg-black hover:text-white"
        >
          🔄 Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {environments.map((env) => (
          <button
            key={env.environment_id}
            onClick={() => onSelect(env)}
            className={`
              border-2 border-black p-4 text-left
              transition-all duration-200
              hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
              hover:translate-x-[-4px] hover:translate-y-[-4px]
              ${
                selectedId === env.environment_id
                  ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black'
              }
            `}
          >
            {env.thumbnail && (
              <div className="mb-3 overflow-hidden border-2 border-black">
                <img 
                  src={env.thumbnail} 
                  alt={env.environment_name}
                  className="h-40 w-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder on error
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160"%3E%3Crect width="200" height="160" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            )}
            
            <h4 className="mb-2 text-xl font-bold uppercase tracking-wide">
              {env.environment_name}
            </h4>
            
            <p className={`mb-3 text-sm ${selectedId === env.environment_id ? 'text-gray-300' : 'text-gray-600'}`}>
              {env.description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              <span className={`border-2 px-2 py-1 text-xs font-bold uppercase ${getDifficultyColor(env.difficulty)}`}>
                {env.difficulty}
              </span>
              {env.tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className={`border-2 px-2 py-1 text-xs uppercase ${
                    selectedId === env.environment_id
                      ? 'border-white text-white'
                      : 'border-black text-black'
                  }`}
                >
                  #{tag}
                </span>
              ))}
              {env.tags && env.tags.length > 2 && (
                <span className={`px-2 py-1 text-xs ${selectedId === env.environment_id ? 'text-gray-300' : 'text-gray-500'}`}>
                  +{env.tags.length - 2} more
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {environments.length === 0 && (
        <div className="border-2 border-black p-8 text-center">
          <p className="mb-4 text-lg font-bold">No environments available</p>
          <p className="text-gray-600">Contact your administrator to add environments.</p>
        </div>
      )}
    </div>
  );
}
