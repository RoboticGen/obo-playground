'use client';

import OboCarPyodideComponent from '@/components/obocar-pyodide-component';

export default function PyodideDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Obo Car Pyodide Integration</h1>
      <p className="mb-4">
        This demo shows how to integrate the Obo Car module with Pyodide to run Python code in the browser.
      </p>
      <OboCarPyodideComponent />
    </div>
  );
}