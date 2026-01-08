import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, User, Bell, Settings, Sun, Moon, RefreshCw, AlertTriangle, Database } from 'lucide-react';
import type { RunResult } from '../utils/codeRunner';
import { create } from 'zustand';

interface LivePreviewProps {
  lessonId: number;
  resetKey?: number;
  runResult?: RunResult | null;
}

export function LivePreview({ lessonId, resetKey = 0, runResult }: LivePreviewProps) {
  // Lesson 19 is a documentation page - render full width without wrapper
  if (lessonId === 19) {
    return <BestPracticesPreview key={`docs-${resetKey}`} />;
  }
  
  // If we have a run result with a store, render the executed component/store
  if (runResult?.success && (runResult.store || runResult.Component)) {
    return (
      <div className="space-y-3" key={`executed-${lessonId}-${resetKey}`}>
        <ExecutedPreview result={runResult} lessonId={lessonId} />
      </div>
    );
  }
  // Otherwise show the interactive demo (before code is run)
  return (
    <div className="space-y-3" key={`preview-${lessonId}-${resetKey}`}>
      <PreviewComponent lessonId={lessonId} />
    </div>
  );
}

// Renders the component created from user's code
function ExecutedPreview({ result, lessonId }: { result: RunResult; lessonId: number }) {
  const [storeState, setStoreState] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Subscribe to store changes (single store)
  useEffect(() => {
    if (!result.store) return;
    // Skip if we have multiple stores (handled separately)
    if (result.stores) return;
    
    try {
      setStoreState(result.store.getState() as Record<string, unknown>);
      
      const unsubscribe = result.store.subscribe((newState: unknown) => {
        setStoreState(newState as Record<string, unknown>);
      });
      
      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subscribing to store');
    }
  }, [result.store, result.stores]);
  
  // Subscribe to multiple stores (lesson 14)
  useEffect(() => {
    if (!result.stores) return;
    
    const unsubscribes: (() => void)[] = [];
    
    try {
      // Build initial combined state
      const combined: Record<string, unknown> = {};
      for (const [key, store] of Object.entries(result.stores)) {
        combined[key] = store.getState();
        // Subscribe to each store
        const unsub = store.subscribe((newState: unknown) => {
          setStoreState(prev => ({ ...prev, [key]: newState }));
        });
        unsubscribes.push(unsub);
      }
      setStoreState(combined);
      
      return () => unsubscribes.forEach(fn => fn());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subscribing to stores');
    }
  }, [result.stores]);

  // Special component for lesson 14 with multiple stores
  const MultiStoreComponent = useMemo(() => {
    if (lessonId !== 14 || !result.stores) return null;
    
    const productStore = result.stores.product;
    const cartStore = result.stores.cart;
    
    return function IsolatedStoresComponent() {
      const productState = productStore((s: unknown) => s) as Record<string, unknown>;
      const cartState = cartStore((s: unknown) => s) as Record<string, unknown>;
      
      const products = (productState.products ?? []) as string[];
      const selected = productState.selected as string | null;
      const items = (cartState.items ?? []) as string[];
      
      const handleSelect = (id: string) => {
        const selectFn = (productStore.getState() as Record<string, unknown>).select as ((id: string) => void) | undefined;
        if (selectFn) selectFn(id);
      };
      
      const handleAddToCart = (item: string) => {
        const addFn = (cartStore.getState() as Record<string, unknown>).add as ((item: string) => void) | undefined;
        if (addFn) addFn(item);
      };
      
      return (
        <div className="space-y-3">
          <PreviewCard title="Your Isolated Stores" live>
            <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
              Each MFE has its own store
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Product Store */}
              <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent)' }}>
                <div className="text-xs mb-1 font-medium" style={{ color: 'var(--accent)' }}>📦 Product Store</div>
                <div className="space-y-0.5">
                  {products.map(p => (
                    <button
                      key={p}
                      onClick={() => handleSelect(p)}
                      className="w-full text-left px-1 py-0.5 rounded text-xs"
                      style={{
                        background: selected === p ? 'var(--accent)' : 'transparent',
                        color: selected === p ? 'var(--bg-primary)' : 'var(--text-secondary)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {/* Cart Store */}
              <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                <div className="text-xs mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>🛒 Cart Store</div>
                <div className="text-xs space-y-0.5">
                  {items.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>Empty</div>
                  ) : (
                    items.map((item, i) => (
                      <div key={i} style={{ color: 'var(--text-secondary)' }}>• {item}</div>
                    ))
                  )}
                </div>
                {selected && (
                  <button
                    onClick={() => handleAddToCart(selected)}
                    className="w-full mt-1 px-1 py-0.5 rounded text-xs"
                    style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  >
                    Add {selected}
                  </button>
                )}
              </div>
            </div>
          </PreviewCard>
          <StoreStateDisplay state={{ product: productState, cart: cartState }} />
        </div>
      );
    };
  }, [lessonId, result.stores]);

  // Create a component that uses the store
  const LiveComponent = useMemo(() => {
    if (!result.store) return null;
    // Skip for lesson 14 which uses multiple stores
    if (lessonId === 14 && result.stores) return null;
    
    const store = result.store;
    
    // Create a component based on lesson type
    return function DynamicComponent() {
      const state = store((s: unknown) => s) as Record<string, unknown>;
      const storeApi = store as unknown as { getState: () => Record<string, unknown> };
      
      // Get actions from store (functions)
      const actions = Object.entries(storeApi.getState()).filter(
        ([, value]) => typeof value === 'function'
      );
      
      // Get state values (non-functions)
      const stateValues = Object.entries(state).filter(
        ([, value]) => typeof value !== 'function'
      );
      
      // Render based on lesson type
      
      // Lesson 1: Counter
      if (lessonId === 1) {
        const count = (state.count ?? 0) as number;
        const incrementAction = actions.find(([name]) => name === 'increment');
        const decrementAction = actions.find(([name]) => name === 'decrement');
        const resetAction = actions.find(([name]) => name === 'reset');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Counter" live>
              <div className="text-xs mb-3 text-center" style={{ color: 'var(--text-muted)' }}>
                Store with count + actions
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => decrementAction && (decrementAction[1] as () => void)()}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ background: 'var(--bg-tertiary)' }}
                  disabled={!decrementAction}
                >
                  <Minus size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <span className="text-4xl font-bold min-w-[60px] text-center" style={{ color: 'var(--accent)' }}>
                  {count}
                </span>
                <button
                  onClick={() => incrementAction && (incrementAction[1] as () => void)()}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ background: 'var(--bg-tertiary)' }}
                  disabled={!incrementAction}
                >
                  <Plus size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
              {resetAction && (
                <button
                  onClick={() => (resetAction[1] as () => void)()}
                  className="w-full mt-2 px-3 py-1.5 rounded text-xs"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                >
                  Reset
                </button>
              )}
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 2: Bears - show 🐻 emojis with Add Bear/Remove buttons
      if (lessonId === 2) {
        const bears = (state.bears ?? 0) as number;
        const increaseAction = actions.find(([name]) => name === 'increase');
        const decreaseAction = actions.find(([name]) => name === 'decrease');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Bear Store" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Typed interface for bear store
              </div>
              <div className="text-center mb-2">
                <span className="text-3xl">{'🐻'.repeat(Math.min(bears, 5))}{bears > 5 ? `+${bears - 5}` : ''}</span>
                {bears === 0 && <span className="text-xl" style={{ color: 'var(--text-muted)' }}>No bears</span>}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => decreaseAction && (decreaseAction[1] as () => void)()}
                  className="px-3 py-1 rounded text-xs"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  disabled={!decreaseAction}
                >
                  Remove
                </button>
                <button
                  onClick={() => increaseAction && (increaseAction[1] as () => void)()}
                  className="px-3 py-1 rounded text-xs"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  disabled={!increaseAction}
                >
                  Add Bear
                </button>
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 3: Selectors - show selector concept with render tracking
      if (lessonId === 3) {
        const count = (state.count ?? 0) as number;
        const name = (state.name ?? 'Guest') as string;
        const theme = (state.theme ?? 'dark') as string;
        const incrementAction = actions.find(([name]) => name === 'increment');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Selectors" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Selectors prevent unnecessary re-renders
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Selected: count</div>
                  <div style={{ color: 'var(--accent)' }} className="text-lg font-bold">{count}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                    <div style={{ color: 'var(--text-muted)' }}>name:</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{name}</div>
                  </div>
                  <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                    <div style={{ color: 'var(--text-muted)' }}>theme:</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{theme}</div>
                  </div>
                </div>
                <button
                  onClick={() => incrementAction && (incrementAction[1] as () => void)()}
                  className="w-full px-2 py-1 rounded text-xs"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  disabled={!incrementAction}
                >
                  Increment Count
                </button>
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      if (lessonId === 4) {
        // Todo list
        const todos = (state.todos ?? []) as Array<{ id: number; text: string; completed: boolean }>;
        const addTodo = actions.find(([name]) => name === 'addTodo');
        const toggleTodo = actions.find(([name]) => name === 'toggleTodo');
        const removeTodo = actions.find(([name]) => name === 'removeTodo');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Todo App" live>
              <TodoInput onAdd={addTodo ? (text) => (addTodo[1] as (t: string) => void)(text) : undefined} />
              <div className="space-y-1 mt-2 max-h-32 overflow-y-auto">
                {todos.length === 0 && (
                  <div className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                    No todos yet
                  </div>
                )}
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-2 text-xs group">
                    <button
                      onClick={() => toggleTodo && (toggleTodo[1] as (id: number) => void)(todo.id)}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${todo.completed ? 'bg-green-500 border-green-500' : ''}`}
                      style={{ borderColor: todo.completed ? undefined : 'var(--border)' }}
                    >
                      {todo.completed && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span
                      className="flex-1 truncate"
                      style={{
                        color: todo.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
                        textDecoration: todo.completed ? 'line-through' : 'none',
                      }}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => removeTodo && (removeTodo[1] as (id: number) => void)(todo.id)}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      if (lessonId === 5) {
        // Async loading
        const users = (state.users ?? []) as string[];
        const loading = state.loading as boolean;
        const fetchUsers = actions.find(([name]) => name === 'fetchUsers');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Async Component" live>
              <button
                onClick={() => fetchUsers && (fetchUsers[1] as () => void)()}
                disabled={loading}
                className="w-full px-3 py-2 rounded text-xs transition-colors"
                style={{
                  background: loading ? 'var(--bg-tertiary)' : 'var(--accent)',
                  color: loading ? 'var(--text-muted)' : 'var(--bg-primary)',
                }}
              >
                {loading ? 'Loading...' : 'Fetch Users'}
              </button>
              {users.length > 0 && (
                <div className="mt-2 space-y-1">
                  {users.map((user, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <User size={12} />
                      {user}
                    </div>
                  ))}
                </div>
              )}
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 6: DevTools - show action log display
      if (lessonId === 6) {
        const count = (state.count ?? 0) as number;
        const incrementAction = actions.find(([name]) => name === 'increment');
        const decrementAction = actions.find(([name]) => name === 'decrement');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your DevTools Store" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Debug with Redux DevTools
              </div>
              <div className="text-center text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>{count}</div>
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => incrementAction && (incrementAction[1] as () => void)()}
                  className="flex-1 px-2 py-1 rounded text-xs"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  disabled={!incrementAction}
                >
                  +1
                </button>
                <button
                  onClick={() => decrementAction && (decrementAction[1] as () => void)()}
                  className="flex-1 px-2 py-1 rounded text-xs"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  disabled={!decrementAction}
                >
                  -1
                </button>
              </div>
              <div className="text-xs p-2 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)' }}>Action names logged to DevTools</div>
                <div style={{ color: 'var(--accent)' }}>→ Check browser DevTools!</div>
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 7: Persist - show settings with localStorage
      if (lessonId === 7) {
        return <Lesson7ExecutedPreview state={state} actions={actions} store={result.store} />;
      }
      
      // Lesson 8: Immer - show nested notifications toggle
      if (lessonId === 8) {
        const user = (state.user ?? { profile: { settings: { notifications: true } } }) as { profile: { settings: { notifications: boolean } } };
        const notifications = user?.profile?.settings?.notifications ?? true;
        const toggleAction = actions.find(([name]) => name === 'toggleNotifications');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Immer Store" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Write mutable-style updates
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>user.settings.notifications</span>
                <button
                  onClick={() => toggleAction && (toggleAction[1] as () => void)()}
                  className={`w-8 h-4 rounded-full relative ${notifications ? 'bg-green-500' : 'bg-gray-600'}`}
                  disabled={!toggleAction}
                >
                  <div className={`absolute w-3 h-3 bg-white rounded-full top-0.5 transition-all ${notifications ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="mt-2 text-xs p-2 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)' }}>Nested update simplified!</div>
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 9: Slices - show UserSlice + CartSlice separation
      if (lessonId === 9) {
        const user = state.user as { name: string } | null;
        const items = (state.items ?? []) as string[];
        const loginAction = actions.find(([name]) => name === 'login');
        const logoutAction = actions.find(([name]) => name === 'logout');
        const addItemAction = actions.find(([name]) => name === 'addItem');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Combined Store" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Combine multiple slices
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-1.5 rounded" style={{ background: 'var(--bg-primary)' }}>
                  <User size={12} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>UserSlice:</span>
                  {user ? (
                    <>
                      <span className="text-xs" style={{ color: 'var(--accent)' }}>{user.name}</span>
                      <button
                        onClick={() => logoutAction && (logoutAction[1] as () => void)()}
                        className="ml-auto text-xs px-2 py-0.5 rounded"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => loginAction && (loginAction[1] as (name: string) => void)('Alice')}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                      disabled={!loginAction}
                    >
                      Login
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded" style={{ background: 'var(--bg-primary)' }}>
                  <ShoppingCart size={12} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>CartSlice:</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{items.length} items</span>
                  <button
                    onClick={() => addItemAction && (addItemAction[1] as (item: string) => void)('Product')}
                    className="ml-auto text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                    disabled={!addItemAction}
                  >
                    +Add
                  </button>
                </div>
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 10: TypeScript - show features checklist
      if (lessonId === 10) {
        const count = (state.count ?? 0) as number;
        const isPositiveAction = actions.find(([name]) => name === 'isPositive');
        const incrementAction = actions.find(([name]) => name === 'increment');
        const isPositive = isPositiveAction ? (isPositiveAction[1] as () => boolean)() : count > 0;
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your TypeScript Store" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Master StateCreator types
              </div>
              <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>Full type inference</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>get() for current state</span></div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span>isPositive(): {isPositive ? 'true' : 'false'}</span>
                </div>
              </div>
              <button
                onClick={() => incrementAction && (incrementAction[1] as () => void)()}
                className="w-full mt-2 px-2 py-1 rounded text-xs"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                disabled={!incrementAction}
              >
                Increment (count: {count})
              </button>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 11: Context replacement - show comparison
      if (lessonId === 11) {
        const theme = (state.theme ?? 'dark') as string;
        const toggleTheme = actions.find(([name]) => name === 'toggleTheme');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Context → Zustand" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                No Provider wrappers needed!
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                  <div style={{ color: '#ef4444' }}>❌ Context</div>
                  <div style={{ color: 'var(--text-muted)' }}>Provider required</div>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                  <div style={{ color: 'var(--accent)' }}>✓ Zustand</div>
                  <div style={{ color: 'var(--text-muted)' }}>Just import & use</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Theme: {theme}</span>
                <button
                  onClick={() => toggleTheme && (toggleTheme[1] as () => void)()}
                  className="px-2 py-1 rounded text-xs"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  disabled={!toggleTheme}
                >
                  Toggle
                </button>
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 12: Subscribe - show subscription logs
      if (lessonId === 12) {
        const count = (state.count ?? 0) as number;
        const incrementAction = actions.find(([name]) => name === 'increment');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Subscribe Store" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Subscribe outside React
              </div>
              <button
                onClick={() => incrementAction && (incrementAction[1] as () => void)()}
                className="w-full px-2 py-1 rounded text-xs mb-2"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                disabled={!incrementAction}
              >
                Trigger Change (count: {count})
              </button>
              <div className="text-xs p-2 rounded max-h-16 overflow-y-auto" style={{ background: 'var(--bg-tertiary)' }}>
                <div style={{ color: 'var(--text-muted)' }}>Subscription active</div>
                <div style={{ color: 'var(--accent)' }}>→ State changed to: {count}</div>
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 13: Dynamic stores - show form creation
      if (lessonId === 13) {
        const values = (state.values ?? {}) as Record<string, string>;
        const setValueAction = actions.find(([name]) => name === 'setValue');
        const resetAction = actions.find(([name]) => name === 'reset');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Dynamic Store" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Created on-demand
              </div>
              <div className="space-y-1">
                {Object.entries(values).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{key}:</span>
                    <input
                      value={value}
                      onChange={(e) => setValueAction && (setValueAction[1] as (k: string, v: string) => void)(key, e.target.value)}
                      className="flex-1 px-2 py-0.5 rounded text-xs"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      disabled={!setValueAction}
                    />
                  </div>
                ))}
                {Object.keys(values).length === 0 && (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Empty form values</div>
                )}
              </div>
              {resetAction && (
                <button
                  onClick={() => (resetAction[1] as () => void)()}
                  className="w-full mt-2 px-2 py-1 rounded text-xs"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  Reset Form
                </button>
              )}
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 14: Isolated Stores
      if (lessonId === 14) {
        const products = (state.products ?? []) as string[];
        const selected = state.selected as string | null;
        const items = (state.items ?? []) as string[];
        const selectAction = actions.find(([name]) => name === 'select');
        const addAction = actions.find(([name]) => name === 'add');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Isolated Stores" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Each MFE has its own store
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* Product Store */}
                <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent)' }}>
                  <div className="text-xs mb-1 font-medium" style={{ color: 'var(--accent)' }}>📦 Product Store</div>
                  <div className="space-y-0.5">
                    {products.map(p => (
                      <button
                        key={p}
                        onClick={() => selectAction && (selectAction[1] as (id: string) => void)(p)}
                        className="w-full text-left px-1 py-0.5 rounded text-xs"
                        style={{
                          background: selected === p ? 'var(--accent)' : 'transparent',
                          color: selected === p ? 'var(--bg-primary)' : 'var(--text-secondary)'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Cart Store */}
                <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                  <div className="text-xs mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>🛒 Cart Store</div>
                  <div className="text-xs space-y-0.5">
                    {items.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)' }}>Empty</div>
                    ) : (
                      items.map((item, i) => (
                        <div key={i} style={{ color: 'var(--text-secondary)' }}>• {item}</div>
                      ))
                    )}
                  </div>
                  {selected && addAction && (
                    <button
                      onClick={() => (addAction[1] as (item: string) => void)(selected)}
                      className="w-full mt-1 px-1 py-0.5 rounded text-xs"
                      style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                    >
                      Add {selected}
                    </button>
                  )}
                </div>
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 15: Shared State (Auth)
      if (lessonId === 15) {
        const user = state.user as { name: string } | null;
        const token = state.token as string | null;
        const loginAction = actions.find(([name]) => name === 'login');
        const logoutAction = actions.find(([name]) => name === 'logout');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Shared Auth Store" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Shared across all MFEs
              </div>
              {/* Auth Controls */}
              <div className="p-2 rounded mb-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent)' }}>
                <div className="text-xs mb-1 font-medium" style={{ color: 'var(--accent)' }}>🔐 Auth Store</div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  User: {user ? (typeof user === 'object' ? user.name : user) : 'Not logged in'}
                </div>
                {user ? (
                  <button
                    onClick={() => logoutAction && (logoutAction[1] as () => void)()}
                    className="w-full px-2 py-1 rounded text-xs"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => loginAction && (loginAction[1] as (u: string, t: string) => void)('Bob', 'new-token')}
                    className="w-full px-2 py-1 rounded text-xs"
                    style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  >
                    Login as Bob
                  </button>
                )}
              </div>
              {/* MFEs using shared state */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded text-xs" style={{ background: 'var(--bg-tertiary)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Header MFE</div>
                  <div style={{ color: user ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {user ? `👤 ${typeof user === 'object' ? user.name : user}` : '👤 Guest'}
                  </div>
                </div>
                <div className="p-2 rounded text-xs" style={{ background: 'var(--bg-tertiary)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Profile MFE</div>
                  <div style={{ color: user ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {user ? '✓ Authorized' : '✕ No access'}
                  </div>
                </div>
              </div>
            </PreviewCard>
            <StoreStateDisplay state={{ user, token: token ? '***' : null }} />
          </div>
        );
      }
      
      // Lesson 16: Event Bus
      if (lessonId === 16) {
        const events = (state.events ?? []) as { type: string; payload: unknown }[];
        const publishAction = actions.find(([name]) => name === 'publish');
        const subscribeAction = actions.find(([name]) => name === 'subscribe');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Event Bus" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Publish/Subscribe communication
              </div>
              {/* Publishers */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => publishAction && (publishAction[1] as (t: string, p: unknown) => void)('cart:updated', { action: 'add' })}
                  className="p-2 rounded text-xs"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent)', color: 'var(--text-secondary)' }}
                >
                  🛒 Publish<br/>cart:updated
                </button>
                <button
                  onClick={() => publishAction && (publishAction[1] as (t: string, p: unknown) => void)('user:action', { name: 'click' })}
                  className="p-2 rounded text-xs"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  👤 Publish<br/>user:action
                </button>
              </div>
              {/* Event Log */}
              <div className="p-2 rounded text-xs max-h-20 overflow-y-auto" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="mb-1" style={{ color: 'var(--text-muted)' }}>⚡ Events ({events.length}):</div>
                {events.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>No events yet</div>
                ) : (
                  events.slice(-5).map((e, i) => (
                    <div key={i} style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent)' }}>{e.type}</span>: {JSON.stringify(e.payload)}
                    </div>
                  ))
                )}
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 17: Initialization
      if (lessonId === 17) {
        const initialized = state.initialized as boolean;
        const config = state.config as Record<string, unknown> | null;
        const initializeAction = actions.find(([name]) => name === 'initialize');
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your MFE Initialization" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Coordinate startup sequence
              </div>
              {/* Status */}
              <div className="p-2 rounded mb-2 text-center" style={{ background: 'var(--bg-tertiary)' }}>
                {initialized ? (
                  <>
                    <div className="text-lg">✅</div>
                    <div className="text-xs" style={{ color: 'var(--accent)' }}>MFE Ready!</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg">⚪</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Not initialized</div>
                  </>
                )}
              </div>
              {/* Config Display */}
              {config && (
                <div className="p-2 rounded mb-2 text-xs" style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent)' }}>
                  <div style={{ color: 'var(--accent)' }}>Config loaded:</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{JSON.stringify(config)}</div>
                </div>
              )}
              {/* Controls */}
              {!initialized && initializeAction && (
                <button
                  onClick={() => (initializeAction[1] as (c?: unknown) => void)({ theme: 'light', version: '1.0' })}
                  className="w-full px-2 py-1 rounded text-xs"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                >
                  Initialize MFE
                </button>
              )}
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 18: Testing - show test runner
      if (lessonId === 18) {
        const count = (state.count ?? 0) as number;
        const incrementAction = actions.find(([name]) => name === 'increment');
        const decrementAction = actions.find(([name]) => name === 'decrement');
        const resetAction = actions.find(([name]) => name === 'reset');
        
        const tests = [
          { name: 'increment()', pass: !!incrementAction },
          { name: 'decrement()', pass: !!decrementAction },
          { name: 'reset()', pass: !!resetAction },
        ];
        
        return (
          <div className="space-y-3">
            <PreviewCard title="Your Test Store" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Test actions with getState()
              </div>
              <div className="space-y-1 mb-2">
                {tests.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center text-white"
                      style={{ fontSize: '10px', background: t.pass ? '#22c55e' : '#6b7280' }}
                    >
                      {t.pass ? '✓' : '○'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{t.name}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs p-2 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)' }}>Current count: {count}</div>
                <div style={{ color: 'var(--accent)' }}>All assertions passing!</div>
              </div>
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Lesson 19: Best Practices - show checklist
      if (lessonId === 19) {
        return (
          <div className="space-y-3">
            <PreviewCard title="Best Practices Store" live>
              <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Production-ready checklist
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2"><span style={{ color: 'var(--accent)' }}>✓</span><span style={{ color: 'var(--text-secondary)' }}>TypeScript interfaces</span></div>
                <div className="flex items-center gap-2"><span style={{ color: 'var(--accent)' }}>✓</span><span style={{ color: 'var(--text-secondary)' }}>Selectors for subscriptions</span></div>
                <div className="flex items-center gap-2"><span style={{ color: 'var(--accent)' }}>✓</span><span style={{ color: 'var(--text-secondary)' }}>Small & focused stores</span></div>
                <div className="flex items-center gap-2"><span style={{ color: 'var(--accent)' }}>✓</span><span style={{ color: 'var(--text-secondary)' }}>DevTools in development</span></div>
                <div className="flex items-center gap-2"><span style={{ color: '#ef4444' }}>✕</span><span style={{ color: 'var(--text-muted)' }}>Huge monolithic stores</span></div>
                <div className="flex items-center gap-2"><span style={{ color: '#ef4444' }}>✕</span><span style={{ color: 'var(--text-muted)' }}>Over-engineering</span></div>
              </div>
              {actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {actions.map(([name, fn]) => (
                    <button
                      key={name}
                      onClick={() => (fn as () => void)()}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                    >
                      {name}()
                    </button>
                  ))}
                </div>
              )}
            </PreviewCard>
            <StoreStateDisplay state={state} />
          </div>
        );
      }
      
      // Generic fallback for any other lessons
      return (
        <div className="space-y-3">
          <PreviewCard title="Your Component" live>
            <div className="space-y-2">
              {stateValues.map(([key, value]) => (
                <div key={key} className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                  <span style={{ color: 'var(--accent)' }}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
            {actions.length > 0 && (
              <div className="mt-3 pt-3 border-t flex flex-wrap gap-1" style={{ borderColor: 'var(--border)' }}>
                {actions.map(([name, fn]) => (
                  <button
                    key={name}
                    onClick={() => (fn as () => void)()}
                    className="px-2 py-1 rounded text-xs"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  >
                    {name}()
                  </button>
                ))}
              </div>
            )}
          </PreviewCard>
          <StoreStateDisplay state={state} />
        </div>
      );
    };
  }, [result.store, lessonId]);

  if (error) {
    return (
      <PreviewCard title="Error">
        <div className="flex items-center gap-2 text-xs" style={{ color: '#ef4444' }}>
          <AlertTriangle size={14} />
          {error}
        </div>
      </PreviewCard>
    );
  }

  // Render multi-store component for lesson 14
  if (MultiStoreComponent) {
    return <MultiStoreComponent />;
  }

  if (LiveComponent) {
    return <LiveComponent />;
  }

  return (
    <PreviewCard title="Store State">
      <StoreStateDisplay state={storeState} />
    </PreviewCard>
  );
}

// Todo input component
function TodoInput({ onAdd }: { onAdd?: (text: string) => void }) {
  const [text, setText] = useState('');
  
  const handleAdd = () => {
    if (text.trim() && onAdd) {
      onAdd(text.trim());
      setText('');
    }
  };
  
  return (
    <div className="flex gap-1">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="Add a todo..."
        className="flex-1 px-2 py-1.5 rounded text-xs"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <button
        onClick={handleAdd}
        className="px-2 rounded"
        style={{ background: 'var(--accent)' }}
        disabled={!onAdd}
      >
        <Plus size={14} style={{ color: 'var(--bg-primary)' }} />
      </button>
    </div>
  );
}

// Store state display component
function StoreStateDisplay({ state }: { state: Record<string, unknown> }) {
  const stateValues = Object.entries(state).filter(([, value]) => typeof value !== 'function');
  
  if (stateValues.length === 0) return null;
  
  return (
    <div className="rounded border" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
      <div className="px-2 py-1 border-b text-xs flex items-center gap-1" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
        State
      </div>
      <pre className="p-2 text-xs font-mono overflow-auto max-h-64" style={{ color: 'var(--text-secondary)', margin: 0 }}>
        {JSON.stringify(Object.fromEntries(stateValues), null, 2)}
      </pre>
    </div>
  );
}

function PreviewComponent({ lessonId }: { lessonId: number }) {
  // Debug: uncomment to verify lessonId
  // console.log('PreviewComponent lessonId:', lessonId);
  
  switch (lessonId) {
    case 1: return <CounterPreview key="demo-1" />;
    case 2: return <BearPreview key="demo-2" />;
    case 3: return <SelectorPreview key="demo-3" />;
    case 4: return <TodoPreview key="demo-4" />;
    case 5: return <AsyncPreview key="demo-5" />;
    case 6: return <DevToolsPreview key="demo-6" />;
    case 7: return <PersistPreview key="demo-7" />;
    case 8: return <ImmerPreview key="demo-8" />;
    case 9: return <SlicesPreview key="demo-9" />;
    case 10: return <TypeScriptPreview key="demo-10" />;
    case 11: return <ContextPreview key="demo-11" />;
    case 12: return <SubscribePreview key="demo-12" />;
    case 13: return <DynamicPreview key="demo-13" />;
    case 14: return <IsolatedStoresPreview key="demo-14" />;
    case 15: return <SharedStatePreview key="demo-15" />;
    case 16: return <EventBusPreview key="demo-16" />;
    case 17: return <InitializationPreview key="demo-17" />;
    case 18: return <TestingPreview key="demo-18" />;
    case 19: return <BestPracticesPreview key="demo-19" />;
    default: return <CounterPreview key="demo-default" />;
  }
}

// Interactive Preview Components (shown before code is run)
function CounterPreview() {
  const [count, setCount] = useState(0);
  return (
    <PreviewCard title="1. Counter Demo">
      <div className="text-xs mb-3 text-center" style={{ color: 'var(--text-muted)' }}>
        Create a store with count + increment
      </div>
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setCount(c => Math.max(0, c - 1))} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
          <Minus size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <span className="text-4xl font-bold min-w-[60px] text-center" style={{ color: 'var(--accent)' }}>{count}</span>
        <button onClick={() => setCount(c => c + 1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
          <Plus size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>
      <StateDisplay state={{ count }} />
    </PreviewCard>
  );
}

function BearPreview() {
  const [bears, setBears] = useState(0);
  return (
    <PreviewCard title="2. TypeScript Bears">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Add typed interface for bear store
      </div>
      <div className="text-center mb-2">
        <span className="text-3xl">{'🐻'.repeat(Math.min(bears, 5))}{bears > 5 ? `+${bears - 5}` : ''}</span>
        {bears === 0 && <span className="text-xl" style={{ color: 'var(--text-muted)' }}>No bears</span>}
      </div>
      <div className="flex justify-center gap-2">
        <button onClick={() => setBears(b => Math.max(0, b - 1))} className="px-3 py-1 rounded text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
          Remove
        </button>
        <button onClick={() => setBears(b => b + 1)} className="px-3 py-1 rounded text-xs" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
          Add Bear
        </button>
      </div>
      <StateDisplay state={{ bears }} />
    </PreviewCard>
  );
}

function SelectorPreview() {
  const [count, setCount] = useState(0);
  const [renders, setRenders] = useState(0);
  
  return (
    <PreviewCard title="3. Selectors">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Use selectors to prevent re-renders
      </div>
      <div className="space-y-2 text-xs">
        <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Selected: count</div>
          <div style={{ color: 'var(--accent)' }} className="text-lg font-bold">{count}</div>
        </div>
        <button 
          onClick={() => { setCount(c => c + 1); setRenders(r => r + 1); }} 
          className="w-full px-2 py-1 rounded text-xs" 
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          Increment (renders: {renders})
        </button>
      </div>
    </PreviewCard>
  );
}

interface Todo { id: number; text: string; completed: boolean }

function TodoPreview() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos(t => [...t, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  };
  const toggle = (id: number) => setTodos(t => t.map(x => x.id === id ? { ...x, completed: !x.completed } : x));
  const remove = (id: number) => setTodos(t => t.filter(x => x.id !== id));

  return (
    <PreviewCard title="4. Actions & Updates">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Implement CRUD actions for todos
      </div>
      <div className="flex gap-1 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New todo..."
          className="flex-1 px-2 py-1 rounded text-xs"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo} className="p-1 rounded" style={{ background: 'var(--accent)' }}>
          <Plus size={12} style={{ color: 'var(--bg-primary)' }} />
        </button>
      </div>
      <div className="space-y-1 max-h-20 overflow-y-auto">
        {todos.length === 0 && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No todos yet</div>}
        {todos.map(t => (
          <div key={t.id} className="flex items-center gap-2 text-xs">
            <button onClick={() => toggle(t.id)} className={`w-3 h-3 rounded border ${t.completed ? 'bg-green-500' : ''}`} style={{ borderColor: 'var(--border)' }} />
            <span className="flex-1 truncate" style={{ color: t.completed ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: t.completed ? 'line-through' : 'none' }}>{t.text}</span>
            <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100">
              <Trash2 size={10} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        ))}
      </div>
      <StateDisplay state={{ todos: todos.length, completed: todos.filter(t => t.completed).length }} />
    </PreviewCard>
  );
}

function AsyncPreview() {
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchUsers = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setUsers(['Alice', 'Bob', 'Charlie']);
    setLoading(false);
  };

  return (
    <PreviewCard title="5. Async Actions">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Handle loading states and async calls
      </div>
      <button 
        onClick={fetchUsers} 
        disabled={loading}
        className="w-full px-2 py-1 rounded text-xs mb-2" 
        style={{ background: loading ? 'var(--bg-tertiary)' : 'var(--accent)', color: loading ? 'var(--text-muted)' : 'var(--bg-primary)' }}
      >
        {loading ? 'Loading...' : 'Fetch Users'}
      </button>
      {users.length > 0 && (
        <div className="space-y-1">
          {users.map(u => (
            <div key={u} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <User size={10} />
              {u}
            </div>
          ))}
        </div>
      )}
      <StateDisplay state={{ users: users.length, loading }} />
    </PreviewCard>
  );
}

function DevToolsPreview() {
  const [actions, setActions] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  
  const logAction = (name: string, delta: number) => {
    setActions(a => [...a.slice(-4), name]);
    setCount(c => c + delta);
  };
  
  return (
    <PreviewCard title="6. DevTools">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Debug with Redux DevTools
      </div>
      <div className="text-center text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>{count}</div>
      <div className="flex gap-1 mb-2">
        <button onClick={() => logAction('INCREMENT', 1)} className="flex-1 px-2 py-1 rounded text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>+1</button>
        <button onClick={() => logAction('DECREMENT', -1)} className="flex-1 px-2 py-1 rounded text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>-1</button>
      </div>
      <div className="text-xs p-2 rounded max-h-16 overflow-y-auto" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Action Log:</div>
        {actions.map((a, i) => <div key={i} style={{ color: 'var(--accent)' }}>→ {a}</div>)}
      </div>
    </PreviewCard>
  );
}

function PersistPreview() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [fontSize, setFontSize] = useState(14);
  const [storage, setStorage] = useState('{}');
  
  const handleThemeChange = (t: 'light' | 'dark') => {
    setTheme(t);
    const newStorage = JSON.stringify({ theme: t, fontSize });
    setStorage(newStorage);
  };
  
  const handleFontChange = (s: number) => {
    setFontSize(s);
    const newStorage = JSON.stringify({ theme, fontSize: s });
    setStorage(newStorage);
  };
  
  return (
    <PreviewCard title="7. Persist">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Save state to localStorage
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Theme:</span>
        <div className="flex rounded overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
          <button onClick={() => handleThemeChange('light')} className={`px-2 py-1 ${theme === 'light' ? 'bg-white/10' : ''}`}>
            <Sun size={12} style={{ color: theme === 'light' ? 'var(--accent)' : 'var(--text-muted)' }} />
          </button>
          <button onClick={() => handleThemeChange('dark')} className={`px-2 py-1 ${theme === 'dark' ? 'bg-white/10' : ''}`}>
            <Moon size={12} style={{ color: theme === 'dark' ? 'var(--accent)' : 'var(--text-muted)' }} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Font:</span>
        <div className="flex gap-1">
          {[12, 14, 16, 18].map(s => (
            <button 
              key={s} 
              onClick={() => handleFontChange(s)}
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ 
                background: fontSize === s ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: fontSize === s ? 'var(--bg-primary)' : 'var(--text-muted)'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="text-xs p-2 rounded mt-2" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1 mb-1">
          <Database size={10} style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--text-muted)' }}>localStorage:</span>
        </div>
        <code className="text-xs" style={{ color: 'var(--accent)' }}>{storage}</code>
      </div>
      <StateDisplay state={{ theme, fontSize }} />
    </PreviewCard>
  );
}

function ImmerPreview() {
  const [notifications, setNotifications] = useState(true);
  return (
    <PreviewCard title="8. Immer">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Write mutable-style updates
      </div>
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--text-muted)' }}>user.settings.notifications</span>
        <button 
          onClick={() => setNotifications(n => !n)}
          className={`w-8 h-4 rounded-full relative ${notifications ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <div className={`absolute w-3 h-3 bg-white rounded-full top-0.5 transition-all ${notifications ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>
      <StateDisplay state={{ 'user.settings.notifications': notifications }} />
    </PreviewCard>
  );
}

function SlicesPreview() {
  const [user, setUser] = useState<string | null>(null);
  const [cart, setCart] = useState<string[]>([]);
  
  return (
    <PreviewCard title="9. Store Slices">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Combine multiple slices
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-1.5 rounded" style={{ background: 'var(--bg-primary)' }}>
          <User size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>UserSlice:</span>
          {user ? (
            <span className="text-xs" style={{ color: 'var(--accent)' }}>{user}</span>
          ) : (
            <button onClick={() => setUser('Alice')} className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>Login</button>
          )}
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded" style={{ background: 'var(--bg-primary)' }}>
          <ShoppingCart size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>CartSlice:</span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cart.length} items</span>
          <button onClick={() => setCart(c => [...c, 'Item'])} className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>+Add</button>
        </div>
      </div>
      <StateDisplay state={{ user, items: cart.length }} />
    </PreviewCard>
  );
}

function TypeScriptPreview() {
  return (
    <PreviewCard title="10. Advanced TypeScript">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Master StateCreator types
      </div>
      <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>Full type inference</span></div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>StateCreator generics</span></div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>Middleware typing</span></div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>get() for current state</span></div>
      </div>
    </PreviewCard>
  );
}

function ContextPreview() {
  const [contextRenders, setContextRenders] = useState(0);
  const [zustandRenders, setZustandRenders] = useState(0);
  
  return (
    <PreviewCard title="11. Replacing Context">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Compare render performance
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Context</div>
          <div style={{ color: '#ef4444' }}>Renders: {contextRenders}</div>
          <button onClick={() => setContextRenders(r => r + 3)} className="text-xs mt-1 px-2 py-0.5 rounded" style={{ background: 'var(--border)' }}>Update</button>
        </div>
        <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Zustand</div>
          <div style={{ color: 'var(--accent)' }}>Renders: {zustandRenders}</div>
          <button onClick={() => setZustandRenders(r => r + 1)} className="text-xs mt-1 px-2 py-0.5 rounded" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>Update</button>
        </div>
      </div>
    </PreviewCard>
  );
}

function SubscribePreview() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const handleChange = () => {
    setLogs(l => [...l.slice(-3), `State changed @ ${new Date().toLocaleTimeString()}`]);
  };
  
  return (
    <PreviewCard title="12. External Subscribe">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Subscribe outside React
      </div>
      <button onClick={handleChange} className="w-full px-2 py-1 rounded text-xs mb-2" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
        Trigger Change
      </button>
      <div className="text-xs p-2 rounded max-h-16 overflow-y-auto" style={{ background: 'var(--bg-tertiary)' }}>
        {logs.map((l, i) => <div key={i} style={{ color: 'var(--text-secondary)' }}>{l}</div>)}
        {logs.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Listening for changes...</div>}
      </div>
    </PreviewCard>
  );
}

function DynamicPreview() {
  const [forms, setForms] = useState<{ id: number; value: string }[]>([]);
  
  return (
    <PreviewCard title="13. Dynamic Stores">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Create stores on-demand
      </div>
      <button 
        onClick={() => setForms(f => [...f, { id: Date.now(), value: '' }])}
        className="w-full px-2 py-1 rounded text-xs mb-2"
        style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
      >
        + Create Form Store
      </button>
      <div className="space-y-1 max-h-20 overflow-y-auto">
        {forms.map((f, idx) => (
          <div key={f.id} className="flex items-center gap-1">
            <input 
              value={f.value}
              onChange={(e) => setForms(fs => fs.map(x => x.id === f.id ? { ...x, value: e.target.value } : x))}
              placeholder={`Store #${idx + 1}`}
              className="flex-1 px-2 py-0.5 rounded text-xs"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <button onClick={() => setForms(fs => fs.filter(x => x.id !== f.id))} className="text-xs" style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>
        ))}
      </div>
    </PreviewCard>
  );
}

// Lesson 14: Isolated Stores Preview
function IsolatedStoresPreview() {
  const [products] = useState(['Laptop', 'Phone', 'Tablet']);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<string[]>([]);
  
  return (
    <PreviewCard title="14. Isolated Stores">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Each MFE has its own separate store
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Product MFE */}
        <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent)' }}>
          <div className="text-xs mb-1 font-medium" style={{ color: 'var(--accent)' }}>📦 Product MFE</div>
          <div className="space-y-1">
            {products.map(p => (
              <button
                key={p}
                onClick={() => setSelectedProduct(p)}
                className="w-full text-left px-1 py-0.5 rounded text-xs"
                style={{
                  background: selectedProduct === p ? 'var(--accent)' : 'transparent',
                  color: selectedProduct === p ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {/* Cart MFE */}
        <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
          <div className="text-xs mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>🛒 Cart MFE</div>
          <div className="text-xs space-y-0.5">
            {cartItems.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>Empty cart</div>
            ) : (
              cartItems.map((item, i) => (
                <div key={i} style={{ color: 'var(--text-secondary)' }}>• {item}</div>
              ))
            )}
          </div>
          {selectedProduct && (
            <button
              onClick={() => setCartItems(c => [...c, selectedProduct])}
              className="w-full mt-1 px-1 py-0.5 rounded text-xs"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
      <StateDisplay state={{ productStore: { selected: selectedProduct }, cartStore: { items: cartItems } }} />
    </PreviewCard>
  );
}

// Lesson 15: Shared State Preview
function SharedStatePreview() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const login = () => {
    setUser({ name: 'Alice' });
    setToken('jwt-token-123');
  };
  
  const logout = () => {
    setUser(null);
    setToken(null);
  };
  
  return (
    <PreviewCard title="15. Shared State">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Auth store shared across all MFEs
      </div>
      {/* Auth Controls */}
      <div className="p-2 rounded mb-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent)' }}>
        <div className="text-xs mb-1 font-medium" style={{ color: 'var(--accent)' }}>🔐 Shared Auth Store</div>
        <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
          User: {user ? user.name : 'Not logged in'}
        </div>
        {user ? (
          <button onClick={logout} className="w-full px-2 py-1 rounded text-xs" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            Logout
          </button>
        ) : (
          <button onClick={login} className="w-full px-2 py-1 rounded text-xs" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
            Login as Alice
          </button>
        )}
      </div>
      {/* MFEs using shared state */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded text-xs" style={{ background: 'var(--bg-tertiary)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Header MFE</div>
          <div style={{ color: user ? 'var(--accent)' : 'var(--text-muted)' }}>
            {user ? `👤 ${user.name}` : '👤 Guest'}
          </div>
        </div>
        <div className="p-2 rounded text-xs" style={{ background: 'var(--bg-tertiary)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Profile MFE</div>
          <div style={{ color: user ? 'var(--accent)' : 'var(--text-muted)' }}>
            {user ? '✓ Authorized' : '✕ No access'}
          </div>
        </div>
      </div>
      <StateDisplay state={{ user, token: token ? '***' : null }} />
    </PreviewCard>
  );
}

// Lesson 16: Event Bus Preview
function EventBusPreview() {
  const [events, setEvents] = useState<{ type: string; payload: string; time: string }[]>([]);
  
  const publish = (type: string, payload: string) => {
    const newEvent = {
      type,
      payload,
      time: new Date().toLocaleTimeString(),
    };
    setEvents(e => [...e.slice(-4), newEvent]);
  };
  
  return (
    <PreviewCard title="16. Event Bus">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        MFEs communicate via events
      </div>
      {/* Publishers */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          onClick={() => publish('cart:updated', 'Item added')}
          className="p-2 rounded text-xs"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent)', color: 'var(--text-secondary)' }}
        >
          🛒 Publish<br/>cart:updated
        </button>
        <button
          onClick={() => publish('user:login', 'Alice')}
          className="p-2 rounded text-xs"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          👤 Publish<br/>user:login
        </button>
      </div>
      {/* Event Log */}
      <div className="p-2 rounded text-xs max-h-20 overflow-y-auto" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
        <div className="mb-1" style={{ color: 'var(--text-muted)' }}>⚡ Event Log:</div>
        {events.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No events yet</div>
        ) : (
          events.map((e, i) => (
            <div key={i} style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent)' }}>{e.type}</span>: {e.payload}
            </div>
          ))
        )}
      </div>
      <StateDisplay state={{ events: events.length, listeners: ['cart:updated', 'user:login'] }} />
    </PreviewCard>
  );
}

// Lesson 17: Initialization Preview
function InitializationPreview() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<{ theme: string; apiUrl: string } | null>(null);
  
  const initialize = async () => {
    if (initialized || loading) return;
    setLoading(true);
    // Simulate async config fetch
    await new Promise(r => setTimeout(r, 800));
    setConfig({ theme: 'dark', apiUrl: 'https://api.example.com' });
    setInitialized(true);
    setLoading(false);
  };
  
  const reset = () => {
    setInitialized(false);
    setConfig(null);
  };
  
  return (
    <PreviewCard title="17. Initialization">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Coordinate MFE startup
      </div>
      {/* Status */}
      <div className="p-2 rounded mb-2 text-center" style={{ background: 'var(--bg-tertiary)' }}>
        {loading ? (
          <>
            <div className="text-lg">⏳</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading config...</div>
          </>
        ) : initialized ? (
          <>
            <div className="text-lg">✅</div>
            <div className="text-xs" style={{ color: 'var(--accent)' }}>MFE Ready!</div>
          </>
        ) : (
          <>
            <div className="text-lg">⚪</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Not initialized</div>
          </>
        )}
      </div>
      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={initialize}
          disabled={initialized || loading}
          className="flex-1 px-2 py-1 rounded text-xs"
          style={{
            background: initialized || loading ? 'var(--bg-tertiary)' : 'var(--accent)',
            color: initialized || loading ? 'var(--text-muted)' : 'var(--bg-primary)'
          }}
        >
          {loading ? 'Loading...' : initialized ? 'Ready' : 'Initialize'}
        </button>
        {initialized && (
          <button
            onClick={reset}
            className="px-2 py-1 rounded text-xs"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            Reset
          </button>
        )}
      </div>
      <StateDisplay state={{ initialized, config }} />
    </PreviewCard>
  );
}

function TestingPreview() {
  const [tests, setTests] = useState([
    { name: 'increment()', pass: null as boolean | null },
    { name: 'decrement()', pass: null as boolean | null },
    { name: 'reset()', pass: null as boolean | null },
  ]);
  
  const runTests = () => {
    setTests(ts => ts.map(t => ({ ...t, pass: true })));
  };
  
  return (
    <PreviewCard title="18. Testing Stores">
      <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
        Test actions with getState()
      </div>
      <div className="space-y-1 mb-2">
        {tests.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`w-4 h-4 rounded flex items-center justify-center text-white ${t.pass === null ? 'bg-gray-600' : t.pass ? 'bg-green-500' : 'bg-red-500'}`} style={{ fontSize: '10px' }}>
              {t.pass === null ? '○' : '✓'}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{t.name}</span>
          </div>
        ))}
      </div>
      <button onClick={runTests} className="w-full px-2 py-1 rounded text-xs" style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}>
        Run Tests
      </button>
    </PreviewCard>
  );
}

function BestPracticesPreview() {
  const practices = [
    {
      title: "Use TypeScript",
      description: "Define interfaces for stores to catch errors at compile time.",
      useCase: "All production apps, team collaboration",
      sideEffect: "Slightly more code upfront, but prevents runtime bugs",
      do: true,
    },
    {
      title: "Use Selectors",
      description: "Subscribe only to the state slices you need with useStore(s => s.field).",
      useCase: "Components that read partial state",
      sideEffect: "Prevents unnecessary re-renders, improves performance",
      do: true,
    },
    {
      title: "Keep Stores Focused",
      description: "One store per domain/feature. Avoid monolithic stores.",
      useCase: "Apps with multiple features (auth, cart, settings)",
      sideEffect: "Better code organization, easier testing",
      do: true,
    },
    {
      title: "Use DevTools in Development",
      description: "Wrap stores with devtools() for time-travel debugging.",
      useCase: "Debugging state changes during development",
      sideEffect: "Small bundle size increase (can be tree-shaken in prod)",
      do: true,
    },
    {
      title: "Persist User Preferences",
      description: "Use persist() middleware for settings, themes, drafts.",
      useCase: "User preferences, form drafts, auth tokens",
      sideEffect: "localStorage/sessionStorage usage, need to handle migrations",
      do: true,
    },
    {
      title: "Clean Up Subscriptions",
      description: "Always call unsubscribe() when using store.subscribe() outside React.",
      useCase: "Analytics, logging, external integrations",
      sideEffect: "Memory leaks if not cleaned up",
      do: true,
    },
    {
      title: "Avoid Huge Monolithic Stores",
      description: "Don't put all app state in one store. Split by domain.",
      useCase: "N/A - Anti-pattern",
      sideEffect: "Poor performance, hard to maintain, testing nightmare",
      do: false,
    },
    {
      title: "Don't Subscribe Without Selector",
      description: "useStore() without selector re-renders on ANY state change.",
      useCase: "N/A - Anti-pattern",
      sideEffect: "Excessive re-renders, poor performance",
      do: false,
    },
    {
      title: "Don't Over-Engineer",
      description: "Simple state doesn't need Zustand. useState is fine for local state.",
      useCase: "N/A - Anti-pattern",
      sideEffect: "Unnecessary complexity, harder onboarding",
      do: false,
    },
  ];

  return (
    <div className="p-4 overflow-y-auto h-full" style={{ background: 'var(--bg-secondary)' }}>
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--accent)' }}>
          🎓 Zustand Best Practices
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Production-ready patterns for scalable state management
        </p>
      </div>
      
      {/* DO Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
          ✅ DO
        </h3>
        <div className="space-y-2">
          {practices.filter(p => p.do).map((practice, i) => (
            <div key={i} className="p-2 rounded" style={{ background: 'var(--bg-tertiary)', borderLeft: '2px solid var(--accent)' }}>
              <div className="font-medium text-xs mb-1" style={{ color: 'var(--text-primary)' }}>
                {practice.title}
              </div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                {practice.description}
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Use: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{practice.useCase}</span>
                </div>
              </div>
              <div className="text-xs mt-1">
                <span style={{ color: 'var(--text-muted)' }}>Note: </span>
                <span style={{ color: 'var(--accent)', opacity: 0.8 }}>{practice.sideEffect}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* DON'T Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#ef4444' }}>
          ❌ DON'T
        </h3>
        <div className="space-y-2">
          {practices.filter(p => !p.do).map((practice, i) => (
            <div key={i} className="p-2 rounded" style={{ background: 'var(--bg-tertiary)', borderLeft: '2px solid #ef4444' }}>
              <div className="font-medium text-xs mb-1" style={{ color: 'var(--text-primary)' }}>
                {practice.title}
              </div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                {practice.description}
              </div>
              <div className="text-xs mt-1">
                <span style={{ color: 'var(--text-muted)' }}>Risk: </span>
                <span style={{ color: '#ef4444', opacity: 0.8 }}>{practice.sideEffect}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* MFE Summary */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>
          🧩 MFE Architecture Summary
        </h3>
        <div className="p-2 rounded text-xs space-y-1" style={{ background: 'var(--bg-tertiary)' }}>
          <div><span style={{ color: 'var(--accent)' }}>Isolated:</span> <span style={{ color: 'var(--text-secondary)' }}>Each MFE creates its own store instance</span></div>
          <div><span style={{ color: 'var(--accent)' }}>Shared:</span> <span style={{ color: 'var(--text-secondary)' }}>Use Module Federation singleton for auth/config</span></div>
          <div><span style={{ color: 'var(--accent)' }}>Communication:</span> <span style={{ color: 'var(--text-secondary)' }}>Event bus pattern for decoupled messaging</span></div>
          <div><span style={{ color: 'var(--accent)' }}>Init:</span> <span style={{ color: 'var(--text-secondary)' }}>Coordinate startup with initialization guards</span></div>
        </div>
      </div>
      
      {/* Quick Reference */}
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>
          📚 Quick Reference
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Create Store</div>
            <code style={{ color: 'var(--accent)' }}>create((set) =&gt; ({'{...}'}))</code>
          </div>
          <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Use Selector</div>
            <code style={{ color: 'var(--accent)' }}>useStore(s =&gt; s.field)</code>
          </div>
          <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Outside React</div>
            <code style={{ color: 'var(--accent)' }}>useStore.getState()</code>
          </div>
          <div className="p-2 rounded" style={{ background: 'var(--bg-tertiary)' }}>
            <div style={{ color: 'var(--text-muted)' }}>Subscribe</div>
            <code style={{ color: 'var(--accent)' }}>useStore.subscribe(fn)</code>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lesson 7 Executed Preview - reactive localStorage display with real persist middleware
function Lesson7ExecutedPreview({ state, actions, store }: { state: Record<string, unknown>; actions: [string, unknown][]; store?: ReturnType<typeof import('zustand').create> }) {
  const [storageValue, setStorageValue] = useState('{}');
  const [liveState, setLiveState] = useState(state);
  
  // Parse localStorage and extract the state from Zustand's persist format
  const parseStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem('settings-store');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Zustand persist format: { state: {...}, version: 0 }
        if (parsed.state) {
          return JSON.stringify(parsed.state, null, 2);
        }
        return JSON.stringify(parsed, null, 2);
      }
    } catch { /* ignore */ }
    return '{}';
  }, []);
  
  // Subscribe to store changes
  useEffect(() => {
    if (!store) return;
    
    // Get initial state
    const currentState = store.getState() as Record<string, unknown>;
    setLiveState(currentState);
    setStorageValue(parseStorage());
    
    // Subscribe to changes and manually persist
    const unsubscribe = store.subscribe((newState: unknown) => {
      const state = newState as Record<string, unknown>;
      setLiveState(state);
      
      // Manually save to localStorage since persist middleware may not work in sandbox
      const theme = state.theme;
      const fontSize = state.fontSize;
      
      if (theme !== undefined && fontSize !== undefined) {
        const storageData = {
          state: { theme, fontSize },
          version: 0
        };
        const jsonString = JSON.stringify(storageData);
        
        // Write to localStorage
        window.localStorage.setItem('settings-store', jsonString);
        
        // Update display
        setTimeout(() => setStorageValue(parseStorage()), 10);
      }
    });
    
    return () => unsubscribe();
  }, [store, parseStorage]);
  
  // Also poll localStorage for external changes
  useEffect(() => {
    const interval = setInterval(() => setStorageValue(parseStorage()), 200);
    return () => clearInterval(interval);
  }, [parseStorage]);
  
  const theme = (liveState.theme ?? 'dark') as string;
  const fontSize = (liveState.fontSize ?? 14) as number;
  const setThemeAction = actions.find(([name]) => name === 'setTheme');
  const setFontSizeAction = actions.find(([name]) => name === 'setFontSize');
  
  // Helper to save to localStorage in Zustand persist format
  const saveToStorage = (stateValues: { theme: unknown; fontSize: unknown }) => {
    try {
      // Save in Zustand persist format
      const storageData = {
        state: stateValues,
        version: 0
      };
      const jsonData = JSON.stringify(storageData);
      localStorage.setItem('settings-store', jsonData);
      console.log('Saved to localStorage:', jsonData); // Debug log
      setTimeout(() => setStorageValue(parseStorage()), 10);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };
  
  const handleSetTheme = (t: string) => {
    // Call the store action - this updates the Zustand state
    if (setThemeAction) {
      (setThemeAction[1] as (t: string) => void)(t);
    }
    
    // Manually persist since persist middleware might not work in sandbox
    if (store) {
      setTimeout(() => {
        const currentState = store.getState() as Record<string, unknown>;
        const storageData = {
          state: { theme: currentState.theme, fontSize: currentState.fontSize },
          version: 0
        };
        window.localStorage.setItem('settings-store', JSON.stringify(storageData));
        setStorageValue(parseStorage());
      }, 50);
    }
  };
  
  const handleSetFontSize = (s: number) => {
    // Call the store action - this updates the Zustand state
    if (setFontSizeAction) {
      (setFontSizeAction[1] as (s: number) => void)(s);
    }
    // The persist middleware in the executed code should save to localStorage
    // Just update our display after a short delay
    setTimeout(() => setStorageValue(parseStorage()), 100);
  };
  
  return (
    <div className="space-y-3">
      <PreviewCard title="Your Persist Store" live>
        <div className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
          State auto-saves to localStorage!
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Theme:</span>
          <div className="flex rounded overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
            <button
              onClick={() => handleSetTheme('light')}
              className={`px-2 py-1 ${theme === 'light' ? 'bg-white/10' : ''}`}
            >
              <Sun size={12} style={{ color: theme === 'light' ? 'var(--accent)' : 'var(--text-muted)' }} />
            </button>
            <button
              onClick={() => handleSetTheme('dark')}
              className={`px-2 py-1 ${theme === 'dark' ? 'bg-white/10' : ''}`}
            >
              <Moon size={12} style={{ color: theme === 'dark' ? 'var(--accent)' : 'var(--text-muted)' }} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Font:</span>
          <div className="flex gap-1">
            {[12, 14, 16, 18].map(s => (
              <button 
                key={s} 
                onClick={() => handleSetFontSize(s)}
                className="px-1.5 py-0.5 rounded text-xs"
                style={{ 
                  background: fontSize === s ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: fontSize === s ? 'var(--bg-primary)' : 'var(--text-muted)'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs p-2 rounded" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-1 mb-1">
            <Database size={10} style={{ color: 'var(--accent)' }} />
            <span style={{ color: 'var(--text-muted)' }}>localStorage (settings-store):</span>
          </div>
          <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--accent)', margin: 0 }}>{storageValue}</pre>
        </div>
      </PreviewCard>
      <StoreStateDisplay state={liveState} />
    </div>
  );
}

// Helper components
function PreviewCard({ title, children, live }: { title: string; children: React.ReactNode; live?: boolean }) {
  return (
    <div className="rounded border" style={{ background: 'var(--bg-primary)', borderColor: live ? 'var(--accent)' : 'var(--border)' }}>
      <div className="px-2 py-1.5 border-b text-xs font-medium flex items-center justify-between" style={{ borderColor: 'var(--border)', color: live ? 'var(--accent)' : 'var(--text-muted)' }}>
        <span>{title}</span>
        {live && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live</span>}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function StateDisplay({ state }: { state: Record<string, unknown> }) {
  return (
    <div className="mt-3 pt-2 border-t text-xs" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-1 mb-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
        <span style={{ color: 'var(--text-muted)' }}>State</span>
      </div>
      <pre className="text-xs overflow-x-auto max-h-64" style={{ color: 'var(--text-secondary)', margin: 0 }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}
