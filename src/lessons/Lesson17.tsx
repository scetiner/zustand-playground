import { CodeBlock, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { PlayCircle, RefreshCw, Layers } from 'lucide-react';

export function Lesson17() {
  const lesson = lessons.find((l) => l.id === 'lesson-17')!;

  const lazyInitCode = `// Lazy Store Initialization
// Only create stores when MFE loads

// product-catalog/src/stores/catalogStore.ts
import { create } from 'zustand';

let catalogStore: ReturnType<typeof createCatalogStore> | null = null;

function createCatalogStore() {
  return create<CatalogStore>((set) => ({
    products: [],
    loading: false,
    fetchProducts: async () => {
      set({ loading: true });
      const products = await api.getProducts();
      set({ products, loading: false });
    },
  }));
}

// Getter that creates on first access
export function getCatalogStore() {
  if (!catalogStore) {
    catalogStore = createCatalogStore();
  }
  return catalogStore;
}

// Hook wrapper for React components
export function useCatalogStore<T>(selector: (state: CatalogStore) => T): T {
  const store = getCatalogStore();
  return store(selector);
}

// Usage in component
function ProductList() {
  const products = useCatalogStore((s) => s.products);
  const fetchProducts = useCatalogStore((s) => s.fetchProducts);
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  return <div>{/* render products */}</div>;
}`;

  const bootstrapPatternCode = `// Bootstrap Pattern for MFE Stores

// product-catalog/src/bootstrap.ts
import { getCatalogStore } from './stores/catalogStore';
import { getFiltersStore } from './stores/filtersStore';

interface BootstrapConfig {
  apiBaseUrl: string;
  initialCategory?: string;
  featureFlags?: Record<string, boolean>;
}

let isInitialized = false;

export async function bootstrap(config: BootstrapConfig) {
  if (isInitialized) {
    console.warn('Product Catalog MFE already initialized');
    return;
  }
  
  // Configure API
  api.setBaseUrl(config.apiBaseUrl);
  
  // Initialize stores with config
  const catalogStore = getCatalogStore();
  const filtersStore = getFiltersStore();
  
  // Set initial state from config
  if (config.initialCategory) {
    filtersStore.getState().setCategory(config.initialCategory);
  }
  
  // Apply feature flags
  if (config.featureFlags) {
    catalogStore.getState().setFeatureFlags(config.featureFlags);
  }
  
  // Pre-fetch initial data
  await catalogStore.getState().fetchProducts();
  
  isInitialized = true;
  
  // Return cleanup function
  return () => {
    isInitialized = false;
    // Clear stores if needed
  };
}

// Host app calls bootstrap when loading MFE
// await bootstrap({ apiBaseUrl: '/api/v1', initialCategory: 'electronics' });`;

  const hydrateFromHostCode = `// Hydrating Store from Host Application

// The host app may have data the MFE needs

// shared/src/types.ts
interface MFEInitData {
  user?: User;
  preferences?: UserPreferences;
  permissions?: string[];
  featureFlags?: Record<string, boolean>;
}

// product-catalog/src/bootstrap.ts
export async function bootstrap(
  config: BootstrapConfig, 
  initData?: MFEInitData
) {
  const catalogStore = getCatalogStore();
  
  // Hydrate from host-provided data
  if (initData?.user) {
    catalogStore.getState().setCurrentUser(initData.user);
  }
  
  if (initData?.preferences) {
    catalogStore.getState().setPreferences(initData.preferences);
  }
  
  if (initData?.permissions) {
    catalogStore.getState().setPermissions(initData.permissions);
  }
  
  // Feature flags affect initial behavior
  if (initData?.featureFlags?.['new-ui']) {
    catalogStore.getState().enableNewUI();
  }
}

// Host app provides init data when mounting MFE
const initData: MFEInitData = {
  user: currentUser,
  preferences: userPrefs,
  permissions: ['read', 'write'],
  featureFlags: await fetchFeatureFlags(),
};

mountProductCatalogMFE(container, { apiBaseUrl }, initData);`;

  const storeRegistryCode = `// Global Store Registry for MFE Coordination

// shared/src/storeRegistry.ts
type StoreEntry = {
  store: unknown;
  version: number;
  createdAt: number;
};

class StoreRegistry {
  private stores = new Map<string, StoreEntry>();
  private listeners = new Map<string, Set<(store: unknown) => void>>();
  
  register(key: string, store: unknown, version: number = 1) {
    const existing = this.stores.get(key);
    
    // Version check for hot reloading
    if (existing && existing.version >= version) {
      console.log(\`Store \${key} already registered with same/newer version\`);
      return existing.store;
    }
    
    this.stores.set(key, {
      store,
      version,
      createdAt: Date.now(),
    });
    
    // Notify listeners
    this.listeners.get(key)?.forEach((fn) => fn(store));
    
    return store;
  }
  
  get<T>(key: string): T | undefined {
    return this.stores.get(key)?.store as T;
  }
  
  waitFor<T>(key: string, timeout = 5000): Promise<T> {
    const existing = this.get<T>(key);
    if (existing) return Promise.resolve(existing);
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(\`Timeout waiting for store: \${key}\`));
      }, timeout);
      
      const listeners = this.listeners.get(key) || new Set();
      const handler = (store: unknown) => {
        clearTimeout(timer);
        listeners.delete(handler);
        resolve(store as T);
      };
      listeners.add(handler);
      this.listeners.set(key, listeners);
    });
  }
}

// Singleton registry on window for all MFEs
declare global {
  interface Window {
    __MFE_STORE_REGISTRY__: StoreRegistry;
  }
}

export const storeRegistry = (
  window.__MFE_STORE_REGISTRY__ ||= new StoreRegistry()
);

// MFE registers its store
storeRegistry.register('cart-store', useCartStore, 1);

// Another MFE waits for it
const cartStore = await storeRegistry.waitFor('cart-store');`;

  const hotReloadCode = `// Hot Module Replacement (HMR) Support

// Preserve store state during development hot reloads

// stores/catalogStore.ts
import { create } from 'zustand';

// Check if store exists on window (from previous HMR)
const existingState = window.__CATALOG_STORE_STATE__;

const useCatalogStore = create<CatalogStore>((set) => ({
  // Use existing state if available
  ...(existingState || {
    products: [],
    filters: {},
    loading: false,
  }),
  
  // Actions
  setProducts: (products) => set({ products }),
  // ...
}));

// Save state to window for HMR
if (import.meta.hot) {
  import.meta.hot.accept();
  
  // Before HMR update, save current state
  import.meta.hot.dispose(() => {
    window.__CATALOG_STORE_STATE__ = useCatalogStore.getState();
  });
}

// Type declaration
declare global {
  interface Window {
    __CATALOG_STORE_STATE__?: CatalogStore;
  }
}

export { useCatalogStore };`;

  const initializationOrderCode = `// Managing Initialization Order

// Some stores depend on others being ready

// stores/init.ts
import { storeRegistry } from 'shared/storeRegistry';

// Define dependency graph
const STORE_DEPENDENCIES = {
  'cart-store': ['user-store'],      // Cart needs user
  'checkout-store': ['cart-store', 'user-store'],
  'recommendations-store': ['user-store', 'cart-store'],
};

async function initializeStore(
  storeName: string,
  createFn: () => unknown
) {
  // Wait for dependencies
  const deps = STORE_DEPENDENCIES[storeName] || [];
  
  await Promise.all(
    deps.map((dep) => storeRegistry.waitFor(dep))
  );
  
  // Create and register store
  const store = createFn();
  storeRegistry.register(storeName, store);
  
  return store;
}

// Usage
await initializeStore('cart-store', () => {
  const userStore = storeRegistry.get('user-store');
  
  return create((set) => ({
    items: [],
    userId: userStore.getState().user?.id,
    // ...
  }));
});`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Store Initialization Strategies
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          In MFE architectures, stores can't all be created at app startup. Each MFE loads 
          independently, possibly lazily. This lesson covers strategies for initializing 
          stores in this dynamic environment.
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: <PlayCircle size={20} />,
              title: 'Lazy Init',
              description: 'Create stores on first access',
              color: 'cyber-green',
            },
            {
              icon: <RefreshCw size={20} />,
              title: 'Hot Reload',
              description: 'Preserve state during HMR',
              color: 'cyber-blue',
            },
            {
              icon: <Layers size={20} />,
              title: 'Dependencies',
              description: 'Manage store init order',
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

      {/* Lazy Initialization */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Lazy Store Initialization
        </h2>
        <p className="text-obsidian-300 mb-4">
          Create stores only when they're first accessed. This reduces initial load time 
          and ensures stores exist when needed.
        </p>
        <CodeBlock code={lazyInitCode} filename="lazyStore.ts" highlightLines={[7, 9, 10, 11, 12, 20, 21, 22, 23, 24, 28, 29, 30, 31]} />
      </section>

      {/* Bootstrap Pattern */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Bootstrap Pattern
        </h2>
        <p className="text-obsidian-300 mb-4">
          A bootstrap function initializes stores with configuration and pre-fetches data. 
          The host app calls this when mounting the MFE.
        </p>
        <CodeBlock code={bootstrapPatternCode} filename="bootstrap.ts" highlightLines={[12, 13, 14, 22, 23, 36]} />
      </section>

      {/* Hydrate from Host */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Hydrating from Host Application
        </h2>
        <p className="text-obsidian-300 mb-4">
          The host app may already have data the MFE needs. Accept initialization data 
          to hydrate stores immediately.
        </p>
        <CodeBlock code={hydrateFromHostCode} filename="hydrate.ts" highlightLines={[14, 15, 16, 19, 20, 21, 23, 24, 25, 27, 28, 29, 32, 33, 34]} />
      </section>

      {/* Store Registry */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Global Store Registry
        </h2>
        <p className="text-obsidian-300 mb-4">
          A registry allows MFEs to discover and wait for stores from other MFEs. 
          Essential for coordination in complex architectures.
        </p>
        <CodeBlock code={storeRegistryCode} filename="storeRegistry.ts" highlightLines={[11, 12, 13, 26, 27, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]} />
      </section>

      {/* HMR Support */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Hot Module Replacement Support
        </h2>
        <p className="text-obsidian-300 mb-4">
          Preserve store state during development when modules hot reload. 
          This improves the development experience significantly.
        </p>
        <CodeBlock code={hotReloadCode} filename="hmr.ts" highlightLines={[6, 10, 11, 12, 13, 14, 21, 22, 25, 26, 27]} />
      </section>

      {/* Initialization Order */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Managing Initialization Order
        </h2>
        <p className="text-obsidian-300 mb-4">
          Some stores depend on others. Use a dependency graph to ensure stores 
          initialize in the correct order.
        </p>
        <CodeBlock code={initializationOrderCode} filename="initOrder.ts" highlightLines={[6, 7, 8, 9, 15, 16, 17, 18]} />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Use lazy initialization to create stores on first access',
            'Bootstrap functions configure stores with host-provided data',
            'A global registry helps MFEs discover each other\'s stores',
            'Support HMR to preserve state during development',
            'Manage dependencies for correct initialization order',
            'Always provide cleanup/teardown for MFE unmounting',
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

