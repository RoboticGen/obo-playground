import { useEffect, useState } from 'react';
import { Mesh } from '@babylonjs/core';

interface UseGridProps {
  gridLinesRef: React.MutableRefObject<Mesh[]>;
}

export function useGrid({ gridLinesRef }: UseGridProps) {
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    gridLinesRef.current.forEach(line => {
      line.isVisible = showGrid;
    });
  }, [showGrid, gridLinesRef]);

  return { showGrid, setShowGrid };
}
