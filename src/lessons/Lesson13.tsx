import { useState, useRef } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import { Factory, Plus, Trash2 } from 'lucide-react';

// Types for dynamic stores
interface FormStore {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setValue: (field: string, value: string) => void;
  setError: (field: string, error: string) => void;
  setTouched: (field: string) => void;
  reset: () => void;
}

// Factory function to create form stores
function createFormStore(initialValues: Record<string, string> = {}): UseBoundStore<StoreApi<FormStore>> {
  return create<FormStore>((set) => ({
    values: initialValues,
    errors: {},
    touched: {},
    setValue: (field, value) =>
      set((state) => ({
        values: { ...state.values, [field]: value },
        errors: { ...state.errors, [field]: '' },
      })),
    setError: (field, error) =>
      set((state) => ({
        errors: { ...state.errors, [field]: error },
      })),
    setTouched: (field) =>
      set((state) => ({
        touched: { ...state.touched, [field]: true },
      })),
    reset: () => set({ values: initialValues, errors: {}, touched: {} }),
  }));
}

// Store registry for demo
const formStores = new Map<string, UseBoundStore<StoreApi<FormStore>>>();

function getOrCreateFormStore(formId: string, initialValues?: Record<string, string>) {
  if (!formStores.has(formId)) {
    formStores.set(formId, createFormStore(initialValues));
  }
  return formStores.get(formId)!;
}

function deleteFormStore(formId: string) {
  formStores.delete(formId);
}

export function Lesson13() {
  const lesson = lessons.find((l) => l.id === 'lesson-13')!;
  const [showHint, setShowHint] = useState(false);
  const [forms, setForms] = useState<string[]>(['form-1']);
  const nextId = useRef(2);

  const addForm = () => {
    const id = `form-${nextId.current++}`;
    setForms([...forms, id]);
  };

  const removeForm = (id: string) => {
    deleteFormStore(id);
    setForms(forms.filter((f) => f !== id));
  };

  const factoryPatternCode = `import { create, StoreApi, UseBoundStore } from 'zustand';

// Define store interface
interface FormStore {
  values: Record<string, string>;
  errors: Record<string, string>;
  setValue: (field: string, value: string) => void;
  reset: () => void;
}

// Factory function creates new store instances
function createFormStore(
  initialValues: Record<string, string> = {}
): UseBoundStore<StoreApi<FormStore>> {
  return create<FormStore>((set) => ({
    values: initialValues,
    errors: {},
    setValue: (field, value) =>
      set((state) => ({
        values: { ...state.values, [field]: value },
      })),
    reset: () => set({ values: initialValues, errors: {} }),
  }));
}

// Create stores on demand
const loginFormStore = createFormStore({ email: '', password: '' });
const signupFormStore = createFormStore({ name: '', email: '', password: '' });

// Each store is independent!
loginFormStore.getState().setValue('email', 'test@example.com');
signupFormStore.getState().setValue('name', 'John');`;

  const registryPatternCode = `// Store Registry Pattern
// Useful for dynamic entities (tabs, modals, forms)

const storeRegistry = new Map<string, UseBoundStore<StoreApi<FormStore>>>();

// Get existing store or create new one
function getOrCreateStore(
  id: string, 
  initialValues?: Record<string, string>
): UseBoundStore<StoreApi<FormStore>> {
  if (!storeRegistry.has(id)) {
    storeRegistry.set(id, createFormStore(initialValues));
  }
  return storeRegistry.get(id)!;
}

// Clean up when done
function destroyStore(id: string) {
  storeRegistry.delete(id);
}

// Usage in component
function DynamicForm({ formId }: { formId: string }) {
  // Get or create store for this form
  const useFormStore = getOrCreateStore(formId, { 
    email: '', 
    name: '' 
  });
  
  const values = useFormStore((s) => s.values);
  const setValue = useFormStore((s) => s.setValue);
  
  // Clean up on unmount
  useEffect(() => {
    return () => destroyStore(formId);
  }, [formId]);
  
  return (
    <input 
      value={values.email} 
      onChange={(e) => setValue('email', e.target.value)} 
    />
  );
}`;

  const contextIntegrationCode = `// Context + Factory for component-scoped stores
import { createContext, useContext, useRef, ReactNode } from 'react';

// Create context for the store
const FormStoreContext = createContext<UseBoundStore<StoreApi<FormStore>> | null>(null);

// Provider creates a new store instance
function FormStoreProvider({ 
  children,
  initialValues = {},
}: { 
  children: ReactNode;
  initialValues?: Record<string, string>;
}) {
  // useRef ensures we only create the store once
  const storeRef = useRef<UseBoundStore<StoreApi<FormStore>>>();
  
  if (!storeRef.current) {
    storeRef.current = createFormStore(initialValues);
  }
  
  return (
    <FormStoreContext.Provider value={storeRef.current}>
      {children}
    </FormStoreContext.Provider>
  );
}

// Hook to use the scoped store
function useFormStore<T>(selector: (state: FormStore) => T): T {
  const store = useContext(FormStoreContext);
  if (!store) {
    throw new Error('useFormStore must be used within FormStoreProvider');
  }
  return store(selector);
}

// Usage
function App() {
  return (
    <>
      <FormStoreProvider initialValues={{ email: '' }}>
        <LoginForm />  {/* Has its own isolated form state */}
      </FormStoreProvider>
      
      <FormStoreProvider initialValues={{ name: '', email: '' }}>
        <SignupForm /> {/* Has its own isolated form state */}
      </FormStoreProvider>
    </>
  );
}`;

  const mfePatternCode = `// On-Demand Stores for Micro Frontends

// Each MFE can create stores dynamically when it loads
interface MFEStore {
  isLoaded: boolean;
  data: unknown;
  load: () => Promise<void>;
}

// Store factory with MFE-specific configuration
function createMFEStore(mfeId: string): UseBoundStore<StoreApi<MFEStore>> {
  return create<MFEStore>((set) => ({
    isLoaded: false,
    data: null,
    load: async () => {
      const data = await fetchMFEData(mfeId);
      set({ isLoaded: true, data });
    },
  }));
}

// Global registry for MFE stores
const mfeStores = new Map<string, UseBoundStore<StoreApi<MFEStore>>>();

// Exported function for MFEs to get their store
export function getMFEStore(mfeId: string): UseBoundStore<StoreApi<MFEStore>> {
  if (!mfeStores.has(mfeId)) {
    mfeStores.set(mfeId, createMFEStore(mfeId));
  }
  return mfeStores.get(mfeId)!;
}

// MFE can use it like:
// const useMyMFEStore = getMFEStore('product-catalog');
// const data = useMyMFEStore((s) => s.data);`;

  const genericFactoryCode = `// Generic Factory with TypeScript

interface EntityStore<T> {
  entities: T[];
  loading: boolean;
  error: string | null;
  add: (entity: T) => void;
  remove: (predicate: (e: T) => boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Generic factory
function createEntityStore<T>(): UseBoundStore<StoreApi<EntityStore<T>>> {
  return create<EntityStore<T>>((set) => ({
    entities: [],
    loading: false,
    error: null,
    add: (entity) =>
      set((state) => ({ entities: [...state.entities, entity] })),
    remove: (predicate) =>
      set((state) => ({
        entities: state.entities.filter((e) => !predicate(e)),
      })),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }));
}

// Create typed stores
interface User { id: string; name: string; }
interface Product { id: string; title: string; price: number; }

const useUserStore = createEntityStore<User>();
const useProductStore = createEntityStore<Product>();

// Both are fully typed!
useUserStore.getState().add({ id: '1', name: 'John' });
useProductStore.getState().add({ id: '1', title: 'Widget', price: 99 });`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Dynamic Store Creation
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          Sometimes you need stores created at runtime—for dynamic forms, modals, tabs, or 
          micro frontends. Zustand supports this through factory functions and store registries.
        </p>
        
        <div className="p-4 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30 flex items-start gap-3">
          <Factory size={20} className="text-cyber-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-obsidian-200">
              <strong className="text-cyber-blue">When to use:</strong> Multiple instances of same 
              store type, lazy-loaded modules, micro frontend isolation, component-scoped state 
              that needs Zustand features.
            </p>
          </div>
        </div>
      </section>

      {/* Factory Pattern */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          The Factory Pattern
        </h2>
        <p className="text-obsidian-300 mb-4">
          Create a function that returns new store instances. Each call creates an 
          independent store.
        </p>
        <CodeBlock code={factoryPatternCode} filename="factory-pattern.ts" highlightLines={[12, 13, 14, 24, 25, 26, 29, 30]} />
      </section>

      {/* Interactive Demo */}
      <section className="mb-10">
        <InteractivePanel
          title="Dynamic Form Stores"
          description="Create and destroy form stores at runtime"
          onReset={() => {
            forms.forEach(deleteFormStore);
            setForms(['form-1']);
            nextId.current = 2;
          }}
          hint="Each form has its own independent store instance. Changes in one form don't affect others."
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={addForm}
                className="flex items-center gap-2 px-4 py-2 bg-cyber-green/20 text-cyber-green rounded-lg hover:bg-cyber-green/30"
              >
                <Plus size={16} />
                Add Form
              </button>
              <span className="text-sm text-obsidian-400">
                {forms.length} form store{forms.length !== 1 ? 's' : ''} active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {forms.map((formId) => {
                const useFormStore = getOrCreateFormStore(formId, {
                  email: '',
                  name: '',
                });
                return (
                  <DynamicFormDemo
                    key={formId}
                    formId={formId}
                    useFormStore={useFormStore}
                    onRemove={() => removeForm(formId)}
                    canRemove={forms.length > 1}
                  />
                );
              })}
            </div>
          </div>
        </InteractivePanel>
      </section>

      {/* Registry Pattern */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Store Registry Pattern
        </h2>
        <p className="text-obsidian-300 mb-4">
          For entities that come and go (tabs, modals), use a registry to manage store lifecycles.
        </p>
        <CodeBlock code={registryPatternCode} filename="registry-pattern.ts" highlightLines={[4, 7, 8, 9, 10, 11, 12, 13, 17, 18, 19]} />
      </section>

      {/* Context Integration */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Context + Factory Integration
        </h2>
        <p className="text-obsidian-300 mb-4">
          Combine React Context with factories for component-scoped stores that still benefit 
          from Zustand's features.
        </p>
        <CodeBlock code={contextIntegrationCode} filename="context-factory.tsx" highlightLines={[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 38, 39, 40, 43, 44, 45]} />
      </section>

      {/* MFE Pattern */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Micro Frontend Pattern
        </h2>
        <p className="text-obsidian-300 mb-4">
          Each micro frontend can create its store when it loads, enabling true isolation.
        </p>
        <CodeBlock code={mfePatternCode} filename="mfe-stores.ts" />
      </section>

      {/* Generic Factory */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Generic Factory with TypeScript
        </h2>
        <p className="text-obsidian-300 mb-4">
          Create reusable, type-safe store factories with generics.
        </p>
        <CodeBlock code={genericFactoryCode} filename="generic-factory.ts" highlightLines={[14, 28, 29, 32, 33]} />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Factory functions create independent store instances',
            'Store registries manage dynamic entity lifecycles',
            'Combine with Context for component-scoped Zustand stores',
            'Perfect for MFE isolation - each app gets its own store',
            'Use generics for type-safe, reusable store factories',
            'Remember to clean up stores when entities are destroyed',
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

// Sub-component for dynamic form demo
function DynamicFormDemo({
  formId,
  useFormStore,
  onRemove,
  canRemove,
}: {
  formId: string;
  useFormStore: UseBoundStore<StoreApi<FormStore>>;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const values = useFormStore((s) => s.values);
  const errors = useFormStore((s) => s.errors);
  const setValue = useFormStore((s) => s.setValue);
  const reset = useFormStore((s) => s.reset);

  return (
    <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-mono text-cyber-yellow">{formId}</span>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="text-xs text-obsidian-400 hover:text-obsidian-100"
          >
            Reset
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="text-xs text-cyber-red hover:text-cyber-red/80"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Email"
          value={values.email || ''}
          onChange={(e) => setValue('email', e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-obsidian-800 border border-obsidian-600 rounded text-obsidian-100 placeholder-obsidian-500"
        />
        <input
          type="text"
          placeholder="Name"
          value={values.name || ''}
          onChange={(e) => setValue('name', e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-obsidian-800 border border-obsidian-600 rounded text-obsidian-100 placeholder-obsidian-500"
        />
      </div>
      
      <div className="mt-3 pt-3 border-t border-obsidian-700">
        <StateInspector
          state={{ values, errors }}
          title="Store State"
          showTimestamp={false}
        />
      </div>
    </div>
  );
}

