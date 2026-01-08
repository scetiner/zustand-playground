import { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { lessons } from '../data/lessons';
import { runCode, type RunResult } from '../utils/codeRunner';

interface CodeEditorProps {
  lesson: typeof lessons[0];
  onReset?: () => void;
  onRunResult?: (result: RunResult) => void;
}

export function CodeEditor({ lesson, onReset, onRunResult }: CodeEditorProps) {
  const starterCode = getStarterCode(lesson.id);
  const solutionCode = getSolutionCode(lesson.id);
  
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState<{ type: 'success' | 'error' | 'info' | 'log'; message: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Reset code when lesson changes
  useEffect(() => {
    setCode(starterCode);
    setOutput([]);
    setShowSolution(false);
  }, [lesson.id, starterCode]);

  const executeCode = useCallback(async () => {
    setIsRunning(true);
    setOutput([{ type: 'info', message: '⏳ Running code...' }]);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // First validate the code structure
    const validation = validateCode(lesson.id, code);
    
    if (!validation.isValid) {
      setOutput(validation.errors.map(e => ({ type: 'error' as const, message: e })));
      setIsRunning(false);
      return;
    }

    // Execute the code
    const result = runCode(code);
    
    const newOutput: { type: 'success' | 'error' | 'info' | 'log'; message: string }[] = [];
    
    // Add logs from execution
    result.logs.forEach(log => {
      if (log.startsWith('[ERROR]')) {
        newOutput.push({ type: 'error', message: log.replace('[ERROR] ', '') });
      } else if (log.startsWith('[WARN]')) {
        newOutput.push({ type: 'info', message: log.replace('[WARN] ', '') });
      } else {
        newOutput.push({ type: 'log', message: log });
      }
    });
    
    if (result.success) {
      if (result.storeState) {
        newOutput.push({ type: 'success', message: `✓ Store created with state: ${JSON.stringify(result.storeState)}` });
      }
      newOutput.push({ type: 'success', message: '✓ All checks passed!' });
      
      // Notify parent about the result
      onRunResult?.(result);
    } else {
      newOutput.push({ type: 'error', message: result.error || 'Unknown error' });
    }
    
    setOutput(newOutput);
    setIsRunning(false);
  }, [code, lesson.id, onRunResult]);

  const resetCode = () => {
    setCode(starterCode);
    setOutput([]);
    setShowSolution(false);
    onReset?.();
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSolution = () => {
    if (showSolution) {
      setCode(starterCode);
    } else {
      setCode(solutionCode);
    }
    setShowSolution(!showSolution);
    setOutput([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div 
        className="flex items-center justify-between px-3 py-1.5 border-b"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>editor.tsx</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSolution}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: showSolution ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {showSolution ? <EyeOff size={10} /> : <Eye size={10} />}
            {showSolution ? 'Hide' : 'Solution'}
          </button>
          <button onClick={copyCode} className="p-1 rounded transition-colors hover:bg-white/5" title="Copy">
            {copied ? <Check size={12} style={{ color: 'var(--accent)' }} /> : <Copy size={12} style={{ color: 'var(--text-muted)' }} />}
          </button>
          <button onClick={resetCode} className="p-1 rounded transition-colors hover:bg-white/5" title="Reset">
            <RotateCcw size={12} style={{ color: 'var(--text-muted)' }} />
          </button>
          <button
            onClick={executeCode}
            disabled={isRunning}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ml-1"
            style={{ 
              background: 'var(--accent)', 
              color: 'var(--bg-primary)',
              opacity: isRunning ? 0.7 : 1,
            }}
          >
            <Play size={10} />
            {isRunning ? '...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            lineHeight: 18,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            contextmenu: false,
            folding: true,
            glyphMargin: false,
            lineDecorationsWidth: 4,
            lineNumbersMinChars: 3,
          }}
        />
      </div>

      {/* Output Panel */}
      <div 
        className="h-28 border-t flex flex-col"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="px-3 py-1 border-b text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          Output
        </div>
        <div className="flex-1 overflow-auto p-2">
          {output.length === 0 ? (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Click "Run" to execute and see results in Preview →
            </span>
          ) : (
            <div className="space-y-1">
              {output.map((item, i) => (
                <div 
                  key={i} 
                  className="text-xs flex items-start gap-1.5"
                  style={{ 
                    color: item.type === 'error' ? '#ef4444' : 
                           item.type === 'success' ? 'var(--accent)' : 
                           item.type === 'log' ? 'var(--text-primary)' :
                           'var(--text-secondary)' 
                  }}
                >
                  <span>{item.type === 'error' ? '✕' : item.type === 'success' ? '✓' : item.type === 'log' ? '›' : '→'}</span>
                  <span style={{ wordBreak: 'break-word' }}>{item.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Validation function for each lesson
function validateCode(lessonId: number, code: string): { isValid: boolean; errors: string[]; messages: string[] } {
  const errors: string[] = [];
  const messages: string[] = [];
  
  const cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  switch (lessonId) {
    case 1:
      if (!cleanCode.includes('count')) errors.push('Missing "count" state property');
      if (!cleanCode.includes('increment')) errors.push('Missing "increment" action');
      if (!cleanCode.includes('set(')) errors.push('Missing set() call in increment action');
      if (errors.length === 0) {
        messages.push('Store has count state');
        messages.push('increment action defined');
      }
      break;

    case 2:
      if (!cleanCode.includes('bears')) errors.push('Missing "bears" state property');
      if (!cleanCode.includes('increase')) errors.push('Missing "increase" action');
      if (!cleanCode.includes('decrease')) errors.push('Missing "decrease" action');
      if (errors.length === 0) messages.push('Store interface defined');
      break;

    case 3:
      if (!cleanCode.includes('increment')) errors.push('Missing "increment" action');
      if (!cleanCode.includes('set(')) errors.push('Missing set() call in increment');
      if (errors.length === 0) messages.push('increment action defined');
      break;

    case 4:
      if (!cleanCode.includes('addTodo')) errors.push('Missing addTodo action');
      if (!cleanCode.includes('toggleTodo')) errors.push('Missing toggleTodo action');
      if (!cleanCode.includes('removeTodo')) errors.push('Missing removeTodo action');
      // Check if actions have actual implementations (not just empty functions)
      if (cleanCode.includes('addTodo') && !cleanCode.includes('todos:')) {
        errors.push('addTodo should update todos array');
      }
      break;

    case 5:
      if (!cleanCode.includes('async')) errors.push('Missing async keyword');
      if (!cleanCode.includes('loading: true')) errors.push('Missing set({ loading: true }) before fetch');
      if (!cleanCode.includes('loading: false')) errors.push('Missing set({ loading: false }) after fetch');
      break;

    case 6:
      if (!cleanCode.includes('devtools(')) {
        errors.push('Missing devtools() middleware wrapper');
      }
      if (!cleanCode.includes("'increment'") && !cleanCode.includes('"increment"')) {
        errors.push('Missing action name in set() call (e.g., "increment")');
      }
      if (!cleanCode.includes('set(')) errors.push('Missing set() call');
      break;

    case 7:
      if (!cleanCode.includes('persist(')) {
        errors.push('Missing persist() middleware wrapper');
      }
      if (!cleanCode.includes('name:')) {
        errors.push('Missing storage name in persist options');
      }
      if (!cleanCode.includes('setTheme:') || !cleanCode.includes('set({')) {
        errors.push('Missing setTheme action with set()');
      }
      if (!cleanCode.includes('setFontSize:')) {
        errors.push('Missing setFontSize action');
      }
      break;

    case 8:
      if (!cleanCode.includes('immer(')) errors.push('Missing immer() middleware wrapper');
      if (!cleanCode.includes('state.user.profile.settings.notifications')) {
        errors.push('Use immer\'s direct mutation: state.user.profile.settings.notifications = ...');
      }
      break;

    default:
      // For other lessons, just check if create is used
      if (!cleanCode.includes('create(')) {
        errors.push('Missing create() call');
      }
  }

  return { isValid: errors.length === 0, errors, messages };
}

// Starter code for each lesson
function getStarterCode(lessonId: number): string {
  const starters: Record<number, string> = {
    1: `import { create } from 'zustand';

// Create a counter store
// Requirements:
// - count: number (start at 0)
// - increment: increases count by 1

const useStore = create((set) => ({
  // Add your state and actions here
  
}));

// Test
console.log('Initial state:', useStore.getState());
`,

    2: `import { create } from 'zustand';

// Create a typed bear store
// - bears: number
// - increase: add 1 bear
// - decrease: remove 1 bear (min 0)

const useBearStore = create((set) => ({
  bears: 0,
  // Add increase and decrease actions
  
}));

console.log('Bears:', useBearStore.getState());
`,

    3: `import { create } from 'zustand';

// Exercise: Understand selectors for performance
// This store has multiple state properties.
// When using in React, subscribing to the entire store
// causes re-renders even when unrelated state changes.

const useStore = create((set) => ({
  count: 0,
  name: 'Guest',
  theme: 'dark',
  // TODO: Add an increment action
  
}));

// YOUR TASK:
// 1. Add an increment action that increases count by 1
// 2. Understand that in React you would use:
//    const count = useStore((state) => state.count);
//    This "selector" only re-renders when count changes,
//    not when name or theme changes!

console.log('Store state:', useStore.getState());
`,

    4: `import { create } from 'zustand';

// Exercise: Build a Todo store with CRUD actions
// Create actions to add, toggle, and remove todos

let nextId = 1; // Use for unique IDs

const useTodoStore = create((set) => ({
  todos: [],
  
  // TODO: Implement addTodo(text)
  // Should add { id: nextId++, text, completed: false }
  addTodo: (text) => {
    // Your code here
  },
  
  // TODO: Implement toggleTodo(id)
  // Should toggle the completed status of a todo
  toggleTodo: (id) => {
    // Your code here
  },
  
  // TODO: Implement removeTodo(id)
  // Should remove a todo by id
  removeTodo: (id) => {
    // Your code here
  },
}));

// Test your implementation
console.log('Initial:', useTodoStore.getState().todos);
`,

    5: `import { create } from 'zustand';

// Exercise: Create a store with async data fetching
// Handle loading states and errors properly

const useUserStore = create((set) => ({
  users: [],
  loading: false,
  error: null,
  
  // TODO: Implement fetchUsers as an async action
  // 1. Set loading: true before fetching
  // 2. Simulate API call with: await new Promise(r => setTimeout(r, 500))
  // 3. Set users: ['Alice', 'Bob', 'Charlie'] and loading: false
  fetchUsers: async () => {
    // Your code here
  },
}));

// Test
console.log('Initial state:', useUserStore.getState());
`,

    6: `import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Exercise: Add DevTools support to your store
// DevTools middleware enables Redux DevTools integration
// 1. Wrap create() with devtools()
// 2. Add action names to set() calls

const useStore = create(
  // TODO: Wrap with devtools()
  (set) => ({
    count: 0,
    
    // TODO: Add increment action with DevTools action name
    // Use set() with 3 arguments:
    // 1. Update function: (s) => ({ count: s.count + 1 })
    // 2. Replace flag: false
    // 3. Action name: 'increment'
    increment: () => {
      // Your code here
    },
  })
);

console.log('Store state:', useStore.getState());
`,

    7: `import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Exercise: Create a persisted settings store
// The persist middleware automatically saves to localStorage!
// Wrap create() with persist()

const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      fontSize: 14,
      
      // TODO: Implement setTheme action
      setTheme: (theme) => {
        // Your code here
      },
      
      // TODO: Implement setFontSize action
      setFontSize: (size) => {
        // Your code here
      },
    }),
    {
      name: 'settings-store', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

console.log('Store (persisted):', useSettingsStore.getState());
`,

    8: `import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Exercise: Update deeply nested state with Immer
// Toggle user.profile.settings.notifications
// With immer, you can mutate the draft directly!

const useStore = create(
  immer((set) => ({
    user: {
      profile: {
        name: 'John',
        settings: { notifications: true }
      }
    },
    
    // TODO: Implement toggleNotifications using immer
    // With immer, you can write: state.user.profile.settings.notifications = !...
    toggleNotifications: () => set((state) => {
      // Your code here - mutate state directly
    }),
  }))
);

console.log('Initial:', useStore.getState().user.profile.settings);
`,

    9: `import { create } from 'zustand';

// Exercise: Implement the slice pattern
// Create separate slices and combine them

// TODO: Create a user slice with:
// - user: null
// - login(name): sets user to { name }
// - logout(): sets user to null
const createUserSlice = (set) => ({
  // Your code here
});

// TODO: Create a cart slice with:
// - items: []
// - addItem(item): adds item to array
const createCartSlice = (set) => ({
  // Your code here
});

// Combine slices
const useStore = create((set) => ({
  ...createUserSlice(set),
  ...createCartSlice(set),
}));

console.log('Store:', useStore.getState());
`,

    10: `import { create } from 'zustand';

// Exercise: Use get() for reading current state
// get() is the second parameter to create()

const useStore = create((set, get) => ({
  count: 0,
  
  // TODO: Use get().count to read and increment
  increment: () => {
    // Your code here - use get() to read current count
  },
  
  // TODO: Return true if count > 0
  isPositive: () => {
    // Your code here - use get()
  },
}));

console.log('Initial:', useStore.getState());
`,

    11: `import { create } from 'zustand';

// Exercise: Replace Context with Zustand
// No Provider wrappers needed!

// Before (Context):
// const ThemeContext = createContext()
// <ThemeContext.Provider value={{theme}}>

// After (Zustand) - implement this:
const useThemeStore = create((set) => ({
  theme: 'dark',
  
  // TODO: Toggle between 'dark' and 'light'
  toggleTheme: () => {
    // Your code here
  },
}));

console.log('Theme:', useThemeStore.getState().theme);
`,

    12: `import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

// Exercise: Subscribe to changes outside React
// TODO: Use useStore.subscribe() to log changes
// The callback receives (state, prevState)

// Your subscription code here:


// Then trigger some changes:
useStore.getState().increment();
console.log('Count:', useStore.getState().count);
`,

    13: `import { create } from 'zustand';

// Exercise: Create dynamic stores on demand
// Factory function that returns a new store

// TODO: Implement createFormStore
// Should have: values, setValue(key, value), reset()
function createFormStore(initialValues) {
  return create((set) => ({
    values: initialValues,
    
    // TODO: Update a single value by key
    setValue: (key, value) => {
      // Your code here
    },
    
    // TODO: Reset to initial values
    reset: () => {
      // Your code here
    },
  }));
}

// Create and test instances
const useLoginForm = createFormStore({ email: '', password: '' });
console.log('Login form:', useLoginForm.getState().values);
`,

    14: `import { create } from 'zustand';

// Exercise: Create isolated stores per MFE
// Each MFE has its own store - no state collision

// TODO: MFE 1 - Product Catalog store
// State: products (array), selected (null)
// Action: select(id)
const useProductStore = create((set) => ({
  products: ['Item A', 'Item B'],
  selected: null,
  // TODO: Implement select
}));

// TODO: MFE 2 - Shopping Cart store
// State: items (array)
// Action: add(item)
const useCartStore = create((set) => ({
  items: [],
  // TODO: Implement add
}));

console.log('Product MFE:', useProductStore.getState());
console.log('Cart MFE:', useCartStore.getState());
`,

    15: `import { create } from 'zustand';

// Exercise: Create shared auth store for MFEs
// This store is shared across all micro frontends

// TODO: Implement shared auth store
// State: user (null), token (null)
// Actions: login(user, token), logout()
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  
  // TODO: Set user and token
  login: (user, token) => {
    // Your code here
  },
  
  // TODO: Clear user and token
  logout: () => {
    // Your code here
  },
}));

console.log('Auth store:', useAuthStore.getState());
`,

    16: `import { create } from 'zustand';

// Exercise: Create an Event Bus for MFE communication
// MFEs can publish and subscribe to events

const useEventBus = create((set, get) => ({
  events: [],
  listeners: {},
  
  // TODO: Publish an event
  // 1. Create event object with type, payload, timestamp
  // 2. Add to events array (keep last 100)
  // 3. Notify all listeners for this type
  publish: (type, payload) => {
    // Your code here
  },
  
  // TODO: Subscribe to an event type
  // Add handler to listeners[type] array
  subscribe: (type, handler) => {
    // Your code here
  },
}));

console.log('Event bus:', useEventBus.getState());
`,

    17: `import { create } from 'zustand';

// Exercise: MFE Initialization Pattern
// Ensure stores are ready before rendering

const useAppStore = create((set, get) => ({
  initialized: false,
  config: null,
  
  // TODO: Implement initialize
  // 1. Check if already initialized (return early)
  // 2. Simulate async config fetch
  // 3. Set initialized=true and config
  initialize: async (remoteConfig) => {
    // Your code here
  },
}));

console.log('Store:', useAppStore.getState());
`,

    18: `import { create } from 'zustand';

// Exercise: Create a testable store
// Use factory pattern so each test gets fresh state

// TODO: Create a store factory with:
// - count: 0
// - increment, decrement, reset actions
const createStore = () => create((set) => ({
  count: 0,
  
  // TODO: Implement actions
  increment: () => {
    // Your code here
  },
  decrement: () => {
    // Your code here
  },
  reset: () => {
    // Your code here
  },
}));

// Test your store
const store = createStore();
console.log('Initial:', store.getState().count);
`,

    19: `import { create } from 'zustand';

// Best Practices Summary

// ✅ DO:
// 1. Use TypeScript
// 2. Use selectors for performance
// 3. Keep stores focused
// 4. Use middleware (devtools, persist)

// ❌ DON'T:
// 1. Put everything in one huge store
// 2. Subscribe to entire store without selector
// 3. Forget cleanup in subscribe()
// 4. Over-engineer simple state

const useStore = create((set) => ({
  // Focused, single responsibility
  items: [],
  loading: false,
  
  // Clear action names
  addItem: (item) => set((s) => ({ 
    items: [...s.items, item] 
  })),
  
  setLoading: (loading) => set({ loading }),
}));

console.log('Best practices store:', useStore.getState());
`,
  };

  return starters[lessonId] || '// Start coding here\n';
}

// Solution code for each lesson
function getSolutionCode(lessonId: number): string {
  const solutions: Record<number, string> = {
    1: `import { create } from 'zustand';

// Create a counter store
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// Test
console.log('Initial state:', useStore.getState());
useStore.getState().increment();
console.log('After increment:', useStore.getState());
`,

    2: `import { create } from 'zustand';

const useBearStore = create((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
  decrease: () => set((state) => ({ bears: Math.max(0, state.bears - 1) })),
  reset: () => set({ bears: 0 }),
}));

console.log('Bears:', useBearStore.getState());
useBearStore.getState().increase();
useBearStore.getState().increase();
console.log('After adding:', useBearStore.getState());
`,

    3: `import { create } from 'zustand';

// Solution: Store with increment action
const useStore = create((set) => ({
  count: 0,
  name: 'Guest',
  theme: 'dark',
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

// In React, use selectors to prevent unnecessary re-renders:
// const count = useStore((state) => state.count);
// Only re-renders when count changes, not name/theme!

console.log('Initial:', useStore.getState());
useStore.getState().increment();
console.log('After increment:', useStore.getState());
`,

    4: `import { create } from 'zustand';

// Solution: Complete Todo store with CRUD actions
let nextId = 1; // Use incrementing ID to avoid duplicates

const useTodoStore = create((set) => ({
  todos: [],
  
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { 
      id: nextId++, 
      text, 
      completed: false 
    }]
  })),
  
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    )
  })),
  
  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter((t) => t.id !== id)
  })),
}));

// Test the implementation
useTodoStore.getState().addTodo('Learn Zustand');
useTodoStore.getState().addTodo('Build MFE app');
console.log('Todos:', useTodoStore.getState().todos);
`,

    5: `import { create } from 'zustand';

// Solution: Async action with loading state
const useUserStore = create((set) => ({
  users: [],
  loading: false,
  error: null,
  
  fetchUsers: async () => {
    set({ loading: true, error: null });
    
    // Simulate API call
    await new Promise((r) => setTimeout(r, 500));
    
    set({ 
      users: ['Alice', 'Bob', 'Charlie'], 
      loading: false 
    });
  },
}));

// Test async action
console.log('Before fetch:', useUserStore.getState());
useUserStore.getState().fetchUsers();
`,

    6: `import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Solution: DevTools support with action names
const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(
        (s) => ({ count: s.count + 1 }),
        false, // replace: false
        'increment' // action name for DevTools
      ),
      decrement: () => set(
        (s) => ({ count: s.count - 1 }),
        false,
        'decrement'
      ),
    }),
    { name: 'CounterStore' }
  )
);

console.log('DevTools ready:', useStore.getState());
useStore.getState().increment();
console.log('After increment:', useStore.getState());
`,

    7: `import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Solution: Persisted settings store using real middleware
const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      fontSize: 14,
      
      setTheme: (theme) => set({ theme }),
      setFontSize: (size) => set({ fontSize: size }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Test - change and it auto-persists!
useSettingsStore.getState().setTheme('light');
console.log('localStorage:', localStorage.getItem('settings-store'));
console.log('State:', useSettingsStore.getState());
`,

    8: `import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Solution: Nested state updates with Immer
const useStore = create(
  immer((set) => ({
    user: {
      profile: {
        name: 'John',
        settings: { notifications: true }
      }
    },
    toggleNotifications: () => set((state) => {
      // With immer, we can mutate state directly!
      state.user.profile.settings.notifications = !state.user.profile.settings.notifications;
    }),
  }))
);

useStore.getState().toggleNotifications();
console.log('Settings:', useStore.getState().user.profile.settings);
`,

    9: `import { create } from 'zustand';

// Solution: Store slices
const createUserSlice = (set) => ({
  user: null,
  login: (name) => set({ user: { name } }),
  logout: () => set({ user: null }),
});

const createCartSlice = (set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
});

const useStore = create((set) => ({
  ...createUserSlice(set),
  ...createCartSlice(set),
}));

useStore.getState().login('Alice');
useStore.getState().addItem('Product 1');
console.log('Store:', useStore.getState());
`,

    10: `import { create } from 'zustand';

// Solution: Using get() to read state
const useStore = create((set, get) => ({
  count: 0,
  increment: () => set({ count: get().count + 1 }),
  isPositive: () => get().count > 0,
}));

useStore.getState().increment();
console.log('Is positive?', useStore.getState().isPositive());
`,

    11: `import { create } from 'zustand';

// Solution: Replace Context with Zustand
const useThemeStore = create((set) => ({
  theme: 'dark',
  toggleTheme: () => set((s) => ({ 
    theme: s.theme === 'dark' ? 'light' : 'dark' 
  })),
}));

console.log('Theme:', useThemeStore.getState().theme);
useThemeStore.getState().toggleTheme();
console.log('After toggle:', useThemeStore.getState().theme);
`,

    12: `import { create } from 'zustand';

// Solution: External subscriptions
const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

const unsubscribe = useStore.subscribe((state, prevState) => {
  console.log('Changed:', prevState.count, '->', state.count);
});

useStore.getState().increment();
useStore.getState().increment();
unsubscribe();
`,

    13: `import { create } from 'zustand';

// Solution: Dynamic stores
function createFormStore(initialValues) {
  return create((set) => ({
    values: initialValues,
    setValue: (key, value) => set((s) => ({
      values: { ...s.values, [key]: value }
    })),
    reset: () => set({ values: initialValues }),
  }));
}

const useLoginForm = createFormStore({ email: '', password: '' });
useLoginForm.getState().setValue('email', 'test@example.com');
console.log('Form:', useLoginForm.getState().values);
`,

    14: `import { create } from 'zustand';

// Solution: MFE Isolated stores
const useProductStore = create((set) => ({
  products: ['Item A', 'Item B'],
  selected: null,
  select: (id) => set({ selected: id }),
}));

const useCartStore = create((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
}));

useProductStore.getState().select('Item A');
useCartStore.getState().add('Item A');
console.log('Product:', useProductStore.getState());
console.log('Cart:', useCartStore.getState());
`,

    15: `import { create } from 'zustand';

// Solution: MFE Shared auth store
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));

useAuthStore.getState().login('Alice', 'jwt-token');
console.log('Auth:', useAuthStore.getState());
`,

    16: `import { create } from 'zustand';

// Solution: MFE Event Bus
const useEventBus = create((set, get) => ({
  events: [],
  listeners: {},
  publish: (type, payload) => {
    const event = { type, payload, timestamp: Date.now() };
    set((s) => ({ events: [...s.events.slice(-99), event] }));
    const handlers = get().listeners[type] || [];
    handlers.forEach(fn => fn(payload));
  },
  subscribe: (type, handler) => {
    set((s) => ({
      listeners: {
        ...s.listeners,
        [type]: [...(s.listeners[type] || []), handler]
      }
    }));
  },
}));

useEventBus.getState().subscribe('test', (d) => console.log('Got:', d));
useEventBus.getState().publish('test', { msg: 'Hello' });
`,

    17: `import { create } from 'zustand';

// Solution: MFE Initialization
const useAppStore = create((set, get) => ({
  initialized: false,
  config: null,
  initialize: async (remoteConfig) => {
    if (get().initialized) return;
    await new Promise(r => setTimeout(r, 300));
    set({ initialized: true, config: remoteConfig || { theme: 'dark' } });
    console.log('MFE ready!');
  },
}));

useAppStore.getState().initialize({ theme: 'light' });
console.log('Store:', useAppStore.getState());
`,

    18: `import { create } from 'zustand';

// Solution: Testable store factory
const createStore = () => create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set({ count: 0 }),
}));

const store = createStore();
console.assert(store.getState().count === 0, 'Initial should be 0');
store.getState().increment();
console.assert(store.getState().count === 1, 'Should be 1');
store.getState().decrement();
console.assert(store.getState().count === 0, 'Should be 0');
console.log('All tests passed!');
`,
  };

  return solutions[lessonId] || getStarterCode(lessonId);
}
