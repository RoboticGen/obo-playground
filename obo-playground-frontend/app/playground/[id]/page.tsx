'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getPythonExecutor, ExecutionEvent, CarState } from '@/lib/pythonExecutor';
import { Environment } from '@/lib/environmentsApi';
import { projectsApi } from '@/lib/api';
import CodeEditor from '@/components/CodeEditor';

// Dynamic import for BabylonScene to avoid SSR issues
const BabylonScene = dynamic(() => import('@/components/BabylonScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        <p className="text-lg text-white">Loading 3D Engine...</p>
      </div>
    </div>
  ),
});

const DEFAULT_CODE = `# OBOCar Playground
# Control your virtual car with Python!

from obocar import OBOCar
from time import sleep

# Create car instance
car = OBOCar()

# Move forward for 1 second
car.move_forward(speed=512)
sleep(1)

# Stop
car.stop()
sleep(0.5)

# Turn left
car.turn_left(speed=400)
sleep(0.5)

# Move forward again
car.move_forward(speed=512)
sleep(1)

# Stop
car.stop()

# Try a simple pattern - Square movement
# for i in range(4):
#     car.move_forward(speed=512)
#     sleep(1)
#     car.turn_right(speed=400)
#     sleep(0.5)
# car.stop()

# Or try obstacle avoidance with while True:
# while True:
#     distance = car.get_front_distance()
#     if distance < 20:
#         car.move_backward(512)
#         sleep(0.3)
#         car.turn_right(512)
#         sleep(0.5)
#     else:
#         car.move_forward(512)
#     sleep(0.1)
`;

export default function PlaygroundPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [code, setCode] = useState(DEFAULT_CODE);
  const [isRunning, setIsRunning] = useState(false);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [currentLine, setCurrentLine] = useState<number | undefined>(undefined);
  const [output, setOutput] = useState<string[]>([]);
  const [carState, setCarState] = useState<CarState>({
    leftMotorSpeed: 0,
    rightMotorSpeed: 0,
    leftMotorDirection: 0,
    rightMotorDirection: 0,
    frontDistance: 100,
    leftDistance: 100,
    rightDistance: 100,
  });
  const [leftPanelWidth, setLeftPanelWidth] = useState(60); // Percentage
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showConsole, setShowConsole] = useState(true);
  const [projectEnvironment, setProjectEnvironment] = useState<Environment | undefined>(undefined);

  const addOutput = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📝';
    setOutput((prev) => [...prev, `[${timestamp}] ${prefix} ${message}`]);
  }, []);

  // Load project and its environment
  useEffect(() => {
    const loadProject = async () => {
      try {
        const project = await projectsApi.getProjectById(projectId);
        if (project.environment) {
          setProjectEnvironment(project.environment);
          addOutput(`Loaded environment: ${project.environment.environment_name}`, 'success');
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        addOutput('Failed to load project environment', 'error');
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId, addOutput]);

  // Debug: Log state changes
  useEffect(() => {
     ('📊 isPyodideReady state:', isPyodideReady);
  }, [isPyodideReady]);

  // Initialize Pyodide on component mount
  useEffect(() => {
    const initPyodide = async () => {
      try {
         ('🐍 Starting Pyodide initialization...');
        addOutput('Initializing Python runtime...', 'info');
        await getPythonExecutor();
         ('✅ Pyodide ready, updating state...');
        setIsPyodideReady(true);
        addOutput('Python runtime ready! ✅', 'success');
      } catch (error: any) {
        console.error('❌ Pyodide init error:', error);
        addOutput(`Failed to initialize Python: ${error.message}`, 'error');
        setIsPyodideReady(false);
      }
    };
    initPyodide();
  }, [addOutput]);

  const handleRunCode = useCallback(async () => {
    if (!isPyodideReady) {
      addOutput('Python runtime is still loading, please wait...', 'error');
      return;
    }

    setIsRunning(true);
    setOutput([]);
    setCurrentLine(undefined);
    addOutput('Starting execution...', 'info');

    try {
      const executor = await getPythonExecutor();

      await executor.executeCode(code, (event: ExecutionEvent) => {
        switch (event.type) {
          case 'line':
            setCurrentLine(event.lineNumber);
            break;

          case 'output':
            if (event.message) {
              addOutput(event.message, 'info');
            }
            break;

          case 'error':
            addOutput(
              `Error${event.lineNumber ? ` at line ${event.lineNumber}` : ''}: ${event.message}`,
              'error'
            );
            break;

          case 'state_update':
            if (event.carState) {
               ('🎯 Playground received state:', event.carState);
              setCarState(event.carState);
            }
            break;

          case 'complete':
            addOutput('Execution completed successfully!', 'success');
            setCurrentLine(undefined);
            break;
        }
      });
    } catch (error: any) {
      addOutput(`Failed to execute: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  }, [code, addOutput, isPyodideReady]);

  const handleStopExecution = useCallback(async () => {
    setIsRunning(false);
    setCurrentLine(undefined);
    
    // Stop motors immediately
    setCarState({
      leftMotorSpeed: 0,
      rightMotorSpeed: 0,
      leftMotorDirection: 0,
      rightMotorDirection: 0,
      frontDistance: 100,
      leftDistance: 100,
      rightDistance: 100,
    });
    
    addOutput('Execution stopped by user', 'info');
  }, [addOutput]);

  const handleReset = useCallback(() => {
    // Stop execution first
    setIsRunning(false);
    setCurrentLine(undefined);
    
    // Reset car state
    setCarState({
      leftMotorSpeed: 0,
      rightMotorSpeed: 0,
      leftMotorDirection: 0,
      rightMotorDirection: 0,
      frontDistance: 100,
      leftDistance: 100,
      rightDistance: 100,
    });
    
    // Trigger car position reset in 3D scene
    window.dispatchEvent(new CustomEvent('resetCar'));
    
    addOutput('Car reset to initial position', 'success');
  }, [addOutput]);

  // Handle resize drag
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 30% and 70%
    if (newWidth >= 30 && newWidth <= 70) {
      setLeftPanelWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="flex h-screen flex-col bg-black">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-neutral-900 bg-black px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-black-700 p-1.5">
            <img src="/logo.ico" alt="OBO" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">OBO Playground</h1>
            <p className="text-xs text-neutral-500">Project: {projectId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Motor Speed Indicators */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Left:</span>
              <div className="flex h-6 w-24 items-center rounded-sm border border-neutral-800 bg-neutral-950">
                <div
                  className="h-full rounded-sm bg-blue-700 transition-all"
                  style={{ width: `${(carState.leftMotorSpeed / 512) * 100}%` }}
                ></div>
                <span className="ml-2 text-xs text-white">{carState.leftMotorSpeed}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Right:</span>
              <div className="flex h-6 w-24 items-center rounded-sm border border-neutral-800 bg-neutral-950">
                <div
                  className="h-full rounded-sm bg-blue-700 transition-all"
                  style={{ width: `${(carState.rightMotorSpeed / 512) * 100}%` }}
                ></div>
                <span className="ml-2 text-xs text-white">{carState.rightMotorSpeed}</span>
              </div>
            </div>
          </div>

          {/* Python Status Indicator */}
          {!isPyodideReady && (
            <div className="flex items-center gap-2 rounded-sm border border-yellow-900/50 bg-yellow-950/20 px-3 py-2 text-sm text-yellow-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
              Initializing Python...
            </div>
          )}
         

          {isRunning && (
            <button
              onClick={handleStopExecution}
              className="rounded-sm border border-red-900 bg-red-950 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-900/50"
            >
              ⏹ Stop
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="rounded-sm border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-neutral-700 hover:bg-neutral-900"
          >
            🔄 Reset Car
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left Panel - 3D Scene */}
        <div className="flex flex-col" style={{ width: `${leftPanelWidth}%` }}>
          <div className="flex h-12 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4">
            <span className="font-semibold text-white">
              3D Simulation {projectEnvironment && `- ${projectEnvironment.environment_name}`}
            </span>
            <div className="flex gap-2 text-xs text-neutral-400">
              <span>Front: {carState.frontDistance.toFixed(1)}cm</span>
              <span>Left: {carState.leftDistance.toFixed(1)}cm</span>
              <span>Right: {carState.rightDistance.toFixed(1)}cm</span>
            </div>
          </div>
          <div className="flex-1">
            <BabylonScene carState={carState} environment={projectEnvironment} />
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className="group relative w-1 cursor-col-resize bg-neutral-900 hover:bg-blue-700 transition-colors"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-neutral-700 px-0.5 py-4 opacity-0 transition-opacity group-hover:opacity-100">
            <svg className="h-4 w-2 text-white" fill="currentColor" viewBox="0 0 8 16">
              <circle cx="2" cy="4" r="1" />
              <circle cx="6" cy="4" r="1" />
              <circle cx="2" cy="8" r="1" />
              <circle cx="6" cy="8" r="1" />
              <circle cx="2" cy="12" r="1" />
              <circle cx="6" cy="12" r="1" />
            </svg>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex flex-col" style={{ width: `${100 - leftPanelWidth}%` }}>
          <div className="flex h-12 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4">
            <span className="font-semibold text-white">Python Code</span>
            {isRunning && currentLine && (
              <span className="text-sm text-yellow-400">Line {currentLine}</span>
            )}
          </div>
          <div className={showConsole ? 'h-2/3' : 'flex-1'}>
            {!isPyodideReady && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="text-center">
                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-700 border-t-transparent"></div>
                  <p className="text-lg font-semibold text-white">Loading Python Runtime...</p>
                  <p className="mt-2 text-sm text-neutral-400">This may take a moment on first load</p>
                </div>
              </div>
            )}
            <CodeEditor
              value={code}
              onChange={setCode}
              onRun={handleRunCode}
              isRunning={isRunning || !isPyodideReady}
              currentLine={currentLine}
            />
          </div>

          {/* Show Console Button */}
          {!showConsole && (
            <div className="border-t border-neutral-900 bg-neutral-950 px-4 py-2">
              <button
                onClick={() => setShowConsole(true)}
                className="flex w-full items-center justify-center gap-2 rounded-sm py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span>Show Console</span>
              </button>
            </div>
          )}

          {/* Console Output */}
          {showConsole && (
            <div className="flex h-1/3 flex-col border-t border-neutral-900 bg-black">
              <div className="flex h-10 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Console Output</span>
                  <button
                    onClick={() => setShowConsole(false)}
                    className="rounded-sm p-1 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
                    title="Hide Console"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-2">
                  {isRunning && (
                    <button
                      onClick={handleStopExecution}
                      className="rounded-sm bg-red-950 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-900/50"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => setOutput([])}
                    className="rounded-sm bg-neutral-900 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                {output.length === 0 ? (
                  <p className="text-neutral-500">No output yet. Run your code to see results here.</p>
                ) : (
                  output.map((line, index) => (
                    <div
                      key={index}
                      className={`mb-1 ${
                        line.includes('❌')
                          ? 'text-red-400'
                          : line.includes('✅')
                          ? 'text-green-400'
                          : 'text-neutral-300'
                      }`}
                    >
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex h-8 items-center justify-between border-t border-neutral-900 bg-neutral-950 px-4 text-xs text-neutral-400">
        <span>
          Status: {isRunning ? '🟢 Running' : isPyodideReady ? '⚪ Ready' : '🟡 Initializing...'}
        </span>
        <span>Python Runtime: Pyodide (WebAssembly)</span>
      </div>
    </div>
  );
}
