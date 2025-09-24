"use client"

import OboCarPyodideComponent from "@/components/obocar-pyodide-component"

export default function PythonPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Obo Car Python Simulator</h1>
      <p className="mb-4">
        This page allows you to run Python code with the Obo Car module directly in your browser.
      </p>
      <OboCarPyodideComponent />
    </div>
  )
}