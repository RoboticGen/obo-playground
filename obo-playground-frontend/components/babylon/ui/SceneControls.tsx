interface SceneControlsProps {
  isWebGPU: boolean;
  physicsActive: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
}

export function SceneControls({ isWebGPU, physicsActive, showGrid, onToggleGrid }: SceneControlsProps) {
  return (
    <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
      <div className="rounded-sm border border-neutral-800 bg-black/80 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
        {isWebGPU ? 'WebGPU' : 'WebGL'}
      </div>

      <div
        className={`rounded-sm border px-3 py-1.5 text-xs backdrop-blur-sm ${
          physicsActive
            ? 'border-green-700 bg-green-900/80 text-green-300'
            : 'border-red-700 bg-red-900/80 text-red-300'
        }`}
      >
        Physics: {physicsActive ? 'Active' : 'Inactive'}
      </div>

      <button
        onClick={onToggleGrid}
        className={`rounded-sm border p-2 backdrop-blur-sm transition-colors ${
          showGrid
            ? 'border-blue-700 bg-blue-700/20 text-blue-400 hover:bg-blue-700/30'
            : 'border-neutral-800 bg-black/80 text-neutral-400 hover:bg-neutral-900/80'
        }`}
        title="Toggle Grid"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5h16M4 12h16M4 19h16M4 5v14M12 5v14M20 5v14"
          />
        </svg>
      </button>
    </div>
  );
}
