import { useState, useEffect, useCallback } from 'react';
import { lessons } from './data/lessons';
import { useProgressStore } from './stores/progressStore';
import { CodeEditor } from './components/CodeEditor';
import { LivePreview } from './components/LivePreview';
import { ChevronRight, ChevronLeft, Check, RotateCcw, BookOpen, Github } from 'lucide-react';
import { type RunResult } from './utils/codeRunner';

function App() {
  const [currentLessonId, setCurrentLessonId] = useState(1);
  const [showInstructions, setShowInstructions] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const { completedLessons, markComplete, resetProgress } = useProgressStore();
  
  // Reset preview when lesson changes
  const handleReset = useCallback(() => {
    setResetKey(k => k + 1);
    setRunResult(null);
  }, []);
  
  // Handle run result from code editor
  const handleRunResult = useCallback((result: RunResult) => {
    setRunResult(result);
  }, []);
  
  const currentLesson = lessons.find(l => l.id === currentLessonId) || lessons[0];
  const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
  const isCompleted = completedLessons.includes(currentLessonId);
  
  const progress = Math.round((completedLessons.length / lessons.length) * 100);

  const goNext = () => {
    if (currentIndex < lessons.length - 1) {
      setCurrentLessonId(lessons[currentIndex + 1].id);
      handleReset();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentLessonId(lessons[currentIndex - 1].id);
      handleReset();
    }
  };
  
  const selectLesson = (id: number) => {
    setCurrentLessonId(id);
    handleReset();
    // Hide Help panel for lesson 19 (documentation page)
    if (id === 19) {
      setShowInstructions(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && e.altKey) goNext();
      if (e.key === 'ArrowLeft' && e.altKey) goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Compact Header */}
      <header 
        className="flex items-center justify-between px-3 h-10 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-xs" style={{ color: 'var(--accent)' }}>ZUSTAND</span>
          
          <div className="flex items-center gap-1">
            <button onClick={goPrev} disabled={currentIndex === 0} className="p-0.5 rounded disabled:opacity-30 hover:bg-white/5">
              <ChevronLeft size={12} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <span className="text-xs min-w-[40px] text-center" style={{ color: 'var(--text-muted)' }}>
              {currentIndex + 1}/{lessons.length}
            </span>
            <button onClick={goNext} disabled={currentIndex === lessons.length - 1} className="p-0.5 rounded disabled:opacity-30 hover:bg-white/5">
              <ChevronRight size={12} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {currentLesson.id !== 19 && (
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${showInstructions ? 'bg-white/10' : ''}`}
              style={{ color: showInstructions ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              <BookOpen size={10} />
              Help
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
            </div>
            <span>{progress}%</span>
          </div>
          <button onClick={resetProgress} className="p-1 rounded hover:bg-white/5" title="Reset Progress">
            <RotateCcw size={10} style={{ color: 'var(--text-muted)' }} />
          </button>
          <a 
            href="https://github.com/scetiner/zustand-playground" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-white/5"
            title="View on GitHub"
          >
            <Github size={12} style={{ color: 'var(--text-muted)' }} />
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className="w-56 border-r overflow-y-auto flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <nav className="py-1">
            {lessons.map((lesson, idx) => {
              const isActive = lesson.id === currentLessonId;
              const isDone = completedLessons.includes(lesson.id);
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => selectLesson(lesson.id)}
                  className="w-full text-left px-2 py-1 flex items-center gap-1.5 transition-colors"
                  style={{
                    background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    fontSize: '11px',
                  }}
                >
                  <span 
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isDone ? 'var(--accent)' : 'transparent',
                      color: isDone ? 'var(--bg-primary)' : 'var(--text-muted)',
                      border: isDone ? 'none' : '1px solid var(--border)',
                      fontSize: '8px',
                    }}
                  >
                    {isDone ? <Check size={7} /> : String(idx + 1).padStart(2, '0')}
                  </span>
                  <span 
                    className="truncate"
                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {lesson.title}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Lesson Title */}
          <div 
            className="px-3 py-1.5 border-b flex items-center justify-between flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '10px' }}>
                {currentLesson.category}
              </span>
              <h1 className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {currentLesson.title}
              </h1>
            </div>
            
            <button
              onClick={() => !isCompleted && markComplete(currentLessonId)}
              disabled={isCompleted}
              className="px-2 py-0.5 rounded text-xs transition-all"
              style={{
                background: isCompleted ? 'var(--bg-tertiary)' : 'var(--accent)',
                color: isCompleted ? 'var(--text-muted)' : 'var(--bg-primary)',
                fontSize: '10px',
              }}
            >
              {isCompleted ? '✓ Done' : 'Complete'}
            </button>
          </div>

          {/* Instructions Panel (collapsible) - hidden for lesson 19 */}
          {showInstructions && currentLesson.id !== 19 && (
            <div 
              className="px-4 py-3 border-b overflow-y-auto max-h-48"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}
            >
              {/* Purpose - brief explanation */}
              <div 
                className="mb-3 p-2 rounded text-xs"
                style={{ background: 'var(--bg-primary)', borderLeft: '2px solid var(--accent)' }}
              >
                <span style={{ color: 'var(--accent)' }}>💡 Why: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{getPurpose(currentLesson.id)}</span>
              </div>
              
              <div className="flex gap-4">
                {/* Left: Instructions */}
                <div className="flex-1">
                  <ol className="space-y-1">
                    {getInstructions(currentLesson.id).map((instruction, i) => (
                      <li key={i} className="flex gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent)' }}>{i + 1}.</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                {/* Right: Expected Interface */}
                <div className="w-64 flex-shrink-0">
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Expected Interface:</div>
                  <pre 
                    className="text-xs p-2 rounded overflow-x-auto font-mono leading-relaxed"
                    style={{ background: 'var(--bg-primary)', color: 'var(--accent)', fontSize: '10px' }}
                  >
                    {getExpectedInterface(currentLesson.id)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Split View: Editor + Preview (or Full Doc View for lesson 19) */}
          {currentLesson.id === 19 ? (
            /* Lesson 19: Full-width documentation view */
            <div className="flex-1 overflow-auto" style={{ background: 'var(--bg-secondary)' }}>
              <LivePreview lessonId={currentLesson.id} resetKey={resetKey} runResult={null} />
            </div>
          ) : (
            /* Regular lessons: Editor + Preview */
            <div className="flex-1 flex overflow-hidden">
              {/* Code Editor */}
              <div className="flex-1 flex flex-col overflow-hidden border-r" style={{ borderColor: 'var(--border)' }}>
                <CodeEditor lesson={currentLesson} onReset={handleReset} onRunResult={handleRunResult} />
              </div>

              {/* Live Preview */}
              <div className="w-72 flex flex-col overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-secondary)' }}>
                <div className="px-3 py-1.5 border-b text-xs font-medium flex items-center justify-between" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <span>Preview</span>
                  {runResult?.success && runResult.store && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-3">
                  <LivePreview lessonId={currentLesson.id} resetKey={resetKey} runResult={runResult} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function getInstructions(lessonId: number): string[] {
  const instructions: Record<number, string[]> = {
    1: ['Complete the create() function', 'Add count state (initial: 0)', 'Add increment action', 'Click Run to test'],
    2: ['Define the store interface', 'Add bears state', 'Add increase/decrease actions'],
    3: ['Create a selector for count', 'Use shallow for objects', 'Check render optimization'],
    4: ['Implement addTodo', 'Implement toggleTodo', 'Implement removeTodo'],
    5: ['Create async fetchUsers', 'Handle loading state', 'Handle error state'],
    6: ['Wrap with devtools()', 'Add action names', 'Open DevTools'],
    7: ['Add persist()', 'Set storage name', 'Use partialize'],
    8: ['Add immer()', 'Mutate state directly', 'Simplify nested updates'],
    9: ['Create slice interfaces', 'Build slice creators', 'Combine with spread'],
    10: ['Type StateCreator', 'Type middleware', 'Create generic selectors'],
    11: ['Identify Context issues', 'Migrate to Zustand', 'Use selectors'],
    12: ['Use subscribe()', 'Add listener callback', 'Clean up subscription'],
    13: ['Create store factory', 'Generate unique instances', 'Track in Map'],
    14: ['Scope stores per MFE', 'Avoid global pollution', 'Use Context injection'],
    15: ['Configure exposes', 'Set singleton: true', 'Import remote stores'],
    16: ['Build event bus', 'Implement pub/sub', 'Handle cleanup'],
    17: ['Define init order', 'Handle async state', 'Add guards'],
    18: ['Reset before tests', 'Test actions', 'Mock dependencies'],
    19: ['Review checklist', 'Avoid anti-patterns', 'Optimize'],
  };
  return instructions[lessonId] || ['Complete the exercise'];
}

function getExpectedInterface(lessonId: number): string {
  const interfaces: Record<number, string> = {
    1: `interface CounterStore {
  count: number;
  increment: () => void;
}`,
    2: `interface BearStore {
  bears: number;
  increase: () => void;
  decrease: () => void;
}`,
    3: `interface Store {
  count: number;
  name: string;
  theme: string;
  increment: () => void;
}
// Selector: (s) => s.count`,
    4: `interface Todo {
  id: number;
  text: string;
  completed: boolean;
}
interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
}`,
    5: `interface UserStore {
  users: string[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}`,
    6: `// Wrap store with devtools
const useStore = create(
  devtools((set) => ({
    // state
  }), { name: 'MyStore' })
);`,
    7: `// Using persist middleware
const useStore = create(
  persist(
    (set) => ({
      // state & actions
    }),
    { 
      name: 'storage-key',
      storage: createJSONStorage(
        () => localStorage
      )
    }
  )
);`,
    8: `// Wrap with immer for mutable syntax
const useStore = create(
  immer((set) => ({
    nested: { deep: { value: 0 } },
    update: () => set((state) => {
      state.nested.deep.value++;
    }),
  }))
);`,
    9: `// Slice pattern
interface UserSlice {
  user: string | null;
  setUser: (u: string) => void;
}
interface CartSlice {
  items: string[];
  addItem: (i: string) => void;
}
// Combine: { ...userSlice, ...cartSlice }`,
    10: `// Advanced typing
type Store = UserSlice & CartSlice;

const createUserSlice: StateCreator<
  Store, [], [], UserSlice
> = (set) => ({ ... });`,
    11: `// Before: React Context
const ThemeContext = createContext();

// After: Zustand Store
const useThemeStore = create((set) => ({
  theme: 'dark',
  toggle: () => set(s => ({
    theme: s.theme === 'dark' ? 'light' : 'dark'
  })),
}));`,
    12: `// External subscription
const unsubscribe = useStore.subscribe(
  (state, prevState) => {
    console.log('Changed:', state);
  }
);
// Clean up: unsubscribe();`,
    13: `// Store factory for dynamic stores
function createFormStore(id: string) {
  return create((set) => ({
    values: {},
    setField: (k, v) => set(s => ({
      values: { ...s.values, [k]: v }
    })),
  }));
}`,
    14: `// MFE: Isolated stores
// Each MFE gets its own store instance
const useLocalStore = create((set) => ({
  // Only accessible within this MFE
}));`,
    15: `// Module Federation shared store
// vite.config.js:
exposes: {
  './store': './src/stores/shared'
}
shared: {
  zustand: { singleton: true }
}`,
    16: `// Event bus for MFE communication
interface EventBus {
  events: Map<string, any>;
  emit: (event: string, data: any) => void;
  on: (event: string, cb: Function) => void;
}`,
    17: `// Initialization strategy
interface AppStore {
  initialized: boolean;
  mfeStates: Record<string, 'pending' | 'ready'>;
  setMfeReady: (mfe: string) => void;
  isAllReady: () => boolean;
}`,
    18: `// Testing stores
beforeEach(() => {
  useStore.setState(initialState);
});

test('increment', () => {
  useStore.getState().increment();
  expect(useStore.getState().count).toBe(1);
});`,
    19: `// Best Practices Checklist
✓ Use TypeScript interfaces
✓ Use selectors for subscriptions
✓ Keep stores focused & small
✓ Use devtools in development
✓ Test actions with getState()
✗ Avoid huge monolithic stores
✗ Don't mutate state directly`,
  };
  return interfaces[lessonId] || '// Complete the exercise';
}

function getPurpose(lessonId: number): string {
  const purposes: Record<number, string> = {
    1: "The foundation of Zustand. Create a store to share state across components without prop drilling.",
    2: "Type safety catches bugs at compile time. Essential for production apps and team collaboration.",
    3: "Selectors prevent unnecessary re-renders. Only subscribe to the state slices you need.",
    4: "Actions encapsulate state changes. Keep your components clean by moving logic to the store.",
    5: "Handle API calls directly in your store. Centralize loading states and error handling.",
    6: "Debug state changes with time-travel. Essential for development and tracking down bugs.",
    7: "Automatically save state to localStorage. Perfect for user preferences and form drafts.",
    8: "Write mutable-style updates that are actually immutable. Great for deeply nested state.",
    9: "Split large stores into logical slices. Improves maintainability and code organization.",
    10: "Full type safety for middleware and slices. Required for complex enterprise applications.",
    11: "Zustand eliminates Context boilerplate and re-render issues. Simpler code, better performance.",
    12: "React to state changes outside React. Useful for analytics, logging, and side effects.",
    13: "Create stores on-demand for dynamic UIs. Each form/instance gets its own isolated state.",
    14: "Each MFE gets its own store instance. Prevents naming conflicts and state leakage.",
    15: "Share authentication or global config across MFEs. One source of truth for all apps.",
    16: "Decouple MFE communication. Publish events without knowing who's listening.",
    17: "Ensure all MFEs are ready before rendering. Coordinate async initialization across apps.",
    18: "Test stores independently of React. Use getState() and setState() for predictable tests.",
    19: "Follow these patterns to build scalable, maintainable Zustand applications.",
  };
  return purposes[lessonId] || "Complete this exercise to learn this pattern.";
}

export default App;
