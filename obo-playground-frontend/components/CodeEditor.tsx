'use client';

import { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  isRunning: boolean;
  currentLine?: number;
}

export default function CodeEditor({
  value,
  onChange,
  onRun,
  isRunning,
  currentLine,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure Python language features
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: () => {
        const suggestions = [
          {
            label: 'move_forward',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'move_forward(${1:speed})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Move the car forward at specified speed (0-512)',
          },
          {
            label: 'move_backward',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'move_backward(${1:speed})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Move the car backward at specified speed (0-512)',
          },
          {
            label: 'turn_left',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'turn_left(${1:speed})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Turn the car left',
          },
          {
            label: 'turn_right',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'turn_right(${1:speed})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Turn the car right',
          },
          {
            label: 'stop',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'stop()',
            documentation: 'Stop all car movement',
          },
          {
            label: 'get_front_distance',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'get_front_distance()',
            documentation: 'Get distance to front obstacle in cm',
          },
          {
            label: 'get_left_distance',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'get_left_distance()',
            documentation: 'Get distance to left obstacle in cm',
          },
          {
            label: 'get_right_distance',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'get_right_distance()',
            documentation: 'Get distance to right obstacle in cm',
          },
        ];

        return { suggestions };
      },
    });

    // Add keyboard shortcut for running code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!isRunning) {
        onRun();
      }
    });
  }

  // Highlight current executing line
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || currentLine === undefined) {
      return;
    }

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Remove old decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

    // Add new decoration for current line
    if (currentLine > 0) {
      decorationsRef.current = editor.deltaDecorations(
        [],
        [
          {
            range: new monaco.Range(currentLine, 1, currentLine, 1),
            options: {
              isWholeLine: true,
              className: 'current-line-highlight',
              glyphMarginClassName: 'current-line-glyph',
            },
          },
        ]
      );

      // Scroll to current line
      editor.revealLineInCenter(currentLine);
    }
  }, [currentLine]);

  return (
    <div className="relative h-full w-full">
      <style jsx global>{`
        .current-line-highlight {
          background: rgba(255, 255, 255, 0.08) !important;
          border-left: 3px solid #ffffff;
        }
        .current-line-glyph {
          background: #ffffff;
          width: 5px !important;
        }
      `}</style>

      <Editor
        height="100%"
        defaultLanguage="python"
        value={value}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: 'on',
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          renderLineHighlight: 'all',
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />

      {/* Run button */}
      <button
        onClick={onRun}
        disabled={isRunning}
        title="Run code (Ctrl+Enter)"
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg border-2 border-white bg-black px-4 py-2 font-bold text-white shadow-lg transition-all hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-gray-600 disabled:bg-gray-900 disabled:opacity-50"
      >
        {isRunning ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Running...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Run 
          </>
        )}
      </button>
    </div>
  );
}
