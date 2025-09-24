'use client';

import dynamic from 'next/dynamic';

const EmbeddedOboCarTest = dynamic(
  () => import('@/components/embedded-obo-car-test').then(mod => ({ default: mod.EmbeddedOboCarTest })),
  { ssr: false }
);

export default function EmbeddedTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        🚗 Embedded Obo Car Test
      </h1>
      <p className="text-center text-gray-600 mb-8">
        This version embeds the Python code directly, avoiding file loading issues
      </p>
      <EmbeddedOboCarTest />
    </div>
  );
}