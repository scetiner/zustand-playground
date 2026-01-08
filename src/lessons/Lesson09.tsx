import { useState } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';
import { Layers, Users, ShoppingCart, Bell } from 'lucide-react';

// Define slice types
interface UserSlice {
  user: { id: string; name: string; email: string } | null;
  isAuthenticated: boolean;
  login: (user: { id: string; name: string; email: string }) => void;
  logout: () => void;
}

interface CartSlice {
  items: { id: string; name: string; price: number; quantity: number }[];
  addItem: (item: { id: string; name: string; price: number }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

interface NotificationSlice {
  notifications: { id: string; message: string; type: 'info' | 'success' | 'error' }[];
  addNotification: (message: string, type: 'info' | 'success' | 'error') => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

interface UISlice {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Combined store type
type AppStore = UserSlice & CartSlice & NotificationSlice & UISlice;

// Slice creator type
type SliceCreator<T> = (
  set: (fn: Partial<AppStore> | ((state: AppStore) => Partial<AppStore>)) => void,
  get: () => AppStore
) => T;

// Create slices
const createUserSlice: SliceCreator<UserSlice> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => {
    set({ user, isAuthenticated: true });
    // Cross-slice communication!
    get().addNotification(`Welcome back, ${user.name}!`, 'success');
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
    get().clearCart();
    get().addNotification('You have been logged out', 'info');
  },
});

const createCartSlice: SliceCreator<CartSlice> = (set, get) => ({
  items: [],
  addItem: (item) => {
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
    });
    get().addNotification(`Added ${item.name} to cart`, 'success');
  },
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
});

const createNotificationSlice: SliceCreator<NotificationSlice> = (set) => ({
  notifications: [],
  addNotification: (message, type) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: Date.now().toString(), message, type },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
});

const createUISlice: SliceCreator<UISlice> = (set) => ({
  sidebarOpen: true,
  theme: 'dark',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
});

// Combine all slices into one store
const useAppStore = create<AppStore>()((...args) => ({
  ...createUserSlice(...args),
  ...createCartSlice(...args),
  ...createNotificationSlice(...args),
  ...createUISlice(...args),
}));

// Products for demo
const products = [
  { id: 'p1', name: 'Zustand Pro', price: 29.99 },
  { id: 'p2', name: 'React Mastery', price: 49.99 },
  { id: 'p3', name: 'TypeScript Guide', price: 39.99 },
];

export function Lesson09() {
  const lesson = lessons.find((l) => l.id === 'lesson-9')!;
  const [showHint, setShowHint] = useState(false);
  
  const store = useAppStore();

  const basicSliceCode = `import { create, StateCreator } from 'zustand';

// Define slice types
interface UserSlice {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

interface CartSlice {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clearCart: () => void;
}

// Combined store type
type AppStore = UserSlice & CartSlice;

// Create individual slices
const createUserSlice: StateCreator<
  AppStore,  // Full store type
  [],        // No middleware
  [],        // No middleware
  UserSlice  // This slice's type
> = (set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
});

const createCartSlice: StateCreator<
  AppStore, [], [], CartSlice
> = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),
  clearCart: () => set({ items: [] }),
});

// Combine slices into store
const useAppStore = create<AppStore>()((...args) => ({
  ...createUserSlice(...args),
  ...createCartSlice(...args),
}));`;

  const crossSliceCode = `// Cross-slice communication
const createUserSlice: StateCreator<
  AppStore, [], [], UserSlice
> = (set, get) => ({  // Note: we have access to get()
  user: null,
  
  login: (user) => {
    set({ user, isAuthenticated: true });
    
    // Call notification slice action!
    get().addNotification(\`Welcome, \${user.name}!\`, 'success');
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
    
    // Clear cart when user logs out
    get().clearCart();
    get().addNotification('Logged out', 'info');
  },
});

const createCartSlice: StateCreator<
  AppStore, [], [], CartSlice
> = (set, get) => ({
  items: [],
  
  addItem: (item) => {
    // Check if user is authenticated
    if (!get().isAuthenticated) {
      get().addNotification('Please login first', 'error');
      return;
    }
    
    set((state) => ({ items: [...state.items, item] }));
    get().addNotification(\`Added \${item.name} to cart\`, 'success');
  },
});`;

  const withMiddlewareCode = `// Slices with middleware (persist, devtools)
import { devtools, persist } from 'zustand/middleware';

// Each slice remains the same
const createUserSlice: StateCreator<
  AppStore, 
  [['zustand/persist', unknown], ['zustand/devtools', never]],
  [],
  UserSlice
> = (set) => ({ /* ... */ });

const createCartSlice: StateCreator<
  AppStore,
  [['zustand/persist', unknown], ['zustand/devtools', never]],
  [],
  CartSlice
> = (set) => ({ /* ... */ });

// Apply middleware to combined store
const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (...args) => ({
        ...createUserSlice(...args),
        ...createCartSlice(...args),
      }),
      { 
        name: 'app-store',
        partialize: (state) => ({
          // Only persist certain slices
          user: state.user,
          items: state.items,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);`;

  const organizedStructureCode = `// Recommended file structure for sliced stores
// 
// src/
//   stores/
//     index.ts          # Combined store export
//     types.ts          # All store types
//     slices/
//       userSlice.ts    # User slice
//       cartSlice.ts    # Cart slice
//       uiSlice.ts      # UI slice

// types.ts
export interface UserSlice { /* ... */ }
export interface CartSlice { /* ... */ }
export interface UISlice { /* ... */ }
export type AppStore = UserSlice & CartSlice & UISlice;

// slices/userSlice.ts
import type { StateCreator } from 'zustand';
import type { AppStore, UserSlice } from '../types';

export const createUserSlice: StateCreator<
  AppStore, [], [], UserSlice
> = (set) => ({ /* ... */ });

// index.ts
import { create } from 'zustand';
import { createUserSlice } from './slices/userSlice';
import { createCartSlice } from './slices/cartSlice';
import type { AppStore } from './types';

export const useAppStore = create<AppStore>()((...args) => ({
  ...createUserSlice(...args),
  ...createCartSlice(...args),
}));`;

  const resetStore = () => {
    useAppStore.setState({
      user: null,
      isAuthenticated: false,
      items: [],
      notifications: [],
      sidebarOpen: true,
      theme: 'dark',
    });
  };

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Modular Store Architecture
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          As your application grows, a single monolithic store becomes hard to maintain. 
          The <strong className="text-obsidian-100">slices pattern</strong> lets you split 
          your store into modular, focused pieces while keeping them as a single combined store.
        </p>
        
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: <Users size={20} />, title: 'User Slice', color: 'cyber-green' },
            { icon: <ShoppingCart size={20} />, title: 'Cart Slice', color: 'cyber-blue' },
            { icon: <Bell size={20} />, title: 'Notification Slice', color: 'cyber-orange' },
            { icon: <Layers size={20} />, title: 'UI Slice', color: 'cyber-purple' },
          ].map((item) => (
            <div
              key={item.title}
              className={`p-3 rounded-lg bg-${item.color}/10 border border-${item.color}/30 text-center`}
            >
              <div className={`w-8 h-8 mx-auto rounded-lg bg-${item.color}/20 flex items-center justify-center mb-2 text-${item.color}`}>
                {item.icon}
              </div>
              <p className="text-xs text-obsidian-200">{item.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Basic Slice Pattern */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Creating Store Slices
        </h2>
        <p className="text-obsidian-300 mb-4">
          Each slice is a <code className="text-cyber-yellow">StateCreator</code> function that 
          returns a portion of the store. Combine them with spread operators.
        </p>
        <CodeBlock code={basicSliceCode} filename="slices-basic.ts" highlightLines={[20, 21, 22, 23, 24, 40, 41, 42, 43]} />
      </section>

      {/* Interactive Example */}
      <section className="mb-10">
        <InteractivePanel
          title="Sliced Store in Action"
          description="Four slices working together: User, Cart, Notifications, UI"
          onReset={resetStore}
          hint="Notice how logging in/out triggers notifications - that's cross-slice communication!"
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* User Slice */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-cyber-green/30">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-cyber-green" />
                  <span className="text-xs text-cyber-green uppercase tracking-wider">User Slice</span>
                </div>
                {store.isAuthenticated ? (
                  <div className="space-y-2">
                    <p className="text-obsidian-100">{store.user?.name}</p>
                    <p className="text-sm text-obsidian-400">{store.user?.email}</p>
                    <button
                      onClick={store.logout}
                      className="px-3 py-1.5 text-sm bg-cyber-red/20 text-cyber-red rounded-lg hover:bg-cyber-red/30"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      store.login({ id: 'u1', name: 'John Doe', email: 'john@example.com' })
                    }
                    className="px-4 py-2 bg-cyber-green/20 text-cyber-green rounded-lg hover:bg-cyber-green/30"
                  >
                    Login as John
                  </button>
                )}
              </div>

              {/* Cart Slice */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-cyber-blue/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-cyber-blue" />
                    <span className="text-xs text-cyber-blue uppercase tracking-wider">Cart Slice</span>
                  </div>
                  <span className="text-cyber-yellow font-mono">${store.getTotal().toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => store.addItem(p)}
                      className="px-2 py-1 text-xs bg-obsidian-700 text-obsidian-300 rounded hover:text-obsidian-100"
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
                {store.items.length > 0 && (
                  <div className="space-y-1">
                    {store.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-obsidian-200">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="text-obsidian-400">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications Slice */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-cyber-orange/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-cyber-orange" />
                    <span className="text-xs text-cyber-orange uppercase tracking-wider">
                      Notifications Slice
                    </span>
                  </div>
                  {store.notifications.length > 0 && (
                    <button
                      onClick={store.clearAll}
                      className="text-xs text-obsidian-400 hover:text-obsidian-100"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {store.notifications.length === 0 ? (
                    <p className="text-sm text-obsidian-500 italic">No notifications</p>
                  ) : (
                    store.notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-center justify-between p-2 rounded text-sm ${
                          n.type === 'success'
                            ? 'bg-cyber-green/10 text-cyber-green'
                            : n.type === 'error'
                            ? 'bg-cyber-red/10 text-cyber-red'
                            : 'bg-cyber-blue/10 text-cyber-blue'
                        }`}
                      >
                        <span>{n.message}</span>
                        <button
                          onClick={() => store.removeNotification(n.id)}
                          className="opacity-50 hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* UI Slice */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-cyber-purple/30">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={16} className="text-cyber-purple" />
                  <span className="text-xs text-cyber-purple uppercase tracking-wider">UI Slice</span>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-obsidian-300">Sidebar</span>
                    <button
                      onClick={store.toggleSidebar}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        store.sidebarOpen ? 'bg-cyber-purple' : 'bg-obsidian-600'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          store.sidebarOpen ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                  <div className="flex gap-1">
                    {(['light', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => store.setTheme(t)}
                        className={`px-2 py-1 text-xs rounded ${
                          store.theme === t
                            ? 'bg-cyber-purple/20 text-cyber-purple'
                            : 'bg-obsidian-700 text-obsidian-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <StateInspector
              state={{
                user: store.user,
                isAuthenticated: store.isAuthenticated,
                cartItems: store.items.length,
                cartTotal: store.getTotal(),
                notifications: store.notifications.length,
                sidebarOpen: store.sidebarOpen,
                theme: store.theme,
              }}
              title="Combined Store State"
            />
          </div>
        </InteractivePanel>
      </section>

      {/* Cross-Slice Communication */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Cross-Slice Communication
        </h2>
        <p className="text-obsidian-300 mb-4">
          Slices can call each other's actions using <code className="text-cyber-yellow">get()</code>. 
          This enables powerful patterns like triggering notifications when a user logs in.
        </p>
        <CodeBlock code={crossSliceCode} filename="cross-slice.ts" highlightLines={[9, 10, 14, 15, 16, 29, 30, 31, 32]} />
      </section>

      {/* With Middleware */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Slices with Middleware
        </h2>
        <p className="text-obsidian-300 mb-4">
          When using middleware like persist and devtools, the slice type signature changes 
          slightly to include middleware types.
        </p>
        <CodeBlock code={withMiddlewareCode} filename="slices-middleware.ts" />
      </section>

      {/* File Structure */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Recommended File Structure
        </h2>
        <p className="text-obsidian-300 mb-4">
          For enterprise applications, organize slices into separate files with shared types.
        </p>
        <CodeBlock code={organizedStructureCode} filename="file-structure.ts" />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Use StateCreator type for creating modular slices',
            'Combine slices with spread operators in create()',
            'Access other slices via get() for cross-slice communication',
            'Apply middleware to the combined store, not individual slices',
            'Organize large stores into separate files by domain',
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

