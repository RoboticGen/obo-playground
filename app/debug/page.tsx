'use client';

import { PyodideDebugTest } from '@/components/pyodide-debug-test';

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        🔍 Pyodide Debug Test
      </h1>
      <PyodideDebugTest />
    </div>
  );
}