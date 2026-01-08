// @ts-expect-error - Babel standalone doesn't have types
import * as Babel from '@babel/standalone';
import React from 'react';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStore = UseBoundStore<StoreApi<any>>;

export interface RunResult {
  success: boolean;
  store?: AnyStore;
  stores?: Record<string, AnyStore>; // For lessons with multiple stores
  storeState?: Record<string, unknown>;
  Component?: React.ComponentType;
  error?: string;
  logs: string[];
}

// Capture console logs
function createLogCapture() {
  const logs: string[] = [];
  return {
    logs,
    log: (...args: unknown[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    },
    error: (...args: unknown[]) => {
      logs.push(`[ERROR] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
    },
    warn: (...args: unknown[]) => {
      logs.push(`[WARN] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
    },
  };
}

// Transform TypeScript/JSX to plain JS
function transpileCode(code: string): string {
  // Remove TypeScript type annotations for basic cases
  let cleanCode = code
    // Remove import statements (we provide create via the sandbox)
    .replace(/^import\s+.*from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\s*$/gm, '')
    // Remove interface/type declarations (multiline)
    .replace(/^interface\s+\w+\s*\{[\s\S]*?\n\}/gm, '')
    .replace(/^type\s+\w+\s*=\s*[^;]+;/gm, '')
    // Remove generic type parameters from create<Type>
    .replace(/create<[^>]+>\(/g, 'create(')
    // Remove type annotations from variable declarations (const x: Type = ...)
    // Only match when followed by = and a letter (type name), not a number
    .replace(/(\bconst\s+\w+):\s*[A-Z]\w*(\[\])?\s*=/g, '$1 =')
    .replace(/(\blet\s+\w+):\s*[A-Z]\w*(\[\])?\s*=/g, '$1 =')
    .replace(/(\bvar\s+\w+):\s*[A-Z]\w*(\[\])?\s*=/g, '$1 =')
    // Remove type annotations from function parameters (word: Type)
    // Be careful not to match object properties like count: 0
    .replace(/\((\w+):\s*[A-Z]\w*\)/g, '($1)')
    .replace(/\((\w+):\s*[A-Z]\w*,/g, '($1,')
    .replace(/,\s*(\w+):\s*[A-Z]\w*\)/g, ', $1)')
    .replace(/,\s*(\w+):\s*[A-Z]\w*,/g, ', $1,')
    // Remove Promise<void> and similar return types
    .replace(/\):\s*Promise<[^>]+>\s*=>/g, ') =>')
    .replace(/\):\s*[A-Z]\w*\s*=>/g, ') =>')
    .replace(/\):\s*[A-Z]\w*\s*\{/g, ') {')
    // Remove 'as Type' assertions
    .replace(/\s+as\s+[A-Z]\w*/g, '')
    // Remove export keywords
    .replace(/^export\s+/gm, '')
    // Remove import type
    .replace(/import\s+type\s+[^;]+;/g, '')
    // Handle Record<string, string> and similar
    .replace(/Record<[^>]+>/g, 'object')
    // Clean up empty lines
    .replace(/^\s*\n/gm, '');

  // Don't use Babel transform - just return cleaned code
  return cleanCode;
}

// Execute user code and extract store
export function runCode(code: string): RunResult {
  const logCapture = createLogCapture();
  
  try {
    // Transpile the code
    const transpiledCode = transpileCode(code);
    
    // Create a sandboxed execution context
    const sandbox = {
      create,
      persist,
      createJSONStorage,
      devtools,
      immer,
      localStorage,
      console: {
        log: logCapture.log,
        error: logCapture.error,
        warn: logCapture.warn,
        assert: (condition: boolean, ...args: unknown[]) => {
          if (!condition) {
            logCapture.error('Assertion failed:', ...args);
          }
        },
      },
      setTimeout,
      Promise,
      // Provide a way to expose the store
      __exposedStore__: null as AnyStore | null,
    };

    // Wrap the code to capture the store AND component
    const wrappedCode = `
      ${transpiledCode}
      
      // Collect results
      var __result__ = { store: null, stores: null, Component: null };
      
      // Check for multiple stores (lesson 14 - Isolated stores)
      if (typeof useProductStore !== 'undefined' && typeof useCartStore !== 'undefined') {
        __result__.stores = {
          product: useProductStore,
          cart: useCartStore,
        };
        __result__.store = useProductStore; // Primary store fallback
      }
      // Try to find and expose the store
      else if (typeof useStore !== 'undefined') {
        __result__.store = useStore;
      } else if (typeof useCounterStore !== 'undefined') {
        __result__.store = useCounterStore;
      } else if (typeof useBearStore !== 'undefined') {
        __result__.store = useBearStore;
      } else if (typeof useTodoStore !== 'undefined') {
        __result__.store = useTodoStore;
      } else if (typeof useUserStore !== 'undefined') {
        __result__.store = useUserStore;
      } else if (typeof useThemeStore !== 'undefined') {
        __result__.store = useThemeStore;
      } else if (typeof useAppStore !== 'undefined') {
        __result__.store = useAppStore;
      } else if (typeof useEventBus !== 'undefined') {
        __result__.store = useEventBus;
      } else if (typeof useProductStore !== 'undefined') {
        __result__.store = useProductStore;
      } else if (typeof useCartStore !== 'undefined') {
        __result__.store = useCartStore;
      } else if (typeof useAuthStore !== 'undefined') {
        __result__.store = useAuthStore;
      } else if (typeof useLoginForm !== 'undefined') {
        __result__.store = useLoginForm;
      } else if (typeof useSettingsStore !== 'undefined') {
        __result__.store = useSettingsStore;
      }
      
      // Try to find a component to render
      if (typeof Counter !== 'undefined') {
        __result__.Component = Counter;
      } else if (typeof App !== 'undefined') {
        __result__.Component = App;
      } else if (typeof Demo !== 'undefined') {
        __result__.Component = Demo;
      } else if (typeof Example !== 'undefined') {
        __result__.Component = Example;
      }
      
      return __result__;
    `;

    // Execute in sandbox - don't pre-declare variables
    const fn = new Function(
      'create',
      'persist',
      'createJSONStorage',
      'devtools',
      'immer',
      'localStorage',
      'console',
      'setTimeout',
      'Promise',
      'React',
      wrappedCode
    );

    const result = fn(
      sandbox.create,
      sandbox.persist,
      sandbox.createJSONStorage,
      sandbox.devtools,
      sandbox.immer,
      sandbox.localStorage,
      sandbox.console,
      sandbox.setTimeout,
      sandbox.Promise,
      React
    );

    const store = result?.store;
    const stores = result?.stores;
    const Component = result?.Component;

    // Handle multiple stores (lesson 14 - Isolated stores)
    if (stores && Object.keys(stores).length > 0) {
      const combinedState: Record<string, unknown> = {};
      for (const [key, s] of Object.entries(stores)) {
        if (s && typeof (s as AnyStore).getState === 'function') {
          combinedState[key] = (s as AnyStore).getState();
        }
      }
      logCapture.log('Multiple stores created:', JSON.stringify(combinedState, null, 2));
      
      return {
        success: true,
        store,
        stores: stores as Record<string, AnyStore>,
        storeState: combinedState,
        Component,
        logs: logCapture.logs,
      };
    }

    if (store && typeof store.getState === 'function') {
      const state = store.getState();
      logCapture.log('Store created:', JSON.stringify(state, null, 2));
      
      return {
        success: true,
        store,
        storeState: state,
        Component,
        logs: logCapture.logs,
      };
    }

    if (Component) {
      logCapture.log('Component found');
      return {
        success: true,
        Component,
        logs: logCapture.logs,
      };
    }

    logCapture.log('Code executed (no store or component exposed)');
    return {
      success: true,
      logs: logCapture.logs,
    };

  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logCapture.error(error);
    
    return {
      success: false,
      error,
      logs: logCapture.logs,
    };
  }
}

// Extract store configuration from code for specific lesson types
export function extractStoreConfig(code: string, _lessonId: number): Record<string, unknown> | null {
  try {
    const result = runCode(code);
    if (result.success && result.storeState) {
      return result.storeState;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

