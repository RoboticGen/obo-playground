"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Terminal, Minimize, Maximize, AlertCircle, X } from "lucide-react"
import { useSimulationStore } from "@/lib/simulation-store"

export interface TerminalOutput {
  message: string
  type: 'info' | 'error' | 'warning' | 'success'
  timestamp: Date
}

export function TerminalPanel() {
  const [output, setOutput] = useState<TerminalOutput[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const { executionError } = useSimulationStore()
  
  // Register to global output handler
  useEffect(() => {
    // Only register if not already set
    if (!window.terminalOutput) {
      const addOutput = (message: string, type: 'info' | 'error' | 'warning' | 'success' = 'info') => {
        setOutput(prev => {
          // Filter out consecutive duplicate messages
          if (prev.length > 0 && prev[prev.length - 1].message === message && prev[prev.length - 1].type === type) {
            return prev;
          }
          return [
            ...prev,
            {
              message,
              type,
              timestamp: new Date()
            }
          ];
        });
        // Auto-scroll to bottom
        if (terminalRef.current) {
          setTimeout(() => {
            terminalRef.current?.scrollTo({
              top: terminalRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }, 100);
        }
      }
      window.terminalOutput = addOutput
      addOutput('Terminal initialized. Ready for output...', 'info')
    }
    return () => {
      // Only clean up if this component set it
      if (window.terminalOutput) {
        window.terminalOutput = undefined
      }
    }
  }, [])
  
  // Handle execution errors
  useEffect(() => {
    if (executionError) {
      const addOutput = window.terminalOutput
      if (addOutput) {
        addOutput(`Execution Error: ${executionError}`, 'error')
      }
    }
  }, [executionError])

  const clearTerminal = () => {
    setOutput([])
  }
  
  const heightClass = isCollapsed 
    ? "h-10" 
    : isFocused 
      ? "h-[250px]" 
      : "h-[150px]"
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg transition-all duration-200 z-50 ${heightClass} w-full max-w-[100vw] overflow-hidden`}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="font-medium text-sm">Terminal Output</span>
          <span className="text-xs text-muted-foreground">{output.length} messages</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            onClick={clearTerminal} 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 rounded-full"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Clear</span>
          </Button>
          
          <Button 
            onClick={() => setIsFocused(!isFocused)} 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 rounded-full"
          >
            {isFocused ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            <span className="sr-only">{isFocused ? 'Minimize' : 'Maximize'}</span>
          </Button>
          
          <Button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 rounded-full"
          >
            <span className="h-3.5 w-3.5">
              {isCollapsed ? '↑' : '↓'}
            </span>
            <span className="sr-only">{isCollapsed ? 'Expand' : 'Collapse'}</span>
          </Button>
        </div>
      </div>
      
      {/* Terminal Content */}
      {!isCollapsed && (
        <div 
          ref={terminalRef}
          className="p-3 overflow-y-auto bg-black/90 h-[calc(100%-36px)] font-mono text-xs md:text-sm container mx-auto"
        >
          {output.map((line, i) => (
            <div key={i} className={`mb-1 ${
              line.type === 'error' ? 'text-red-400' : 
              line.type === 'warning' ? 'text-yellow-400' : 
              line.type === 'success' ? 'text-green-400' : 'text-gray-300'
            }`}>
              <span className="opacity-60">[{line.timestamp.toLocaleTimeString()}]</span> {line.message}
            </div>
          ))}
          
          {output.length === 0 && (
            <div className="text-gray-500 italic">
              No output to display
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// This is already declared in global.d.ts or a similar file, so we don't need to redeclare it here
