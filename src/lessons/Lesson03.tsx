import { useState, useRef, useEffect, useCallback } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';

// Demo store for re-render demonstration
interface UserStore {
  user: { name: string; email: string };
  preferences: { theme: 'light' | 'dark'; notifications: boolean };
  stats: { visits: number; lastVisit: number };
  updateName: (name: string) => void;
  updateEmail: (email: string) => void;
  toggleTheme: () => void;
  toggleNotifications: () => void;
  incrementVisits: () => void;
}

const useUserStore = create<UserStore>((set) => ({
  user: { name: 'John Doe', email: 'john@example.com' },
  preferences: { theme: 'dark', notifications: true },
  stats: { visits: 42, lastVisit: Date.now() },
  updateName: (name) => set((state) => ({ user: { ...state.user, name } })),
  updateEmail: (email) => set((state) => ({ user: { ...state.user, email } })),
  toggleTheme: () =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        theme: state.preferences.theme === 'dark' ? 'light' : 'dark',
      },
    })),
  toggleNotifications: () =>
    set((state) => ({
      preferences: { ...state.preferences, notifications: !state.preferences.notifications },
    })),
  incrementVisits: () =>
    set((state) => ({
      stats: { ...state.stats, visits: state.stats.visits + 1, lastVisit: Date.now() },
    })),
}));

// Components that track renders
function UserNameDisplay({ onRender }: { onRender: () => void }) {
  const name = useUserStore((state) => state.user.name);
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    onRender();
  });

  return (
    <div className="p-3 rounded-lg bg-obsidian-900 border border-obsidian-600">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-obsidian-400">UserName Component</span>
        <span className="text-xs font-mono text-cyber-green">Renders: {renderCount.current}</span>
      </div>
      <p className="text-obsidian-100 font-medium">{name}</p>
    </div>
  );
}

function ThemeDisplay({ onRender }: { onRender: () => void }) {
  const theme = useUserStore((state) => state.preferences.theme);
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    onRender();
  });

  return (
    <div className="p-3 rounded-lg bg-obsidian-900 border border-obsidian-600">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-obsidian-400">Theme Component</span>
        <span className="text-xs font-mono text-cyber-blue">Renders: {renderCount.current}</span>
      </div>
      <p className="text-obsidian-100 font-medium capitalize">{theme} Mode</p>
    </div>
  );
}

function StatsDisplay({ onRender }: { onRender: () => void }) {
  const visits = useUserStore((state) => state.stats.visits);
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    onRender();
  });

  return (
    <div className="p-3 rounded-lg bg-obsidian-900 border border-obsidian-600">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-obsidian-400">Stats Component</span>
        <span className="text-xs font-mono text-cyber-orange">Renders: {renderCount.current}</span>
      </div>
      <p className="text-obsidian-100 font-medium">{visits} visits</p>
    </div>
  );
}

function BadComponent({ onRender }: { onRender: () => void }) {
  // BAD: No selector - subscribes to entire store
  const store = useUserStore();
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    onRender();
  });

  return (
    <div className="p-3 rounded-lg bg-obsidian-900 border border-cyber-red/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-cyber-red">⚠️ Bad: No Selector</span>
        <span className="text-xs font-mono text-cyber-red">Renders: {renderCount.current}</span>
      </div>
      <p className="text-obsidian-100 font-medium">{store.user.name}</p>
    </div>
  );
}

export function Lesson03() {
  const lesson = lessons.find((l) => l.id === 'lesson-3')!;
  const [showHint, setShowHint] = useState(false);
  const [renderLog, setRenderLog] = useState<string[]>([]);
  
  const { updateName, toggleTheme, incrementVisits } = useUserStore();

  const logRender = useCallback((component: string) => {
    setRenderLog((prev) => [...prev.slice(-9), `${component} rendered`]);
  }, []);

  const badSelectorCode = `// ❌ BAD: Subscribes to entire store
function UserProfile() {
  // This component re-renders on ANY state change
  const store = useUserStore();
  return <div>{store.user.name}</div>;
}

// This also re-renders on any change!
function AnotherBad() {
  const { user } = useUserStore();
  return <div>{user.name}</div>;
}`;

  const goodSelectorCode = `// ✅ GOOD: Subscribes only to user.name
function UserProfile() {
  // Only re-renders when user.name changes
  const name = useUserStore((state) => state.user.name);
  return <div>{name}</div>;
}

// ✅ GOOD: Subscribes to nested property
function ThemeToggle() {
  const theme = useUserStore((state) => state.preferences.theme);
  const toggleTheme = useUserStore((state) => state.toggleTheme);
  return <button onClick={toggleTheme}>{theme}</button>;
}`;

  const multipleSelectorsCode = `// ✅ Selecting multiple values with one selector
function UserCard() {
  const { name, email } = useUserStore((state) => ({
    name: state.user.name,
    email: state.user.email,
  }));
  
  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}

// ⚠️ GOTCHA: Object selectors create new references!
// The above will re-render on any state change because
// { name, email } creates a new object every time.

// ✅ FIX: Use shallow equality check
import { useShallow } from 'zustand/react/shallow';

function UserCardFixed() {
  const { name, email } = useUserStore(
    useShallow((state) => ({
      name: state.user.name,
      email: state.user.email,
    }))
  );
  
  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}`;

  const derivedStateCode = `// ✅ Computed/derived values in selectors
function TodoSummary() {
  const activeCount = useTodoStore(
    (state) => state.todos.filter(t => !t.completed).length
  );
  
  return <span>{activeCount} items left</span>;
}

// ✅ Complex derived state
function ExpensiveCalculation() {
  const total = useCartStore((state) => 
    state.items.reduce((sum, item) => 
      sum + item.price * item.quantity, 0
    )
  );
  
  return <span>Total: ${total}</span>;
}`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Why Selectors Matter */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Why Selectors Matter
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          In enterprise applications with complex state, unnecessary re-renders can kill performance. 
          Selectors let you subscribe to specific slices of state, ensuring components only 
          re-render when the data they care about actually changes.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-cyber-red/10 border border-cyber-red/30">
            <h3 className="font-medium text-cyber-red mb-2">Without Selectors</h3>
            <p className="text-sm text-obsidian-300">
              Component re-renders on every store update, even if it doesn't use the changed data
            </p>
          </div>
          <div className="p-4 rounded-lg bg-cyber-green/10 border border-cyber-green/30">
            <h3 className="font-medium text-cyber-green mb-2">With Selectors</h3>
            <p className="text-sm text-obsidian-300">
              Component only re-renders when its specific subscribed state changes
            </p>
          </div>
        </div>
      </section>

      {/* Bad vs Good */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Bad vs Good Selector Patterns
        </h2>
        <div className="space-y-4">
          <CodeBlock code={badSelectorCode} filename="bad-selectors.tsx" highlightLines={[3, 4, 10]} />
          <CodeBlock code={goodSelectorCode} filename="good-selectors.tsx" highlightLines={[4, 11, 12]} />
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="mb-10">
        <InteractivePanel
          title="See Selectors in Action"
          description="Click buttons and watch which components re-render"
          onReset={() => {
            setRenderLog([]);
            useUserStore.setState({
              user: { name: 'John Doe', email: 'john@example.com' },
              preferences: { theme: 'dark', notifications: true },
              stats: { visits: 42, lastVisit: Date.now() },
            });
          }}
          hint="Notice how components with proper selectors only re-render when their specific data changes, while the 'Bad' component re-renders on every change."
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateName('Jane ' + Math.random().toString(36).slice(2, 5))}
                  className="px-3 py-2 bg-cyber-green/20 text-cyber-green text-sm rounded-lg hover:bg-cyber-green/30 transition-colors"
                >
                  Update Name
                </button>
                <button
                  onClick={toggleTheme}
                  className="px-3 py-2 bg-cyber-blue/20 text-cyber-blue text-sm rounded-lg hover:bg-cyber-blue/30 transition-colors"
                >
                  Toggle Theme
                </button>
                <button
                  onClick={incrementVisits}
                  className="px-3 py-2 bg-cyber-orange/20 text-cyber-orange text-sm rounded-lg hover:bg-cyber-orange/30 transition-colors"
                >
                  Increment Visits
                </button>
              </div>

              {/* Components with selectors */}
              <div className="space-y-3">
                <p className="text-xs text-obsidian-400 uppercase tracking-wider">
                  Components with Selectors
                </p>
                <UserNameDisplay onRender={() => logRender('UserName')} />
                <ThemeDisplay onRender={() => logRender('Theme')} />
                <StatsDisplay onRender={() => logRender('Stats')} />
              </div>

              {/* Bad component */}
              <div className="space-y-3">
                <p className="text-xs text-obsidian-400 uppercase tracking-wider">
                  Component without Selector
                </p>
                <BadComponent onRender={() => logRender('BadComponent')} />
              </div>
            </div>

            <div className="space-y-4">
              <StateInspector
                state={useUserStore.getState()}
                title="Full Store State"
              />
              
              {/* Render Log */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                <p className="text-xs text-obsidian-400 mb-2">Render Log (last 10)</p>
                <div className="space-y-1 font-mono text-xs max-h-32 overflow-y-auto">
                  {renderLog.length === 0 ? (
                    <p className="text-obsidian-500 italic">Click buttons to see renders...</p>
                  ) : (
                    renderLog.map((log, i) => (
                      <p key={i} className="text-obsidian-300">{log}</p>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </InteractivePanel>
      </section>

      {/* Multiple Values */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Selecting Multiple Values
        </h2>
        <p className="text-obsidian-300 mb-4">
          When you need multiple values, beware of object reference gotchas. Use 
          <code className="text-cyber-yellow"> useShallow</code> for object selectors.
        </p>
        <CodeBlock code={multipleSelectorsCode} filename="multiple-selectors.tsx" highlightLines={[17, 19, 20, 21, 22, 23]} />
      </section>

      {/* Derived State */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Derived State in Selectors
        </h2>
        <p className="text-obsidian-300 mb-4">
          Selectors can compute derived values. This is efficient because the computation 
          only runs when the subscribed state changes.
        </p>
        <CodeBlock code={derivedStateCode} filename="derived-selectors.tsx" />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Always use selector functions: useStore(state => state.value)',
            'Components only re-render when their selected state changes',
            'Use useShallow() when selecting objects or arrays',
            'Selectors can compute derived values efficiently',
            'In MFE apps, proper selectors are critical for performance',
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

