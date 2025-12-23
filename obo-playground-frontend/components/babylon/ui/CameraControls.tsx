interface CameraControlsProps {
  onFocusOnCar: () => void;
}

export function CameraControls({ onFocusOnCar }: CameraControlsProps) {
  return (
    <div className="absolute right-4 top-4 flex flex-col gap-2">
      <button
        onClick={onFocusOnCar}
        className="group rounded-sm border border-neutral-800 bg-black/80 px-3 py-2 backdrop-blur-sm transition-all hover:border-blue-700 hover:bg-blue-700/20"
        title="Focus on Car"
      >
        <svg
          className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>
    </div>
  );
}
