import { useState } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Bug, Eye, RotateCcw, Clock } from 'lucide-react';

// Demo store with devtools
interface DebugStore {
  counter: number;
  history: string[];
  increment: () => void;
  decrement: () => void;
  addToHistory: (action: string) => void;
  reset: () => void;
}

const useDebugStore = create<DebugStore>()(
  devtools(
    (set) => ({
      counter: 0,
      history: [],
      increment: () =>
        set(
          (state) => ({
            counter: state.counter + 1,
            history: [...state.history, `Incremented to ${state.counter + 1}`],
          }),
          undefined,
          'counter/increment'
        ),
      decrement: () =>
        set(
          (state) => ({
            counter: state.counter - 1,
            history: [...state.history, `Decremented to ${state.counter - 1}`],
          }),
          undefined,
          'counter/decrement'
        ),
      addToHistory: (action) =>
        set(
          (state) => ({ history: [...state.history, action] }),
          undefined,
          'history/add'
        ),
      reset: () =>
        set(
          { counter: 0, history: [] },
          undefined,
          'store/reset'
        ),
    }),
    { name: 'DebugStore', enabled: true }
  )
);

export function Lesson06() {
  const lesson = lessons.find((l) => l.id === 'lesson-6')!;
  const [showHint, setShowHint] = useState(false);
  
  const store = useDebugStore();

  const basicDevtoolsCode = `import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(
        (state) => ({ count: state.count + 1 }),
        undefined,      // replace flag (optional)
        'increment'     // action name for DevTools
      ),
    }),
    { name: 'MyStore' }  // Store name in DevTools
  )
);`;

  const namedActionsCode = `// Best practice: Name your actions for clear debugging
const useTaskStore = create(
  devtools(
    (set) => ({
      tasks: [],
      
      // Namespaced action names make debugging easier
      addTask: (task) => set(
        (state) => ({ tasks: [...state.tasks, task] }),
        undefined,
        'tasks/add'  // Shows as "tasks/add" in DevTools
      ),
      
      toggleTask: (id) => set(
        (state) => ({
          tasks: state.tasks.map(t =>
            t.id === id ? { ...t, done: !t.done } : t
          ),
        }),
        undefined,
        'tasks/toggle'
      ),
      
      removeTask: (id) => set(
        (state) => ({
          tasks: state.tasks.filter(t => t.id !== id),
        }),
        undefined,
        'tasks/remove'
      ),
    }),
    { name: 'TaskStore' }
  )
);`;

  const devtoolsOptionsCode = `import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({ /* ... */ }),
    {
      // Store name shown in DevTools
      name: 'MyAppStore',
      
      // Disable in production
      enabled: process.env.NODE_ENV === 'development',
      
      // Anonymize data (useful for sensitive info)
      anonymousActionType: 'ANONYMOUS',
      
      // Custom serialize options
      serialize: {
        options: {
          // Handle special types like Map, Set, etc.
          map: true,
          set: true,
        },
      },
      
      // Connect to a specific DevTools instance
      // trace: true,  // Include stack traces
      // traceLimit: 25,
    }
  )
);`;

  const multipleStoresCode = `// Multiple stores in DevTools
const useUserStore = create(
  devtools(
    (set) => ({ /* user state */ }),
    { name: 'UserStore' }
  )
);

const useCartStore = create(
  devtools(
    (set) => ({ /* cart state */ }),
    { name: 'CartStore' }
  )
);

const useUIStore = create(
  devtools(
    (set) => ({ /* UI state */ }),
    { name: 'UIStore' }
  )
);

// In DevTools, you'll see:
// - UserStore
// - CartStore  
// - UIStore
// Each with its own action history`;

  const conditionalDevtoolsCode = `// Environment-aware DevTools setup
import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

// Helper to conditionally apply devtools
const createStore = <T extends object>(
  storeCreator: StateCreator<T>,
  name: string
) => {
  const store = process.env.NODE_ENV === 'development'
    ? devtools(storeCreator, { name })
    : storeCreator;
    
  return create(store);
};

// Usage
const useMyStore = createStore(
  (set) => ({
    value: 0,
    increment: () => set(
      (state) => ({ value: state.value + 1 }),
      undefined,
      'increment'
    ),
  }),
  'MyStore'
);`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Debugging with Redux DevTools
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          Zustand integrates seamlessly with Redux DevTools, giving you time-travel debugging, 
          action history, and state inspection. This is invaluable for debugging complex 
          enterprise applications.
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              icon: <Eye size={20} />,
              title: 'State Inspection',
              description: 'View your entire store state at any point',
              color: 'cyber-blue',
            },
            {
              icon: <Clock size={20} />,
              title: 'Time Travel',
              description: 'Jump to any previous state',
              color: 'cyber-purple',
            },
            {
              icon: <RotateCcw size={20} />,
              title: 'Action History',
              description: 'See every action that modified state',
              color: 'cyber-green',
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`p-4 rounded-lg bg-${item.color}/10 border border-${item.color}/30`}
            >
              <div className={`w-10 h-10 rounded-lg bg-${item.color}/20 flex items-center justify-center mb-3 text-${item.color}`}>
                {item.icon}
              </div>
              <h3 className="font-medium text-obsidian-100 mb-1">{item.title}</h3>
              <p className="text-sm text-obsidian-400">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-cyber-yellow/10 border border-cyber-yellow/30">
          <div className="flex items-start gap-3">
            <Bug size={20} className="text-cyber-yellow flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-obsidian-200">
                <strong className="text-cyber-yellow">Prerequisite:</strong> Install the{' '}
                <a 
                  href="https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-blue hover:underline"
                >
                  Redux DevTools Extension
                </a>{' '}
                in your browser to see the full debugging experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Basic Setup */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Basic DevTools Setup
        </h2>
        <p className="text-obsidian-300 mb-4">
          Wrap your store creator with the <code className="text-cyber-yellow">devtools</code> middleware. 
          The third argument to <code className="text-cyber-yellow">set()</code> is the action name that 
          appears in DevTools.
        </p>
        <CodeBlock code={basicDevtoolsCode} filename="devtools-setup.ts" highlightLines={[5, 10, 11, 12, 14]} />
      </section>

      {/* Named Actions */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Naming Actions for Clear Debugging
        </h2>
        <p className="text-obsidian-300 mb-4">
          Use namespaced action names (like <code className="text-cyber-yellow">tasks/add</code>) for 
          clear, organized action history in DevTools.
        </p>
        <CodeBlock code={namedActionsCode} filename="named-actions.ts" highlightLines={[11, 18, 26]} />
      </section>

      {/* Interactive Example */}
      <section className="mb-10">
        <InteractivePanel
          title="DevTools Demo"
          description="Open Redux DevTools to see actions and state"
          onReset={store.reset}
          hint="Open Redux DevTools (F12 → Redux tab) to see each action appear with its name. You can jump back to any previous state!"
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Counter */}
              <div className="p-6 rounded-lg bg-obsidian-900 border border-obsidian-600 text-center">
                <p className="text-sm text-obsidian-400 mb-2">Counter</p>
                <p className="text-5xl font-mono font-bold text-cyber-yellow mb-4">
                  {store.counter}
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={store.decrement}
                    className="px-6 py-2 bg-obsidian-700 hover:bg-obsidian-600 text-obsidian-100 rounded-lg font-mono text-xl transition-colors"
                  >
                    −
                  </button>
                  <button
                    onClick={store.increment}
                    className="px-6 py-2 bg-cyber-yellow hover:bg-cyber-yellow-dim text-obsidian-900 rounded-lg font-mono text-xl font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action History */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-2">
                  Action History (Local)
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-xs">
                  {store.history.length === 0 ? (
                    <p className="text-obsidian-500 italic">No actions yet...</p>
                  ) : (
                    store.history.map((action, i) => (
                      <p key={i} className="text-obsidian-300">
                        <span className="text-cyber-purple">{i + 1}.</span> {action}
                      </p>
                    ))
                  )}
                </div>
              </div>

              <p className="text-xs text-obsidian-400 text-center">
                Open DevTools to see <code className="text-cyber-yellow">counter/increment</code> and{' '}
                <code className="text-cyber-yellow">counter/decrement</code> actions
              </p>
            </div>

            <StateInspector
              state={{
                counter: store.counter,
                historyLength: store.history.length,
              }}
              title="DebugStore State"
            />
          </div>
        </InteractivePanel>
      </section>

      {/* DevTools Options */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          DevTools Configuration Options
        </h2>
        <p className="text-obsidian-300 mb-4">
          The devtools middleware accepts various configuration options for customizing 
          the debugging experience.
        </p>
        <CodeBlock code={devtoolsOptionsCode} filename="devtools-options.ts" />
      </section>

      {/* Multiple Stores */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Multiple Stores in DevTools
        </h2>
        <p className="text-obsidian-300 mb-4">
          In MFE architectures with multiple stores, each store appears separately in DevTools 
          with its own action history. Name them clearly for easy identification.
        </p>
        <CodeBlock code={multipleStoresCode} filename="multiple-stores.ts" />
      </section>

      {/* Conditional DevTools */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Production-Safe DevTools
        </h2>
        <p className="text-obsidian-300 mb-4">
          Disable DevTools in production to improve performance and hide implementation details.
        </p>
        <CodeBlock code={conditionalDevtoolsCode} filename="conditional-devtools.ts" highlightLines={[9, 10, 11, 12]} />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Wrap store with devtools() middleware for Redux DevTools integration',
            'Name actions clearly with namespace/action format',
            'Use the enabled option to disable DevTools in production',
            'Multiple stores appear separately in DevTools',
            'Time-travel debugging helps trace state issues',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-obsidian-200">
              <span className="text-cyber-yellow mt-1">→</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <NavigationButtons />
    </div>
  );
}

