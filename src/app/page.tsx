"use client";
import dynamic from "next/dynamic";
import React, { useRef, useState, useEffect } from "react";
import { loadPyodideAndPackages } from "./pyodideRunner";

// --- Car API for simulation ---
// This object will be exposed to Python code as 'car'
const carAPI = {
  move: (speed: number) => {
    window.dispatchEvent(new CustomEvent("car-move", { detail: { speed } }));
  },
  rotate: (angle: number) => {
    window.dispatchEvent(new CustomEvent("car-rotate", { detail: { angle } }));
  },
  stop: () => {
    window.dispatchEvent(new CustomEvent("car-move", { detail: { speed: 0 } }));
  },
  forward: (speed: number, duration: number) => {
    window.dispatchEvent(new CustomEvent("car-forward", { detail: { speed, duration } }));
  },
  rotateBy: (angle: number, duration: number) => {
    window.dispatchEvent(new CustomEvent("car-rotateBy", { detail: { angle, duration } }));
  },
};

// This function executes Python code using Pyodide and exposes carAPI
export async function runPython(code: string): Promise<string> {
  try {
    const pyodide = await loadPyodideAndPackages();
    pyodide.globals.set("car", carAPI);
    pyodide.globals.set("wait", (seconds: number) => new Promise(res => setTimeout(res, seconds * 1000)));
    let output = "";
    pyodide.setStdout({ batched: (s: string) => { output += s; } });
    pyodide.setStderr({ batched: (s: string) => { output += s; } });
    await pyodide.runPythonAsync(code);
    return output || "(no output)";
  } catch (e: any) {
    return "Python error: " + (e.message || String(e));
  }
}


const OboCar3D = dynamic(() => import("./OboCar3D"), { ssr: false });

// --- Logger Panel ---
function CarLogger({ isRunning }: { isRunning: boolean }) {
  const [logEntries, setLogEntries] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      setLogEntries([]);
      intervalRef.current = setInterval(() => {
        // @ts-ignore
        const sensors = window.oboCarSensorData;
        if (sensors && sensors.position && sensors.rotation) {
          setLogEntries(prev => [
            ...prev.slice(-199),
            {
              t: Date.now(),
              position: [...sensors.position],
              rotation: [...sensors.rotation],
            },
          ]);
        }
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/90 text-green-200 text-xs font-mono px-4 py-2 z-50 max-h-40 overflow-y-auto border-t-2 border-cyan-700 shadow-lg transition-all">
      <div className="font-bold text-cyan-300 mb-1">Car Logger (latest 200)</div>
      <div className="space-y-0.5 min-h-[1.5em]">
        {isRunning && logEntries.length === 0 && (
          <div className="text-cyan-700 italic">Waiting for car movement...</div>
        )}
        {logEntries.slice(-40).reverse().map((entry, i) => (
          <div key={entry.t + '-' + i} className="flex gap-4">
            <span className="text-cyan-400">{new Date(entry.t).toLocaleTimeString('en-US', { hour12: false })}.{String(entry.t % 1000).padStart(3, '0')}</span>
            <span>pos: [{entry.position.map((v: number) => v.toFixed(2)).join(", ")}]</span>
            <span>rot: [{entry.rotation.map((v: number) => v.toFixed(2)).join(", ")}]</span>
          </div>
        ))}
        {!isRunning && (
          <div className="text-cyan-700 italic">Logger idle. Run code to see car position and rotation updates.</div>
        )}
      </div>
    </div>
  );
}
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function Home() {
  const [code, setCode] = useState(`# MicroPython-like code\ndef move():\n    # Example: move forward\n    pass\n`);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [warning, setWarning] = useState<string>("");
  const [lastVelocity, setLastVelocity] = useState<number | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const cancelRef = useRef<{cancelled: boolean}>({cancelled: false});

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("Running...");
    setWarning("");
    setHasRun(true);
    cancelRef.current.cancelled = false;
    let moveIssued = false;
    const moveListener = (e: Event) => { moveIssued = true; };
    window.addEventListener("car-move", moveListener);
    try {
      const result = await runPython(code, cancelRef.current);
      setOutput(String(result));
      setTimeout(() => {
        // @ts-ignore
        const velocity = window?.oboCarSensorData?.velocity;
        if (moveIssued && (typeof velocity === "number") && Math.abs(velocity) < 0.01) {
          setWarning("Warning: Move command issued, but car is not moving. Check your code or simulation state.");
        }
        setLastVelocity(velocity ?? null);
      }, 500);
    } catch (e) {
      setOutput("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      window.removeEventListener("car-move", moveListener);
      setIsRunning(false);
    }
  };

  // No carPath collection needed (no D3 dashboard)
  return (
  <div className="flex flex-col md:flex-row h-screen w-screen bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] text-white">
  {/* Editor Panel */}
  <div className="w-full md:w-1/3 h-1/2 md:h-full p-6 flex flex-col bg-gradient-to-b from-[#232526] to-[#0f2027] border-r border-gray-800 shadow-2xl z-10">
  <h2 className="text-2xl font-extrabold mb-4 tracking-tight text-cyan-300 drop-shadow">Python Code Editor</h2>
  <div className="flex-1 min-h-0 rounded-xl overflow-hidden border-2 border-cyan-700 shadow-2xl bg-black/80">
          <MonacoEditor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={v => setCode(v || "")}
            options={{
              fontSize: 16,
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
  <div className="mt-6 flex gap-3">
          <button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold transition disabled:opacity-60"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run"}
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold transition"
            onClick={() => {
              cancelRef.current.cancelled = true;
              setIsRunning(false);
              setOutput("");
              setWarning("");
              setLastVelocity(null);
              setCarPath([]);
              setHasRun(false);
              // Clear all car stop checks (for infinite rotation/move)
              if (typeof window !== 'undefined' && window._oboCarStopChecks) {
                window._oboCarStopChecks = [];
              }
              window.dispatchEvent(new CustomEvent('car-reset'));
            }}
            disabled={false}
          >
            Reset
          </button>
        </div>
        <div className="mt-6">
          <div className="bg-black/80 rounded-xl p-3 min-h-[40px] text-base font-mono text-green-300 whitespace-pre-wrap shadow-inner border border-cyan-800">
            {output}
          </div>
          {warning && (
            <div className="mt-3 bg-yellow-900/80 text-yellow-300 rounded-xl p-3 text-sm font-semibold border border-yellow-700 shadow">
              {warning}
            </div>
          )}
        </div>
      </div>
      {/* Simulation Panel */}
      <div className="w-full md:w-2/3 h-full flex flex-col relative">
        <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-cyan-900/30 via-transparent to-indigo-900/40" />
        <div className="flex-1 min-h-0 relative">
          <OboCar3D />
          {/* Add glowing border and glass effect */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl border-4 border-cyan-400/30 shadow-[0_0_80px_10px_rgba(34,211,238,0.2)]" />
        </div>
        {/* Car Logger Panel */}
        <CarLogger isRunning={isRunning} />
      </div>
    </div>
  );
}
