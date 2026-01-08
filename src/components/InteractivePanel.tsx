import { ReactNode } from 'react';
import { Play, RotateCcw, Lightbulb } from 'lucide-react';

interface InteractivePanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  onReset?: () => void;
  hint?: string;
  showHint?: boolean;
  onToggleHint?: () => void;
}

export function InteractivePanel({
  title,
  description,
  children,
  onReset,
  hint,
  showHint,
  onToggleHint,
}: InteractivePanelProps) {
  return (
    <div className="rounded-xl border border-obsidian-600 bg-obsidian-800/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-obsidian-700/50 border-b border-obsidian-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyber-green/20 flex items-center justify-center">
            <Play size={16} className="text-cyber-green" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-obsidian-100">{title}</h3>
            {description && (
              <p className="text-xs text-obsidian-300 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hint && onToggleHint && (
            <button
              onClick={onToggleHint}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                showHint
                  ? 'bg-cyber-yellow/20 text-cyber-yellow'
                  : 'bg-obsidian-600 text-obsidian-300 hover:text-cyber-yellow'
              }`}
            >
              <Lightbulb size={14} />
              Hint
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-obsidian-600 text-obsidian-300 hover:text-obsidian-100 rounded-lg transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {showHint && hint && (
        <div className="px-5 py-3 bg-cyber-yellow/5 border-b border-cyber-yellow/20">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-cyber-yellow flex-shrink-0 mt-0.5" />
            <p className="text-sm text-obsidian-200">{hint}</p>
          </div>
        </div>
      )}

      <div className="p-5">{children}</div>
    </div>
  );
}

