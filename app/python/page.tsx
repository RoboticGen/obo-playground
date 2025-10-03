"use client"

import dynamic from 'next/dynamic';

const OboCarPyodideComponent = dynamic(
  () => import('@/components/obocar-pyodide'),
  { ssr: false }
);

export default function PythonPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Obo Car Python Simulator</h1>
      <p className="mb-4">
        This page allows you to run Python code with the Obo Car module directly in your browser.
      </p>
      
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-semibold mb-2"> New Feature: Event-Driven Loops</h2>
        <p className="mb-2">
          We&apos;ve added support for non-blocking event-driven loops! Instead of using <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">while True</code> loops 
          that freeze the UI, try these better approaches:
        </p>
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md mb-2 font-mono text-sm overflow-x-auto">
          <pre>{`# Method 1: Using the @event_loop decorator
@event_loop
def square_pattern():
    car.forward(1)
    car.right(90)
    return True  # Return True to continue the loop

# Method 2: Using car.repeat
car.repeat(4, lambda: car.forward(1) or car.right(90))

# Method 3: Using the global repeat function
repeat(4, lambda: [car.forward(1), car.right(90)])
`}</pre>
        </div>
        <p className="text-sm">
          <a href="/python/event_loop_demo.py" className="text-blue-600 dark:text-blue-400 hover:underline">
            View event_loop_demo.py for more examples →
          </a>
        </p>
      </div>
      
      <OboCarPyodideComponent />
    </div>
  )
}