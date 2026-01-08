import { CodeBlock, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { Award, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

export function Lesson19() {
  const lesson = lessons.find((l) => l.id === 'lesson-19')!;

  const storeDesignCode = `// Store Design Best Practices

// 1. Keep stores focused on a single domain
// ❌ Bad: One giant store
const useBadStore = create((set) => ({
  user: null,
  products: [],
  cart: [],
  notifications: [],
  theme: 'dark',
  // 50 more properties...
}));

// ✅ Good: Domain-focused stores
const useUserStore = create((set) => ({ /* user state */ }));
const useCatalogStore = create((set) => ({ /* product state */ }));
const useCartStore = create((set) => ({ /* cart state */ }));

// 2. Colocate state with actions
// ✅ Good: Actions next to the state they modify
const useCartStore = create((set, get) => ({
  items: [],
  
  // Actions that modify this state
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
  })),
  
  // Computed values using get()
  getTotal: () => {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },
}));`;

  const selectorBestPracticesCode = `// Selector Best Practices

// 1. Always use selectors
// ❌ Bad: Select entire store
const store = useStore();  // Re-renders on ANY change

// ✅ Good: Select specific values
const count = useStore((s) => s.count);

// 2. Use useShallow for objects/arrays
import { useShallow } from 'zustand/react/shallow';

// ❌ Bad: Creates new object reference each render
const { name, email } = useStore((s) => ({
  name: s.user.name,
  email: s.user.email,
}));  // Always re-renders!

// ✅ Good: Shallow comparison prevents re-renders
const { name, email } = useStore(
  useShallow((s) => ({
    name: s.user.name,
    email: s.user.email,
  }))
);

// 3. Create reusable selector hooks
// hooks/useCartSelectors.ts
export const useCartItems = () => useCartStore((s) => s.items);
export const useCartTotal = () => useCartStore((s) => s.getTotal());
export const useCartItemCount = () => useCartStore(
  (s) => s.items.reduce((sum, i) => sum + i.quantity, 0)
);`;

  const middlewarePatternCode = `// Middleware Best Practices

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Recommended middleware order (innermost to outermost):
// 1. immer - transforms how you write state updates
// 2. persist - saves/restores state  
// 3. devtools - logs to Redux DevTools

const useStore = create(
  devtools(
    persist(
      immer((set) => ({
        // State and actions
      })),
      {
        name: 'my-store',
        partialize: (state) => ({
          // Only persist necessary data
          user: state.user,
          preferences: state.preferences,
          // Don't persist: loading, errors, temp data
        }),
      }
    ),
    {
      name: 'MyStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Name your actions for DevTools
const useStore = create(
  devtools((set) => ({
    increment: () => set(
      (state) => ({ count: state.count + 1 }),
      undefined,
      'counter/increment'  // Action name
    ),
  }))
);`;

  const mfePatternCode = `// MFE Best Practices Summary

// 1. Isolation by default
// Each MFE has its own stores with unique names
const useCatalogStore = create(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'catalog-mfe:store' }  // Prefix with MFE name
  )
);

// 2. Share only what's necessary
// Use Module Federation for truly shared state
// - User authentication
// - App-wide preferences
// - Feature flags

// 3. Event-based communication
// Don't import stores across MFE boundaries
window.dispatchEvent(
  new CustomEvent('catalog:product-selected', {
    detail: { productId: '123' },
  })
);

// 4. Lazy store initialization
let store: ReturnType<typeof createStore> | null = null;

export function getStore() {
  if (!store) {
    store = createStore();
  }
  return store;
}

// 5. Bootstrap pattern for configuration
export async function bootstrap(config: MFEConfig) {
  const store = getStore();
  store.getState().setConfig(config);
  await store.getState().initialize();
}`;

  const typescriptPatternCode = `// TypeScript Best Practices

import { create, StateCreator } from 'zustand';

// 1. Always type your stores explicitly
interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
}

const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// 2. Use StateCreator for slices
type AppStore = UserSlice & CartSlice;

const createUserSlice: StateCreator<
  AppStore,  // Full store type
  [],
  [],
  UserSlice  // This slice's type
> = (set, get) => ({
  // Can access full store via get()
});

// 3. Extract selector types
type UserSelector<T> = (state: UserStore) => T;

const selectUser: UserSelector<User | null> = (s) => s.user;
const selectIsLoggedIn: UserSelector<boolean> = (s) => s.user !== null;

// 4. Generic store factories
function createEntityStore<T extends { id: string }>() {
  return create<EntityStore<T>>((set) => ({
    entities: {} as Record<string, T>,
    add: (entity) => set((s) => ({
      entities: { ...s.entities, [entity.id]: entity },
    })),
  }));
}`;

  const antiPatternsCode = `// Anti-Patterns to Avoid

// ❌ 1. Mutating state directly
const useBadStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => {
    state.items.push(item);  // WRONG: mutation!
    return state;
  }),
}));

// ✅ Fix: Return new array
addItem: (item) => set((state) => ({
  items: [...state.items, item],
}));

// ❌ 2. Storing derived data
const useBadStore = create((set) => ({
  items: [],
  totalPrice: 0,  // WRONG: derived from items
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    totalPrice: /* recalculate */,  // Must keep in sync
  })),
}));

// ✅ Fix: Compute in selector or action
getTotal: () => get().items.reduce((sum, i) => sum + i.price, 0);

// ❌ 3. Subscribing to entire store in components
const Component = () => {
  const store = useStore();  // Re-renders on ANY change
};

// ✅ Fix: Use selectors
const Component = () => {
  const count = useStore((s) => s.count);
};

// ❌ 4. Async logic that doesn't handle errors
fetchData: async () => {
  const data = await api.getData();  // What if it fails?
  set({ data });
};

// ✅ Fix: Handle loading and errors
fetchData: async () => {
  set({ loading: true, error: null });
  try {
    const data = await api.getData();
    set({ data, loading: false });
  } catch (error) {
    set({ error: error.message, loading: false });
  }
};`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Best Practices Summary
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          Congratulations on completing the Zustand Playground! This final lesson summarizes 
          the key patterns and best practices for enterprise applications.
        </p>
        
        <div className="p-6 rounded-lg bg-gradient-to-r from-cyber-green/20 to-cyber-blue/20 border border-cyber-green/30">
          <div className="flex items-center gap-3 mb-4">
            <Award size={24} className="text-cyber-yellow" />
            <h3 className="font-display text-lg font-semibold text-obsidian-100">
              You've learned:
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-cyber-green font-medium mb-2">Fundamentals</p>
              <ul className="space-y-1 text-obsidian-300">
                <li>• Store creation</li>
                <li>• Selectors</li>
                <li>• Actions</li>
                <li>• Async patterns</li>
              </ul>
            </div>
            <div>
              <p className="text-cyber-blue font-medium mb-2">Advanced</p>
              <ul className="space-y-1 text-obsidian-300">
                <li>• Middleware</li>
                <li>• Slices</li>
                <li>• TypeScript</li>
                <li>• Testing</li>
              </ul>
            </div>
            <div>
              <p className="text-cyber-yellow font-medium mb-2">MFE</p>
              <ul className="space-y-1 text-obsidian-300">
                <li>• Isolation</li>
                <li>• Sharing</li>
                <li>• Communication</li>
                <li>• Initialization</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Store Design */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-cyber-green" />
          Store Design
        </h2>
        <CodeBlock code={storeDesignCode} filename="storeDesign.ts" highlightLines={[14, 15, 16, 20, 21, 22, 23, 24]} />
      </section>

      {/* Selectors */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-cyber-green" />
          Selector Patterns
        </h2>
        <CodeBlock code={selectorBestPracticesCode} filename="selectors.ts" highlightLines={[8, 18, 19, 20, 21, 22, 28, 29, 30]} />
      </section>

      {/* Middleware */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-cyber-green" />
          Middleware Configuration
        </h2>
        <CodeBlock code={middlewarePatternCode} filename="middleware.ts" highlightLines={[11, 12, 13, 19, 20, 21, 22, 23, 26, 27]} />
      </section>

      {/* MFE Patterns */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-cyber-green" />
          MFE Patterns
        </h2>
        <CodeBlock code={mfePatternCode} filename="mfe.ts" />
      </section>

      {/* TypeScript */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-cyber-green" />
          TypeScript Patterns
        </h2>
        <CodeBlock code={typescriptPatternCode} filename="typescript.ts" highlightLines={[6, 7, 8, 9, 17, 18, 19, 20, 21, 22]} />
      </section>

      {/* Anti-Patterns */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-cyber-red" />
          Anti-Patterns to Avoid
        </h2>
        <CodeBlock code={antiPatternsCode} filename="antiPatterns.ts" />
      </section>

      {/* Quick Reference */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4 flex items-center gap-2">
          <Lightbulb size={20} className="text-cyber-yellow" />
          Quick Reference
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-obsidian-800 border border-obsidian-600">
            <h3 className="text-sm font-medium text-cyber-green mb-3">DO</h3>
            <ul className="space-y-2 text-sm text-obsidian-300">
              <li className="flex items-start gap-2">
                <span className="text-cyber-green">✓</span>
                Use selectors for all state access
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-green">✓</span>
                Use useShallow for object selectors
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-green">✓</span>
                Name actions for DevTools
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-green">✓</span>
                Handle async errors
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-green">✓</span>
                Use persist partialize
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-green">✓</span>
                Compute derived values in selectors
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-obsidian-800 border border-obsidian-600">
            <h3 className="text-sm font-medium text-cyber-red mb-3">DON'T</h3>
            <ul className="space-y-2 text-sm text-obsidian-300">
              <li className="flex items-start gap-2">
                <span className="text-cyber-red">✗</span>
                Subscribe to entire store
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-red">✗</span>
                Mutate state directly
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-red">✗</span>
                Store derived data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-red">✗</span>
                Persist sensitive data
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-red">✗</span>
                Import stores across MFE boundaries
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-red">✗</span>
                Create one giant store
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final Message */}
      <section className="mb-10 p-8 rounded-xl bg-gradient-to-r from-cyber-yellow/20 via-cyber-green/20 to-cyber-blue/20 border border-cyber-yellow/30 text-center">
        <Award size={48} className="text-cyber-yellow mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-obsidian-100 mb-4">
          Congratulations! 🎉
        </h2>
        <p className="text-obsidian-200 max-w-xl mx-auto">
          You've completed the Zustand Enterprise MFE Tutorial. You now have the knowledge 
          to build scalable, maintainable state management in micro frontend architectures.
        </p>
      </section>

      <NavigationButtons />
    </div>
  );
}

