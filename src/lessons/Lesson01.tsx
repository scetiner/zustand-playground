import { useState } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';
import { Zap, Package, Gauge, Puzzle } from 'lucide-react';

// Demo store
const useCounterStore = create<{
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

export function Lesson01() {
  const lesson = lessons.find((l) => l.id === 'lesson-1')!;
  const { count, increment, decrement, reset } = useCounterStore();
  const [showHint, setShowHint] = useState(false);

  const introCode = `import { create } from 'zustand';

// That's it! A complete store in 5 lines
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Use it anywhere
function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>{count}</button>;
}`;

  const comparisonCode = `// Redux: Multiple files, actions, reducers, middleware...
// store.ts, actions.ts, reducers.ts, types.ts...

// Context: Provider wrapping, re-render issues, boilerplate...
const MyContext = createContext();
function MyProvider({ children }) {
  const [state, setState] = useState(initialState);
  // ... lots of setup
}

// Zustand: One file, one hook, done.
const useStore = create((set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
}));`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Why Zustand Section */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Why Enterprise Teams Choose Zustand
        </h2>
        <p className="text-obsidian-300 mb-6 leading-relaxed">
          In micro frontend architectures, state management can become a nightmare. 
          You need something that's <strong className="text-obsidian-100">lightweight</strong>, 
          <strong className="text-obsidian-100"> bundle-friendly</strong>, and 
          <strong className="text-obsidian-100"> works seamlessly across isolated applications</strong>. 
          Zustand delivers on all fronts.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            {
              icon: <Package size={20} />,
              title: '~1KB Bundle',
              description: 'Minimal footprint for each micro frontend',
              color: 'cyber-green',
            },
            {
              icon: <Zap size={20} />,
              title: 'Zero Config',
              description: 'No providers, no boilerplate, just works',
              color: 'cyber-yellow',
            },
            {
              icon: <Gauge size={20} />,
              title: 'Surgical Re-renders',
              description: 'Components only update when their slice changes',
              color: 'cyber-blue',
            },
            {
              icon: <Puzzle size={20} />,
              title: 'MFE Ready',
              description: 'Share or isolate state across micro frontends',
              color: 'cyber-purple',
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`p-4 rounded-lg border border-${item.color}/30 bg-${item.color}/5`}
            >
              <div className={`w-10 h-10 rounded-lg bg-${item.color}/20 flex items-center justify-center mb-3 text-${item.color}`}>
                {item.icon}
              </div>
              <h3 className="font-medium text-obsidian-100 mb-1">{item.title}</h3>
              <p className="text-sm text-obsidian-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Your First Store */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Your First Zustand Store
        </h2>
        <p className="text-obsidian-300 mb-4">
          Here's the simplest possible Zustand store. Notice how there's no Provider, 
          no connect(), no mapStateToProps. Just a hook that you can use anywhere.
        </p>
        <CodeBlock code={introCode} filename="counterStore.ts" highlightLines={[3, 4, 5, 6]} />
      </section>

      {/* Comparison */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          The Simplicity Advantage
        </h2>
        <p className="text-obsidian-300 mb-4">
          Compare this to Redux or Context API setups. Zustand removes the ceremony 
          while keeping all the power you need for enterprise applications.
        </p>
        <CodeBlock code={comparisonCode} filename="comparison.ts" />
      </section>

      {/* Interactive Example */}
      <section className="mb-10">
        <InteractivePanel
          title="Try It: Your First Store"
          description="Click the buttons and watch the state update in real-time"
          onReset={reset}
          hint="Notice how the state inspector updates instantly. There's no dispatch(), no action types, just direct state updates."
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-6 rounded-lg bg-obsidian-900 border border-obsidian-600 text-center">
                <p className="text-sm text-obsidian-400 mb-2">Count</p>
                <p className="text-5xl font-mono font-bold text-cyber-yellow">{count}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={decrement}
                  className="flex-1 px-4 py-3 bg-obsidian-700 hover:bg-obsidian-600 text-obsidian-100 rounded-lg font-mono text-lg transition-colors"
                >
                  −
                </button>
                <button
                  onClick={increment}
                  className="flex-1 px-4 py-3 bg-cyber-yellow hover:bg-cyber-yellow-dim text-obsidian-900 rounded-lg font-mono text-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <StateInspector
              state={{ count }}
              title="Store State"
            />
          </div>
        </InteractivePanel>
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Zustand stores are just hooks — no Provider needed',
            'State and actions are defined together in one place',
            'The set() function handles immutable updates for you',
            "Components automatically re-render when their subscribed state changes",
            'Perfect for micro frontends due to its minimal size and isolation capabilities',
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

