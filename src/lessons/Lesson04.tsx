import { useState } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';

// Demo store for actions
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [
    { id: '1', name: 'TypeScript Handbook', price: 49.99, quantity: 1 },
    { id: '2', name: 'React Patterns', price: 39.99, quantity: 2 },
  ],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: quantity <= 0
        ? state.items.filter((item) => item.id !== id)
        : state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
    })),

  incrementQuantity: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      ),
    })),

  decrementQuantity: (id) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0),
    })),

  clearCart: () => set({ items: [] }),

  // Using get() for computed values
  getTotal: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((count, item) => count + item.quantity, 0);
  },
}));

const products = [
  { id: '3', name: 'Zustand Mastery', price: 29.99 },
  { id: '4', name: 'MFE Architecture', price: 59.99 },
  { id: '5', name: 'State Management', price: 34.99 },
];

export function Lesson04() {
  const lesson = lessons.find((l) => l.id === 'lesson-4')!;
  const [showHint, setShowHint] = useState(false);
  
  const store = useCartStore();

  const setFunctionCode = `// set() with function form - access current state
const useStore = create((set) => ({
  count: 0,
  // ✅ Use function form when you need current state
  increment: () => set((state) => ({ 
    count: state.count + 1 
  })),
  
  // ✅ Partial updates - only update what changes
  updateName: (name) => set({ name }),
  
  // ❌ DON'T mutate state directly!
  badIncrement: () => set((state) => {
    state.count += 1; // WRONG - mutation
    return state;
  }),
}));`;

  const setObjectCode = `// set() with object form - replace partial state
const useStore = create((set) => ({
  user: null,
  theme: 'dark',
  
  // Object form - merges with existing state
  setUser: (user) => set({ user }),
  
  // Resets specific properties
  reset: () => set({ user: null, theme: 'dark' }),
  
  // Replace entire state (second param = true)
  replaceState: (newState) => set(newState, true),
}));`;

  const getFunctionCode = `// get() - access current state outside of set()
const useStore = create((set, get) => ({
  items: [],
  
  // Using get() for computed values
  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.price, 0);
  },
  
  // Using get() in async actions
  fetchMore: async () => {
    const { items } = get();
    const lastId = items[items.length - 1]?.id;
    const newItems = await fetchItemsAfter(lastId);
    set({ items: [...items, ...newItems] });
  },
  
  // Using get() for conditional logic
  addItemIfNotExists: (item) => {
    const { items } = get();
    if (!items.find(i => i.id === item.id)) {
      set({ items: [...items, item] });
    }
  },
}));`;

  const complexUpdatesCode = `// Complex state updates with nested objects
const useStore = create((set) => ({
  user: {
    profile: { name: '', email: '' },
    settings: { theme: 'dark', notifications: true },
  },
  
  // Updating nested state (spread operators)
  updateProfile: (updates) => set((state) => ({
    user: {
      ...state.user,
      profile: { ...state.user.profile, ...updates },
    },
  })),
  
  // Updating arrays
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
  })),
  
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),
}));`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* set() Function */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Understanding set()
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          The <code className="text-cyber-yellow">set()</code> function is how you update state in Zustand. 
          It can take either a partial state object or a function that receives the current state and 
          returns partial updates.
        </p>
        <CodeBlock code={setFunctionCode} filename="set-function.ts" highlightLines={[5, 6, 7, 10]} />
      </section>

      {/* Object Form */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Object Form vs Function Form
        </h2>
        <p className="text-obsidian-300 mb-4">
          Use the object form when you don't need current state. Use the function form when you need 
          to compute the next state based on the current state.
        </p>
        <CodeBlock code={setObjectCode} filename="set-object.ts" highlightLines={[8, 11, 14]} />
        
        <div className="mt-4 p-4 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30">
          <p className="text-sm text-obsidian-200">
            <strong className="text-cyber-blue">Note:</strong> By default, <code className="text-cyber-yellow">set()</code> 
            shallow merges state. Pass <code className="text-cyber-yellow">true</code> as the second argument to replace 
            the entire state instead of merging.
          </p>
        </div>
      </section>

      {/* get() Function */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Understanding get()
        </h2>
        <p className="text-obsidian-300 mb-4">
          The <code className="text-cyber-yellow">get()</code> function lets you access current state outside 
          of <code className="text-cyber-yellow">set()</code>. Useful for computed values, async operations, 
          and conditional logic.
        </p>
        <CodeBlock code={getFunctionCode} filename="get-function.ts" highlightLines={[6, 7, 8, 13, 14, 15, 16, 21, 22, 23, 24]} />
      </section>

      {/* Complex Updates */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Complex State Updates
        </h2>
        <p className="text-obsidian-300 mb-4">
          For nested objects and arrays, use spread operators to maintain immutability. 
          (We'll cover Immer middleware later for cleaner syntax.)
        </p>
        <CodeBlock code={complexUpdatesCode} filename="complex-updates.ts" />
      </section>

      {/* Interactive Example */}
      <section className="mb-10">
        <InteractivePanel
          title="Shopping Cart Actions"
          description="Try various state update patterns"
          onReset={() => {
            useCartStore.setState({
              items: [
                { id: '1', name: 'TypeScript Handbook', price: 49.99, quantity: 1 },
                { id: '2', name: 'React Patterns', price: 39.99, quantity: 2 },
              ],
            });
          }}
          hint="Notice how each action uses either set() with a function to access current state, or get() for computed values."
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Add Products */}
              <div>
                <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-2">
                  Add Products
                </p>
                <div className="flex flex-wrap gap-2">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => store.addItem(product)}
                      className="px-3 py-1.5 bg-obsidian-700 text-obsidian-200 text-sm rounded-lg hover:bg-obsidian-600 transition-colors"
                    >
                      + {product.name} (${product.price})
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Items */}
              <div>
                <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-2">
                  Cart Items
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {store.items.length === 0 ? (
                    <p className="text-obsidian-500 italic text-sm">Cart is empty</p>
                  ) : (
                    store.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-obsidian-900 rounded-lg border border-obsidian-600"
                      >
                        <div>
                          <p className="text-obsidian-100 text-sm">{item.name}</p>
                          <p className="text-obsidian-400 text-xs">
                            ${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => store.decrementQuantity(item.id)}
                            className="w-7 h-7 flex items-center justify-center bg-obsidian-700 text-obsidian-300 rounded hover:bg-obsidian-600 transition-colors"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-mono text-obsidian-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => store.incrementQuantity(item.id)}
                            className="w-7 h-7 flex items-center justify-center bg-obsidian-700 text-obsidian-300 rounded hover:bg-obsidian-600 transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => store.removeItem(item.id)}
                            className="w-7 h-7 flex items-center justify-center text-obsidian-500 hover:text-cyber-red transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-obsidian-900 rounded-lg border border-cyber-yellow/30">
                <div>
                  <p className="text-obsidian-400 text-sm">
                    {store.getItemCount()} items
                  </p>
                  <p className="text-xl font-bold text-cyber-yellow">
                    ${store.getTotal().toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={store.clearCart}
                  disabled={store.items.length === 0}
                  className="px-4 py-2 bg-cyber-red/20 text-cyber-red text-sm rounded-lg hover:bg-cyber-red/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            <StateInspector
              state={{
                items: store.items,
                itemCount: store.getItemCount(),
                total: store.getTotal().toFixed(2),
              }}
              title="Cart Store State"
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
            'Use set(fn) when you need current state, set(obj) when you don\'t',
            'set() shallow merges by default; use set(state, true) to replace',
            'Use get() for computed values and async operations',
            'Never mutate state directly - always return new objects',
            'Complex nested updates require spread operators (or use Immer)',
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

