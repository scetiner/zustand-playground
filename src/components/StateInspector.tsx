import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Clock, Zap } from 'lucide-react';

interface StateInspectorProps {
  state: Record<string, unknown>;
  title?: string;
  showTimestamp?: boolean;
}

export function StateInspector({ 
  state, 
  title = 'Current State',
  showTimestamp = true 
}: StateInspectorProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [flash, setFlash] = useState(false);
  const prevStateRef = useRef<string>('');

  useEffect(() => {
    const currentState = JSON.stringify(state);
    if (prevStateRef.current !== currentState) {
      setLastUpdate(Date.now());
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
      prevStateRef.current = currentState;
    }
  }, [state]);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderValue = (value: unknown, key: string, depth: number = 0): JSX.Element => {
    const indent = depth * 16;

    if (value === null) {
      return <span className="text-obsidian-300 italic">null</span>;
    }

    if (value === undefined) {
      return <span className="text-obsidian-300 italic">undefined</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-cyber-purple">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-cyber-orange">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-cyber-green">"{value}"</span>;
    }

    if (typeof value === 'function') {
      return <span className="text-cyber-blue italic">ƒ()</span>;
    }

    if (Array.isArray(value)) {
      const isExpanded = expanded[key] ?? depth < 2;
      return (
        <div style={{ marginLeft: depth > 0 ? indent : 0 }}>
          <button
            onClick={() => toggleExpand(key)}
            className="flex items-center gap-1 hover:text-cyber-yellow transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="text-obsidian-200">Array({value.length})</span>
          </button>
          {isExpanded && (
            <div className="ml-4 border-l border-obsidian-600 pl-2">
              {value.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-obsidian-400 select-none">{index}:</span>
                  {renderValue(item, `${key}.${index}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isExpanded = expanded[key] ?? depth < 2;
      const entries = Object.entries(value as Record<string, unknown>);
      return (
        <div style={{ marginLeft: depth > 0 ? indent : 0 }}>
          <button
            onClick={() => toggleExpand(key)}
            className="flex items-center gap-1 hover:text-cyber-yellow transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="text-obsidian-200">Object({entries.length})</span>
          </button>
          {isExpanded && (
            <div className="ml-4 border-l border-obsidian-600 pl-2">
              {entries.map(([k, v]) => (
                <div key={k} className="flex items-start gap-2">
                  <span className="text-cyber-pink select-none">{k}:</span>
                  {renderValue(v, `${key}.${k}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span className="text-obsidian-100">{String(value)}</span>;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={`rounded-lg border bg-obsidian-800 overflow-hidden transition-all duration-300 ${
        flash ? 'border-cyber-yellow shadow-lg shadow-cyber-yellow/20' : 'border-obsidian-600'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-obsidian-700 border-b border-obsidian-600">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-cyber-yellow" />
          <span className="text-sm font-medium text-obsidian-100">{title}</span>
        </div>
        {showTimestamp && (
          <div className="flex items-center gap-1.5 text-xs text-obsidian-300">
            <Clock size={12} />
            <span>{formatTime(lastUpdate)}</span>
          </div>
        )}
      </div>
      <div className="p-4 font-mono text-sm max-h-80 overflow-y-auto">
        {Object.entries(state).map(([key, value]) => {
          // Skip functions in display
          if (typeof value === 'function') return null;
          return (
            <div key={key} className="flex items-start gap-2 py-0.5">
              <span className="text-cyber-pink select-none">{key}:</span>
              {renderValue(value, key)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

