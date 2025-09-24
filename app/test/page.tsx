'use client';

import dynamic from 'next/dynamic';

const SimpleOboCarTest = dynamic(
  () => import('@/components/simple-obo-car-test').then(mod => ({ default: mod.SimpleOboCarTest })),
  { ssr: false }
);

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        🚗 Obo Car Pyodide Test
      </h1>
      <SimpleOboCarTest />
    </div>
  );
}