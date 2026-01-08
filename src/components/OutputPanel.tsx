interface OutputPanelProps {
  output: string[];
  state: Record<string, unknown>;
}

export function OutputPanel({ output, state }: OutputPanelProps) {
  return (
    <div 
      className="h-48 border-t flex"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      {/* Console Output */}
      <div className="flex-1 flex flex-col">
        <div 
          className="px-4 py-2 border-b text-xs font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          Console
        </div>
        <div className="flex-1 overflow-auto p-4">
          {output.length === 0 ? (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Output will appear here...
            </span>
          ) : (
            <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {output.map((line, i) => (
                <div key={i} className="py-0.5">
                  {line.startsWith('Error') ? (
                    <span style={{ color: '#ef4444' }}>{line}</span>
                  ) : line.startsWith('✓') ? (
                    <span style={{ color: 'var(--accent)' }}>{line}</span>
                  ) : (
                    line
                  )}
                </div>
              ))}
            </pre>
          )}
        </div>
      </div>

      {/* State Inspector */}
      {Object.keys(state).length > 0 && (
        <div 
          className="w-64 border-l flex flex-col"
          style={{ borderColor: 'var(--border)' }}
        >
          <div 
            className="px-4 py-2 border-b text-xs font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
          >
            State
          </div>
          <div className="flex-1 overflow-auto p-4">
            <pre className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {JSON.stringify(state, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

