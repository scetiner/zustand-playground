import { useState } from 'react';
import { CodeBlock, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { FileCode2 } from 'lucide-react';

export function Lesson10() {
  const lesson = lessons.find((l) => l.id === 'lesson-10')!;
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'patterns'>('basic');

  const basicTypingCode = `import { create } from 'zustand';

// Define your state interface
interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  setCount: (value: number) => void;
}

// Pass the interface to create<T>()
const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  setCount: (value) => set({ count: value }),
}));

// Usage - fully typed!
const count = useCounterStore((state) => state.count);
const increment = useCounterStore((state) => state.increment);`;

  const inferredTypesCode = `// TypeScript can infer types, but explicit is better for complex stores
const useStore = create((set) => ({
  count: 0,  // inferred as number
  name: '',  // inferred as string
  items: [], // inferred as never[] - PROBLEM!
}));

// Always be explicit with arrays and complex types
interface Store {
  count: number;
  name: string;
  items: Item[];  // Explicit array type
}

const useStore = create<Store>((set) => ({
  count: 0,
  name: '',
  items: [],
}));`;

  const selectorTypingCode = `// Typed selectors
interface UserStore {
  user: { id: string; name: string; email: string } | null;
  preferences: { theme: 'light' | 'dark'; language: string };
  setUser: (user: UserStore['user']) => void;
}

const useUserStore = create<UserStore>((set) => ({ /* ... */ }));

// Selector return type is inferred
const userName = useUserStore((state) => state.user?.name);
// userName: string | undefined

// Type-safe selector with narrowing
const user = useUserStore((state) => state.user);
if (user) {
  console.log(user.email);  // TypeScript knows user is not null
}

// Custom selector with explicit return type
const useUserName = (): string => {
  const name = useUserStore((state) => state.user?.name);
  return name ?? 'Guest';
};`;

  const genericStoreCode = `// Generic store factory
interface EntityStore<T extends { id: string }> {
  entities: Record<string, T>;
  ids: string[];
  loading: boolean;
  error: string | null;
  
  setEntities: (entities: T[]) => void;
  addEntity: (entity: T) => void;
  updateEntity: (id: string, updates: Partial<T>) => void;
  removeEntity: (id: string) => void;
  getById: (id: string) => T | undefined;
}

// Factory function to create entity stores
function createEntityStore<T extends { id: string }>() {
  return create<EntityStore<T>>((set, get) => ({
    entities: {},
    ids: [],
    loading: false,
    error: null,
    
    setEntities: (entities) => {
      const entitiesMap = entities.reduce((acc, entity) => {
        acc[entity.id] = entity;
        return acc;
      }, {} as Record<string, T>);
      
      set({
        entities: entitiesMap,
        ids: entities.map((e) => e.id),
      });
    },
    
    addEntity: (entity) =>
      set((state) => ({
        entities: { ...state.entities, [entity.id]: entity },
        ids: [...state.ids, entity.id],
      })),
    
    updateEntity: (id, updates) =>
      set((state) => ({
        entities: {
          ...state.entities,
          [id]: { ...state.entities[id], ...updates },
        },
      })),
    
    removeEntity: (id) =>
      set((state) => {
        const { [id]: removed, ...rest } = state.entities;
        return {
          entities: rest,
          ids: state.ids.filter((i) => i !== id),
        };
      }),
    
    getById: (id) => get().entities[id],
  }));
}

// Create typed stores
interface User { id: string; name: string; email: string; }
interface Product { id: string; name: string; price: number; }

const useUserStore = createEntityStore<User>();
const useProductStore = createEntityStore<Product>();`;

  const middlewareTypingCode = `import { create, StateCreator } from 'zustand';
import { devtools, persist, PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface BearStore {
  bears: number;
  addBear: () => void;
}

// Type for store with all middleware
type BearStoreCreator = StateCreator<
  BearStore,
  [
    ['zustand/devtools', never],
    ['zustand/persist', unknown],
    ['zustand/immer', never]
  ],
  [],
  BearStore
>;

const storeCreator: BearStoreCreator = (set) => ({
  bears: 0,
  addBear: () => set((state) => { state.bears += 1 }),
});

// Apply middleware with proper typing
const useBearStore = create<BearStore>()(
  devtools(
    persist(
      immer(storeCreator),
      { name: 'bear-store' }
    ),
    { name: 'BearStore' }
  )
);`;

  const sliceTypingCode = `import { StateCreator } from 'zustand';

// Slice interfaces
interface AuthSlice {
  user: User | null;
  token: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

interface CartSlice {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

// Combined store type
type AppStore = AuthSlice & CartSlice;

// Typed slice creators
const createAuthSlice: StateCreator<
  AppStore,  // Full store type (for cross-slice access)
  [],        // Middleware chain
  [],        // Additional middleware
  AuthSlice  // This slice's type
> = (set, get) => ({
  user: null,
  token: null,
  
  login: async (credentials) => {
    const { user, token } = await api.login(credentials);
    set({ user, token });
  },
  
  logout: () => {
    set({ user: null, token: null });
    // Cross-slice: clear cart on logout
    // get() returns full AppStore type!
    get().items.forEach((item) => get().removeItem(item.id));
  },
});

const createCartSlice: StateCreator<
  AppStore, [], [], CartSlice
> = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter((i) => i.id !== id) 
  })),
});

// Combine with full typing
const useAppStore = create<AppStore>()((...a) => ({
  ...createAuthSlice(...a),
  ...createCartSlice(...a),
}));`;

  const utilityTypesCode = `// Utility types for Zustand stores

// Extract state type from store
type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

const useStore = create<{ count: number; name: string }>(() => ({
  count: 0,
  name: '',
}));

type StoreState = ExtractState<typeof useStore>;
// { count: number; name: string }

// Create typed selectors
type StoreSelector<T> = (state: StoreState) => T;

const selectCount: StoreSelector<number> = (state) => state.count;
const selectName: StoreSelector<string> = (state) => state.name;

// Utility for partial updates
type PartialStore<T> = Partial<{
  [K in keyof T]: T[K] extends Function ? never : T[K];
}>;

// Use with set()
interface MyStore {
  count: number;
  name: string;
  increment: () => void;
}

const useMyStore = create<MyStore>((set) => ({
  count: 0,
  name: '',
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Type-safe partial update
const updateStore = (updates: PartialStore<MyStore>) => {
  useMyStore.setState(updates);
};`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Type-Safe Stores for Enterprise Apps
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          TypeScript and Zustand are a powerful combination. Proper typing catches bugs at compile 
          time, provides excellent IDE support, and makes refactoring safe. This lesson covers 
          patterns from basic to advanced.
        </p>
        
        <div className="p-4 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30 flex items-start gap-3">
          <FileCode2 size={20} className="text-cyber-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-obsidian-200">
              <strong className="text-cyber-blue">Enterprise Benefit:</strong> Strong typing in stores 
              is critical for MFE architectures where multiple teams work on shared state contracts.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['basic', 'advanced', 'patterns'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab
                ? 'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30'
                : 'bg-obsidian-700 text-obsidian-300 hover:text-obsidian-100'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'basic' && (
        <>
          {/* Basic Typing */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Basic Store Typing
            </h2>
            <p className="text-obsidian-300 mb-4">
              Pass your interface to <code className="text-cyber-yellow">create&lt;T&gt;()</code> for 
              full type safety.
            </p>
            <CodeBlock code={basicTypingCode} filename="basic-typing.ts" highlightLines={[4, 5, 6, 7, 8, 11]} />
          </section>

          {/* Inferred vs Explicit */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Inferred vs Explicit Types
            </h2>
            <p className="text-obsidian-300 mb-4">
              TypeScript can infer types, but explicit typing is safer for complex stores, 
              especially with arrays.
            </p>
            <CodeBlock code={inferredTypesCode} filename="inferred-types.ts" highlightLines={[4, 5, 6, 13, 14, 15]} />
          </section>

          {/* Selector Typing */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Typed Selectors
            </h2>
            <p className="text-obsidian-300 mb-4">
              Selector return types are automatically inferred. Use type narrowing for optional values.
            </p>
            <CodeBlock code={selectorTypingCode} filename="selector-typing.ts" />
          </section>
        </>
      )}

      {activeTab === 'advanced' && (
        <>
          {/* Generic Stores */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Generic Store Factories
            </h2>
            <p className="text-obsidian-300 mb-4">
              Create reusable store factories with generics. Perfect for entity CRUD patterns.
            </p>
            <CodeBlock code={genericStoreCode} filename="generic-store.ts" highlightLines={[2, 17, 56, 57, 58, 59]} />
          </section>

          {/* Middleware Typing */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Typing with Middleware
            </h2>
            <p className="text-obsidian-300 mb-4">
              When using middleware, the type signature becomes more complex. Use{' '}
              <code className="text-cyber-yellow">StateCreator</code> with middleware type parameters.
            </p>
            <CodeBlock code={middlewareTypingCode} filename="middleware-typing.ts" highlightLines={[8, 9, 10, 11, 12, 13, 14]} />
          </section>
        </>
      )}

      {activeTab === 'patterns' && (
        <>
          {/* Slice Typing */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Typed Store Slices
            </h2>
            <p className="text-obsidian-300 mb-4">
              When using the slices pattern, proper typing enables type-safe cross-slice communication.
            </p>
            <CodeBlock code={sliceTypingCode} filename="slice-typing.ts" highlightLines={[18, 19, 20, 21, 22, 35, 36]} />
          </section>

          {/* Utility Types */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Utility Types for Zustand
            </h2>
            <p className="text-obsidian-300 mb-4">
              Create utility types for common patterns like extracting state types and creating 
              typed selectors.
            </p>
            <CodeBlock code={utilityTypesCode} filename="utility-types.ts" />
          </section>
        </>
      )}

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Always use create<Interface>() for explicit typing',
            'Be explicit with array types - inference can fail',
            'Use StateCreator for slice and middleware typing',
            'Generic factories create reusable, type-safe store patterns',
            'Utility types help with common operations',
            'Proper typing catches bugs and enables safe refactoring',
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

