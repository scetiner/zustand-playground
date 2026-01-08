import { useState } from 'react';
import { CodeBlock, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { Box, Shield, Zap } from 'lucide-react';

export function Lesson14() {
  const lesson = lessons.find((l) => l.id === 'lesson-14')!;
  const [activeTab, setActiveTab] = useState<'isolation' | 'structure' | 'communication'>('isolation');

  const isolatedStoreCode = `// MFE: Product Catalog Store
// File: product-catalog/src/stores/catalogStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CatalogStore {
  products: Product[];
  selectedCategory: string | null;
  searchQuery: string;
  loading: boolean;
  
  setProducts: (products: Product[]) => void;
  setCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  fetchProducts: () => Promise<void>;
}

// Each MFE has its own isolated store
export const useCatalogStore = create<CatalogStore>()(
  devtools(
    persist(
      (set) => ({
        products: [],
        selectedCategory: null,
        searchQuery: '',
        loading: false,
        
        setProducts: (products) => set({ products }),
        setCategory: (selectedCategory) => set({ selectedCategory }),
        setSearchQuery: (searchQuery) => set({ searchQuery }),
        
        fetchProducts: async () => {
          set({ loading: true });
          const products = await fetch('/api/products').then(r => r.json());
          set({ products, loading: false });
        },
      }),
      { 
        name: 'product-catalog-store',  // Unique key per MFE
        version: 1,
      }
    ),
    { name: 'ProductCatalogMFE' }  // Unique DevTools name
  )
);`;

  const isolatedStructureCode = `// Recommended MFE Store Structure
//
// product-catalog/
//   src/
//     stores/
//       index.ts              # Export all stores
//       catalogStore.ts       # Main catalog store
//       filtersStore.ts       # Filter-specific state
//       types.ts              # Store types
//     components/
//     hooks/
//       useCatalog.ts         # Store hooks with selectors
//     
// shopping-cart/
//   src/
//     stores/
//       index.ts
//       cartStore.ts
//       checkoutStore.ts
//     
// user-profile/
//   src/
//     stores/
//       index.ts
//       profileStore.ts
//       preferencesStore.ts

// Each MFE is completely self-contained
// No store imports across MFE boundaries!`;

  const namingConventionsCode = `// Naming Conventions for MFE Stores

// 1. Storage keys - prefix with MFE name
const useCatalogStore = create(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'product-catalog:main-store' }  // MFE:store-name
  )
);

// 2. DevTools names - use MFE prefix
const useCartStore = create(
  devtools(
    (set) => ({ /* ... */ }),
    { name: '[ShoppingCart] CartStore' }
  )
);

// 3. Event names for cross-MFE communication
const EVENTS = {
  CART_UPDATED: 'shopping-cart:cart-updated',
  USER_LOGGED_IN: 'user-profile:user-logged-in',
  PRODUCT_SELECTED: 'product-catalog:product-selected',
};

// 4. Shared state keys (if using shared stores)
const SHARED_KEYS = {
  USER: 'shared:current-user',
  THEME: 'shared:app-theme',
  NOTIFICATIONS: 'shared:notifications',
};`;

  const boundaryEnforcementCode = `// Enforcing Store Boundaries

// ❌ BAD: Importing store from another MFE
// product-catalog/src/components/ProductCard.tsx
import { useCartStore } from '@shopping-cart/stores'; // WRONG!

function ProductCard({ product }) {
  const addToCart = useCartStore((s) => s.addItem);
  // This creates tight coupling between MFEs
}

// ✅ GOOD: Use events for cross-MFE communication
// product-catalog/src/components/ProductCard.tsx

function ProductCard({ product }) {
  const handleAddToCart = () => {
    // Emit event instead of direct store access
    window.dispatchEvent(
      new CustomEvent('product-catalog:add-to-cart', {
        detail: { product },
      })
    );
  };
  
  return (
    <button onClick={handleAddToCart}>Add to Cart</button>
  );
}

// shopping-cart/src/bootstrap.ts
// Listen for events from other MFEs
window.addEventListener('product-catalog:add-to-cart', (event) => {
  const { product } = event.detail;
  useCartStore.getState().addItem(product);
});`;

  const versioningCode = `// Store Versioning for MFE Independence

interface CatalogStoreV1 {
  products: Product[];
  filters: string[];
}

interface CatalogStoreV2 {
  products: Product[];
  filters: {
    categories: string[];
    priceRange: [number, number];
    inStock: boolean;
  };
}

const useCatalogStore = create<CatalogStoreV2>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'product-catalog:store',
      version: 2,
      
      // Migrate from v1 to v2
      migrate: (persisted, version) => {
        if (version === 1) {
          const v1State = persisted as CatalogStoreV1;
          return {
            products: v1State.products,
            filters: {
              categories: v1State.filters,
              priceRange: [0, 1000],
              inStock: false,
            },
          };
        }
        return persisted as CatalogStoreV2;
      },
    }
  )
);

// Each MFE can evolve its store schema independently
// Migrations ensure backward compatibility`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Isolated Stores for Micro Frontends
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          In micro frontend architectures, each MFE should own its state completely. This enables 
          independent development, deployment, and scaling. Zustand's minimal footprint (~1KB) 
          makes it perfect for MFE isolation.
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: <Box size={20} />,
              title: 'Self-Contained',
              description: 'Each MFE owns its stores',
              color: 'cyber-green',
            },
            {
              icon: <Shield size={20} />,
              title: 'No Coupling',
              description: 'No cross-MFE store imports',
              color: 'cyber-blue',
            },
            {
              icon: <Zap size={20} />,
              title: 'Independent Deploy',
              description: 'Update stores without coordination',
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
        {(['isolation', 'structure', 'communication'] as const).map((tab) => (
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

      {activeTab === 'isolation' && (
        <>
          {/* Isolated Store Example */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Creating an Isolated MFE Store
            </h2>
            <p className="text-obsidian-300 mb-4">
              Each MFE creates its own stores with unique persistence keys and DevTools names.
            </p>
            <CodeBlock code={isolatedStoreCode} filename="catalogStore.ts" highlightLines={[27, 28, 29, 44, 45, 46, 48]} />
          </section>

          {/* Versioning */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Store Versioning
            </h2>
            <p className="text-obsidian-300 mb-4">
              Each MFE can evolve its store schema independently using migrations.
            </p>
            <CodeBlock code={versioningCode} filename="versioning.ts" highlightLines={[19, 20, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]} />
          </section>
        </>
      )}

      {activeTab === 'structure' && (
        <>
          {/* File Structure */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Recommended File Structure
            </h2>
            <p className="text-obsidian-300 mb-4">
              Keep stores within each MFE's boundaries. Never import stores across MFE boundaries.
            </p>
            <CodeBlock code={isolatedStructureCode} filename="file-structure.txt" />
          </section>

          {/* Naming Conventions */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Naming Conventions
            </h2>
            <p className="text-obsidian-300 mb-4">
              Use consistent prefixes to avoid conflicts between MFEs.
            </p>
            <CodeBlock code={namingConventionsCode} filename="naming.ts" highlightLines={[6, 13, 18, 19, 20, 21, 22, 26, 27, 28, 29]} />
          </section>
        </>
      )}

      {activeTab === 'communication' && (
        <>
          {/* Boundary Enforcement */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
              Enforcing Store Boundaries
            </h2>
            <p className="text-obsidian-300 mb-4">
              Never import stores from other MFEs. Use events for cross-MFE communication instead.
            </p>
            <CodeBlock code={boundaryEnforcementCode} filename="boundaries.tsx" highlightLines={[4, 5, 17, 18, 19, 20, 21, 22, 28, 29, 30, 31]} />
          </section>
        </>
      )}

      {/* Visual Architecture */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          MFE Store Architecture
        </h2>
        <div className="p-6 rounded-lg bg-obsidian-800 border border-obsidian-600">
          <div className="grid grid-cols-3 gap-6">
            {[
              { name: 'Product Catalog', stores: ['catalogStore', 'filtersStore'], color: 'cyber-green' },
              { name: 'Shopping Cart', stores: ['cartStore', 'checkoutStore'], color: 'cyber-blue' },
              { name: 'User Profile', stores: ['profileStore', 'preferencesStore'], color: 'cyber-purple' },
            ].map((mfe) => (
              <div
                key={mfe.name}
                className={`p-4 rounded-lg border-2 border-dashed border-${mfe.color}/50`}
              >
                <p className={`text-sm font-medium text-${mfe.color} mb-3`}>{mfe.name} MFE</p>
                <div className="space-y-2">
                  {mfe.stores.map((store) => (
                    <div
                      key={store}
                      className="px-3 py-2 bg-obsidian-900 rounded text-xs font-mono text-obsidian-300"
                    >
                      {store}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-obsidian-600">
            <p className="text-center text-sm text-obsidian-400">
              Each MFE has isolated stores • No cross-boundary imports • Events for communication
            </p>
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
            'Each MFE should own its stores completely',
            'Use unique prefixes for storage keys and DevTools names',
            'Never import stores from other MFEs',
            'Use events for cross-MFE communication',
            'Version your stores for independent evolution',
            "Zustand's small bundle size makes per-MFE stores practical",
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

