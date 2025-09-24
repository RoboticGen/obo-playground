'use client';

import dynamic from 'next/dynamic';

const PyodideDebugTest = dynamic(
  () => import('@/components/pyodide-debug-test').then(mod => ({ default: mod.PyodideDebugTest })),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading Python Debug Test...</span>
    </div>
  }
);

export default function PythonDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <PyodideDebugTest />
    </div>
  );
}
