import { useState } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';

// Demo store for this lesson
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoStore {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
  clearCompleted: () => void;
}

const useTodoStore = create<TodoStore>((set) => ({
  todos: [
    { id: '1', text: 'Learn Zustand basics', completed: true },
    { id: '2', text: 'Build a todo app', completed: false },
    { id: '3', text: 'Master advanced patterns', completed: false },
  ],
  filter: 'all',
  addTodo: (text) =>
    set((state) => ({
      todos: [...state.todos, { id: Date.now().toString(), text, completed: false }],
    })),
  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    })),
  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    })),
  setFilter: (filter) => set({ filter }),
  clearCompleted: () =>
    set((state) => ({
      todos: state.todos.filter((todo) => !todo.completed),
    })),
}));

export function Lesson02() {
  const lesson = lessons.find((l) => l.id === 'lesson-2')!;
  const store = useTodoStore();
  const [newTodo, setNewTodo] = useState('');
  const [showHint, setShowHint] = useState(false);

  const filteredTodos = store.todos.filter((todo) => {
    if (store.filter === 'active') return !todo.completed;
    if (store.filter === 'completed') return todo.completed;
    return true;
  });

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      store.addTodo(newTodo.trim());
      setNewTodo('');
    }
  };

  const basicStoreCode = `import { create } from 'zustand';

// Define your state shape with TypeScript
interface BearStore {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

// Create the store with typed state
const useBearStore = create<BearStore>((set) => ({
  // Initial state
  bears: 0,
  
  // Actions that modify state
  increasePopulation: () => set((state) => ({ 
    bears: state.bears + 1 
  })),
  
  removeAllBears: () => set({ bears: 0 }),
}));`;

  const usingStoreCode = `// In any component - no Provider needed!
function BearCounter() {
  // Subscribe to specific state
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} bears around here</h1>;
}

function Controls() {
  // Subscribe to actions only
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>Add bear</button>;
}`;

  const todoStoreCode = `interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoStore {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
}

const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  filter: 'all',
  
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { 
      id: Date.now().toString(), 
      text, 
      completed: false 
    }],
  })),
  
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((todo) =>
      todo.id === id 
        ? { ...todo, completed: !todo.completed } 
        : todo
    ),
  })),
  
  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter((todo) => todo.id !== id),
  })),
  
  setFilter: (filter) => set({ filter }),
}));`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Basic Store Creation */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          The Anatomy of a Zustand Store
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          A Zustand store is created with the <code className="text-cyber-yellow">create()</code> function. 
          It takes a callback that receives <code className="text-cyber-yellow">set</code> (and optionally 
          <code className="text-cyber-yellow"> get</code>) and returns your state object with actions.
        </p>
        <CodeBlock 
          code={basicStoreCode} 
          filename="bearStore.ts" 
          highlightLines={[4, 5, 6, 7, 11, 14, 15, 16, 18]} 
        />
      </section>

      {/* Using the Store */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Using Your Store in Components
        </h2>
        <p className="text-obsidian-300 mb-4">
          The store is just a hook! Call it in any component to subscribe to state. 
          Pass a selector function to subscribe to specific pieces of state.
        </p>
        <CodeBlock code={usingStoreCode} filename="Components.tsx" highlightLines={[4, 10]} />
        
        <div className="mt-4 p-4 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30">
          <p className="text-sm text-obsidian-200">
            <strong className="text-cyber-blue">Pro Tip:</strong> Always use selectors to pick specific 
            state. Using <code className="text-cyber-yellow">useStore()</code> without a selector will 
            cause re-renders on <em>any</em> state change.
          </p>
        </div>
      </section>

      {/* Real-World Example */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Real-World Example: Todo Store
        </h2>
        <p className="text-obsidian-300 mb-4">
          Let's look at a more realistic store with multiple state properties and actions. 
          This pattern scales well for enterprise applications.
        </p>
        <CodeBlock code={todoStoreCode} filename="todoStore.ts" />
      </section>

      {/* Interactive Example */}
      <section className="mb-10">
        <InteractivePanel
          title="Try It: Todo Application"
          description="Add, toggle, and remove todos. Watch the state inspector!"
          onReset={() => {
            useTodoStore.setState({
              todos: [
                { id: '1', text: 'Learn Zustand basics', completed: true },
                { id: '2', text: 'Build a todo app', completed: false },
                { id: '3', text: 'Master advanced patterns', completed: false },
              ],
              filter: 'all',
            });
          }}
          hint="Each action uses set() with a function that receives current state. This ensures immutable updates without mutation."
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Add Todo Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                  placeholder="What needs to be done?"
                  className="flex-1 px-4 py-2 bg-obsidian-900 border border-obsidian-600 rounded-lg text-obsidian-100 placeholder-obsidian-500 focus:outline-none focus:border-cyber-yellow"
                />
                <button
                  onClick={handleAddTodo}
                  className="px-4 py-2 bg-cyber-yellow hover:bg-cyber-yellow-dim text-obsidian-900 font-medium rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                {(['all', 'active', 'completed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => store.setFilter(f)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      store.filter === f
                        ? 'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30'
                        : 'bg-obsidian-700 text-obsidian-300 hover:text-obsidian-100'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Todo List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-3 bg-obsidian-900 rounded-lg border border-obsidian-600 group"
                  >
                    <button
                      onClick={() => store.toggleTodo(todo.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        todo.completed
                          ? 'bg-cyber-green border-cyber-green'
                          : 'border-obsidian-500 hover:border-cyber-yellow'
                      }`}
                    >
                      {todo.completed && (
                        <svg className="w-3 h-3 text-obsidian-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`flex-1 ${
                        todo.completed ? 'text-obsidian-500 line-through' : 'text-obsidian-100'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => store.removeTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 text-obsidian-500 hover:text-cyber-red transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Clear Completed */}
              {store.todos.some((t) => t.completed) && (
                <button
                  onClick={store.clearCompleted}
                  className="text-sm text-obsidian-400 hover:text-cyber-red transition-colors"
                >
                  Clear completed
                </button>
              )}
            </div>

            <StateInspector
              state={{ 
                todos: store.todos, 
                filter: store.filter,
                activeCount: store.todos.filter(t => !t.completed).length 
              }}
              title="Todo Store State"
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
            'Use create<YourType>() for full TypeScript support',
            'Define state and actions together in the store creator',
            'The set() function accepts an object or a function that returns partial state',
            'Always use the function form of set() when you need current state',
            'Stores can be used in any component without wrapping in providers',
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

