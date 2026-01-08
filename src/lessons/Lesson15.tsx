import { useState } from 'react';
import { CodeBlock, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { Share2, Globe, Package } from 'lucide-react';

export function Lesson15() {
  const lesson = lessons.find((l) => l.id === 'lesson-15')!;
  const [activeTab, setActiveTab] = useState<'expose' | 'consume' | 'hybrid'>('expose');

  const moduleFederationConfigCode = `// webpack.config.js (Host Application)
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        sharedStores: 'sharedStores@http://localhost:3001/remoteEntry.js',
        productCatalog: 'productCatalog@http://localhost:3002/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, eager: true },
        'react-dom': { singleton: true, eager: true },
        zustand: { singleton: true, eager: true },  // Share Zustand!
      },
    }),
  ],
};

// webpack.config.js (Shared Stores MFE)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'sharedStores',
      filename: 'remoteEntry.js',
      exposes: {
        './stores': './src/stores/index',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        zustand: { singleton: true },
      },
    }),
  ],
};`;

  const sharedStoreCode = `// shared-stores/src/stores/userStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface SharedUserStore {
  user: User | null;
  isAuthenticated: boolean;
  
  setUser: (user: User | null) => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

// This store will be shared across ALL MFEs
export const useSharedUserStore = create<SharedUserStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        
        setUser: (user) => set({ 
          user, 
          isAuthenticated: !!user 
        }),
        
        login: async (credentials) => {
          const user = await authApi.login(credentials);
          set({ user, isAuthenticated: true });
        },
        
        logout: () => set({ 
          user: null, 
          isAuthenticated: false 
        }),
      }),
      { name: 'shared:user-store' }
    ),
    { name: '[Shared] UserStore' }
  )
);

// shared-stores/src/stores/index.ts
export { useSharedUserStore } from './userStore';
export type { User } from './userStore';`;

  const consumeSharedStoreCode = `// product-catalog/src/components/UserGreeting.tsx
import { useSharedUserStore } from 'sharedStores/stores';

function UserGreeting() {
  // This uses the SAME store instance as other MFEs!
  const user = useSharedUserStore((s) => s.user);
  const isAuthenticated = useSharedUserStore((s) => s.isAuthenticated);
  
  if (!isAuthenticated) {
    return <p>Please log in to see personalized recommendations</p>;
  }
  
  return <p>Welcome back, {user?.name}!</p>;
}

// shopping-cart/src/components/CheckoutButton.tsx
import { useSharedUserStore } from 'sharedStores/stores';

function CheckoutButton() {
  const isAuthenticated = useSharedUserStore((s) => s.isAuthenticated);
  const user = useSharedUserStore((s) => s.user);
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return (
    <button onClick={() => checkout(user!.id)}>
      Proceed to Checkout
    </button>
  );
}

// user-profile/src/components/LogoutButton.tsx
import { useSharedUserStore } from 'sharedStores/stores';

function LogoutButton() {
  const logout = useSharedUserStore((s) => s.logout);
  
  return (
    <button onClick={logout}>
      Log Out
    </button>
  );
}

// When user logs out in user-profile MFE,
// all other MFEs react to the change automatically!`;

  const typeSafeRemotesCode = `// Type-safe remote store imports

// types/remotes.d.ts (in each MFE)
declare module 'sharedStores/stores' {
  export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
  }

  export interface SharedUserStore {
    user: User | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    logout: () => void;
  }

  export const useSharedUserStore: import('zustand').UseBoundStore<
    import('zustand').StoreApi<SharedUserStore>
  >;
}

// Now TypeScript knows the shape of remote stores!
import { useSharedUserStore } from 'sharedStores/stores';

// Full type safety and autocomplete ✓
const user = useSharedUserStore((s) => s.user);
const login = useSharedUserStore((s) => s.login);`;

  const hybridArchitectureCode = `// Hybrid Architecture: Shared + Isolated Stores

// SHARED (via Module Federation)
// - User authentication state
// - Global notifications
// - App-wide preferences (theme, language)
// - Feature flags

// ISOLATED (per MFE)
// - Product catalog state
// - Shopping cart items
// - Form state
// - UI state (modals, sidebars)

// product-catalog/src/stores/index.ts
// Import shared store from remote
export { useSharedUserStore } from 'sharedStores/stores';

// Local isolated stores
export { useCatalogStore } from './catalogStore';
export { useFiltersStore } from './filtersStore';

// Component using both
function ProductPage() {
  // Shared across all MFEs
  const user = useSharedUserStore((s) => s.user);
  
  // Isolated to this MFE
  const products = useCatalogStore((s) => s.products);
  const filters = useFiltersStore((s) => s.activeFilters);
  
  return (
    <div>
      {user && <p>Welcome, {user.name}!</p>}
      <ProductList products={products} filters={filters} />
    </div>
  );
}`;

  const singletonPatternCode = `// Ensuring Singleton Stores with Module Federation

// webpack.config.js
{
  shared: {
    zustand: {
      singleton: true,      // Only one instance
      requiredVersion: '^4.0.0',
      eager: true,          // Load immediately
    },
  },
}

// Why this matters:
// Without singleton: true, each MFE might load its own Zustand
// This would create separate store instances, breaking shared state!

// Verification in dev
if (process.env.NODE_ENV === 'development') {
  // Check if store is truly shared
  const testValue = Math.random();
  useSharedUserStore.setState({ _test: testValue });
  
  setTimeout(() => {
    const otherMFEValue = useSharedUserStore.getState()._test;
    if (otherMFEValue !== testValue) {
      console.warn('Store is not properly shared across MFEs!');
    }
  }, 1000);
}`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Sharing State Across MFEs with Module Federation
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          While isolation is the default, some state genuinely needs to be shared: user 
          authentication, notifications, theme preferences. Module Federation lets you 
          expose Zustand stores as shared modules.
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: <Package size={20} />,
              title: 'Expose Stores',
              description: 'MFE exposes stores as remote modules',
              color: 'cyber-green',
            },
            {
              icon: <Share2 size={20} />,
              title: 'Single Instance',
              description: 'All MFEs share same store instance',
              color: 'cyber-blue',
            },
            {
              icon: <Globe size={20} />,
              title: 'Live Updates',
              description: 'Changes propagate to all MFEs',
              color: 'cyber-yellow',
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
      </section>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['expose', 'consume', 'hybrid'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab
                ? 'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30'
                : 'bg-obsidian-700 text-obsidian-300 hover:text-obsidian-100'
            }`}
          >
            {tab === 'expose' ? 'Exposing Stores' : tab === 'consume' ? 'Consuming Stores' : 'Hybrid Architecture'}
          </button>
        ))}
      </div>

      {activeTab === 'expose' && (
        <>
          {/* Module Federation Config */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Module Federation Configuration
            </h2>
            <p className="text-obsidian-300 mb-4">
              Configure Module Federation to expose stores and ensure Zustand is shared as a singleton.
            </p>
            <CodeBlock code={moduleFederationConfigCode} filename="webpack.config.js" highlightLines={[15, 27, 28, 29, 32]} />
          </section>

          {/* Creating Shared Store */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Creating a Shared Store
            </h2>
            <p className="text-obsidian-300 mb-4">
              Create stores in a dedicated "shared stores" MFE that other MFEs import from.
            </p>
            <CodeBlock code={sharedStoreCode} filename="userStore.ts" highlightLines={[21, 22, 23]} />
          </section>

          {/* Singleton Pattern */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Ensuring Singleton Stores
            </h2>
            <p className="text-obsidian-300 mb-4">
              The <code className="text-cyber-yellow">singleton: true</code> setting is critical 
              for shared state to work correctly.
            </p>
            <CodeBlock code={singletonPatternCode} filename="singleton.ts" highlightLines={[5, 6, 7]} />
          </section>
        </>
      )}

      {activeTab === 'consume' && (
        <>
          {/* Consuming Shared Stores */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Consuming Shared Stores
            </h2>
            <p className="text-obsidian-300 mb-4">
              Import shared stores using the Module Federation remote syntax. All MFEs see the same state!
            </p>
            <CodeBlock code={consumeSharedStoreCode} filename="components.tsx" highlightLines={[2, 5, 6, 18, 21, 22, 33, 36]} />
          </section>

          {/* Type Safety */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Type-Safe Remote Imports
            </h2>
            <p className="text-obsidian-300 mb-4">
              Create type declarations for remote stores to get full TypeScript support.
            </p>
            <CodeBlock code={typeSafeRemotesCode} filename="remotes.d.ts" highlightLines={[4, 5, 6, 7, 8, 9, 10, 11, 19, 20, 21]} />
          </section>
        </>
      )}

      {activeTab === 'hybrid' && (
        <>
          {/* Hybrid Architecture */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Hybrid: Shared + Isolated Stores
            </h2>
            <p className="text-obsidian-300 mb-4">
              The best architecture combines shared stores for global state with isolated stores 
              for MFE-specific state.
            </p>
            <CodeBlock code={hybridArchitectureCode} filename="hybrid.tsx" highlightLines={[4, 5, 6, 7, 10, 11, 12, 13]} />
          </section>
        </>
      )}

      {/* Visual Architecture */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Shared Store Architecture
        </h2>
        <div className="p-6 rounded-lg bg-obsidian-800 border border-obsidian-600">
          <div className="flex flex-col items-center gap-6">
            {/* Shared Stores MFE */}
            <div className="p-4 rounded-lg border-2 border-cyber-yellow bg-cyber-yellow/5 w-64">
              <p className="text-center text-sm font-medium text-cyber-yellow mb-3">
                Shared Stores MFE
              </p>
              <div className="space-y-2">
                <div className="px-3 py-2 bg-obsidian-900 rounded text-xs font-mono text-center text-obsidian-300">
                  useSharedUserStore
                </div>
                <div className="px-3 py-2 bg-obsidian-900 rounded text-xs font-mono text-center text-obsidian-300">
                  useSharedThemeStore
                </div>
              </div>
            </div>

            {/* Arrows */}
            <div className="flex gap-8">
              {['←', '↓', '→'].map((arrow, i) => (
                <span key={i} className="text-cyber-yellow text-2xl">
                  {arrow}
                </span>
              ))}
            </div>

            {/* Consumer MFEs */}
            <div className="grid grid-cols-3 gap-4 w-full">
              {[
                { name: 'Product Catalog', color: 'cyber-green' },
                { name: 'Shopping Cart', color: 'cyber-blue' },
                { name: 'User Profile', color: 'cyber-purple' },
              ].map((mfe) => (
                <div
                  key={mfe.name}
                  className={`p-3 rounded-lg border border-${mfe.color}/50 bg-${mfe.color}/5`}
                >
                  <p className={`text-xs font-medium text-${mfe.color} text-center`}>
                    {mfe.name}
                  </p>
                  <p className="text-[10px] text-obsidian-400 text-center mt-1">
                    imports shared + has local stores
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Use Module Federation to expose Zustand stores as remotes',
            'Set zustand as singleton: true in shared config',
            'Create type declarations for type-safe remote imports',
            'Use hybrid architecture: shared global + isolated MFE state',
            'Only share what needs to be shared (auth, theme, notifications)',
            'Changes in shared stores propagate to all consuming MFEs',
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

