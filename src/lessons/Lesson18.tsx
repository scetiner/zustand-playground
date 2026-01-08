import { CodeBlock, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { TestTube, CheckCircle, Bug } from 'lucide-react';

export function Lesson18() {
  const lesson = lessons.find((l) => l.id === 'lesson-18')!;

  const unitTestCode = `// Unit Testing Zustand Stores

// stores/counterStore.ts
import { create } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// counterStore.test.ts
import { useCounterStore } from './counterStore';

describe('counterStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it('should initialize with count 0', () => {
    const { count } = useCounterStore.getState();
    expect(count).toBe(0);
  });

  it('should increment count', () => {
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(1);
  });

  it('should decrement count', () => {
    useCounterStore.setState({ count: 5 });
    useCounterStore.getState().decrement();
    expect(useCounterStore.getState().count).toBe(4);
  });

  it('should reset count to 0', () => {
    useCounterStore.setState({ count: 10 });
    useCounterStore.getState().reset();
    expect(useCounterStore.getState().count).toBe(0);
  });
});`;

  const asyncTestCode = `// Testing Async Actions

// stores/userStore.ts
interface UserStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,
  fetchUser: async (id) => {
    set({ loading: true, error: null });
    try {
      const user = await api.getUser(id);
      set({ user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));

// userStore.test.ts
import { useUserStore } from './userStore';
import { api } from './api';

// Mock the API
jest.mock('./api');
const mockApi = api as jest.Mocked<typeof api>;

describe('userStore async actions', () => {
  beforeEach(() => {
    useUserStore.setState({
      user: null,
      loading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('should set loading state when fetching', async () => {
    mockApi.getUser.mockResolvedValue({ id: '1', name: 'John' });
    
    const fetchPromise = useUserStore.getState().fetchUser('1');
    
    // Check loading is true immediately
    expect(useUserStore.getState().loading).toBe(true);
    
    await fetchPromise;
    
    // Check loading is false after completion
    expect(useUserStore.getState().loading).toBe(false);
  });

  it('should set user on successful fetch', async () => {
    const mockUser = { id: '1', name: 'John' };
    mockApi.getUser.mockResolvedValue(mockUser);
    
    await useUserStore.getState().fetchUser('1');
    
    expect(useUserStore.getState().user).toEqual(mockUser);
    expect(useUserStore.getState().error).toBeNull();
  });

  it('should set error on failed fetch', async () => {
    mockApi.getUser.mockRejectedValue(new Error('Not found'));
    
    await useUserStore.getState().fetchUser('999');
    
    expect(useUserStore.getState().user).toBeNull();
    expect(useUserStore.getState().error).toBe('Not found');
  });
});`;

  const componentTestCode = `// Testing Components with Zustand

// React Testing Library approach
import { render, screen, fireEvent } from '@testing-library/react';
import { useCounterStore } from './stores/counterStore';
import { Counter } from './components/Counter';

// Reset store before each test
beforeEach(() => {
  useCounterStore.setState({ count: 0 });
});

describe('Counter component', () => {
  it('should display current count', () => {
    useCounterStore.setState({ count: 5 });
    
    render(<Counter />);
    
    expect(screen.getByText('Count: 5')).toBeInTheDocument();
  });

  it('should increment when button clicked', () => {
    render(<Counter />);
    
    fireEvent.click(screen.getByText('Increment'));
    
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
    expect(useCounterStore.getState().count).toBe(1);
  });

  it('should update when store changes externally', () => {
    render(<Counter />);
    
    // Simulate external store update
    useCounterStore.setState({ count: 100 });
    
    expect(screen.getByText('Count: 100')).toBeInTheDocument();
  });
});`;

  const mockStoreCode = `// Creating Mock Stores for Testing

// testUtils.ts
import { create, StateCreator, StoreApi, UseBoundStore } from 'zustand';

// Generic mock store creator
export function createMockStore<T>(
  initialState: Partial<T>,
  overrides: Partial<T> = {}
): UseBoundStore<StoreApi<T>> {
  return create<T>()(() => ({
    ...initialState,
    ...overrides,
  } as T));
}

// Usage in tests
// stores/__mocks__/userStore.ts
import { createMockStore } from '../../testUtils';

export const useUserStore = createMockStore({
  user: { id: '1', name: 'Test User' },
  loading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
});

// In test file
jest.mock('./stores/userStore');

describe('MyComponent', () => {
  it('should render with mocked user', () => {
    render(<MyComponent />);
    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
  });
});`;

  const integrationTestCode = `// Integration Testing Multiple Stores

// Testing store interactions
import { useUserStore } from './userStore';
import { useCartStore } from './cartStore';
import { useNotificationStore } from './notificationStore';

describe('Store Integration', () => {
  beforeEach(() => {
    // Reset all stores
    useUserStore.setState({ user: null, isAuthenticated: false });
    useCartStore.setState({ items: [] });
    useNotificationStore.setState({ notifications: [] });
  });

  it('should clear cart when user logs out', () => {
    // Setup: user is logged in with items in cart
    useUserStore.setState({ 
      user: { id: '1', name: 'John' }, 
      isAuthenticated: true 
    });
    useCartStore.setState({ 
      items: [{ id: 'p1', name: 'Product 1', quantity: 2 }] 
    });

    // Action: user logs out
    useUserStore.getState().logout();

    // Assert: cart is cleared
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useUserStore.getState().isAuthenticated).toBe(false);
  });

  it('should show notification when item added to cart', () => {
    useCartStore.getState().addItem({ 
      id: 'p1', 
      name: 'Widget', 
      price: 9.99 
    });

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications).toContainEqual(
      expect.objectContaining({
        type: 'success',
        message: expect.stringContaining('Widget'),
      })
    );
  });
});`;

  const subscriptionTestCode = `// Testing Store Subscriptions

describe('Store subscriptions', () => {
  it('should notify subscribers on state change', () => {
    const listener = jest.fn();
    
    // Subscribe to store
    const unsubscribe = useCounterStore.subscribe(listener);
    
    // Trigger state change
    useCounterStore.getState().increment();
    
    // Listener should be called with new and old state
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 }),
      expect.objectContaining({ count: 0 })
    );
    
    unsubscribe();
  });

  it('should not notify after unsubscribe', () => {
    const listener = jest.fn();
    
    const unsubscribe = useCounterStore.subscribe(listener);
    unsubscribe();
    
    useCounterStore.getState().increment();
    
    // Called once during subscribe setup, not after
    expect(listener).not.toHaveBeenCalled();
  });

  it('should support selective subscriptions', () => {
    const listener = jest.fn();
    
    // Subscribe only to count changes
    const unsubscribe = useCounterStore.subscribe(
      (state) => state.count,
      listener
    );
    
    useCounterStore.getState().increment();
    
    expect(listener).toHaveBeenCalledWith(1, 0);
    
    unsubscribe();
  });
});`;

  const testUtilsCode = `// Test Utilities for Zustand

// testUtils.ts
import { act } from '@testing-library/react';

// Reset multiple stores at once
export function resetStores(...stores: Array<{ setState: Function }>) {
  act(() => {
    stores.forEach((store) => {
      // Get initial state by creating fresh store
      const initialState = store.getState();
      store.setState(initialState, true);
    });
  });
}

// Wait for store to reach a certain state
export function waitForState<T>(
  store: { getState: () => T; subscribe: Function },
  predicate: (state: T) => boolean,
  timeout = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for state'));
    }, timeout);

    // Check immediately
    if (predicate(store.getState())) {
      clearTimeout(timer);
      resolve(store.getState());
      return;
    }

    // Subscribe and wait
    const unsubscribe = store.subscribe((state: T) => {
      if (predicate(state)) {
        clearTimeout(timer);
        unsubscribe();
        resolve(state);
      }
    });
  });
}

// Usage
it('should load user data', async () => {
  useUserStore.getState().fetchUser('1');
  
  const state = await waitForState(
    useUserStore,
    (s) => s.user !== null
  );
  
  expect(state.user.id).toBe('1');
});`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Testing Zustand Stores
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          Zustand stores are easy to test because they're just plain JavaScript. 
          You can test stores directly, test components that use stores, and verify 
          store interactions in integration tests.
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: <TestTube size={20} />,
              title: 'Unit Tests',
              description: 'Test store actions in isolation',
              color: 'cyber-green',
            },
            {
              icon: <CheckCircle size={20} />,
              title: 'Component Tests',
              description: 'Test UI with store state',
              color: 'cyber-blue',
            },
            {
              icon: <Bug size={20} />,
              title: 'Integration Tests',
              description: 'Test store interactions',
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

      {/* Unit Tests */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Unit Testing Stores
        </h2>
        <p className="text-obsidian-300 mb-4">
          Test store actions directly using <code className="text-cyber-yellow">getState()</code> 
          and <code className="text-cyber-yellow">setState()</code>. Reset state before each test.
        </p>
        <CodeBlock code={unitTestCode} filename="counterStore.test.ts" highlightLines={[24, 25, 26, 29, 30, 31, 34, 35, 36]} />
      </section>

      {/* Async Tests */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Testing Async Actions
        </h2>
        <p className="text-obsidian-300 mb-4">
          Mock external dependencies and test loading/error states for async actions.
        </p>
        <CodeBlock code={asyncTestCode} filename="userStore.test.ts" highlightLines={[31, 32, 33, 41, 42, 43, 46, 47, 48]} />
      </section>

      {/* Component Tests */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Testing Components
        </h2>
        <p className="text-obsidian-300 mb-4">
          Use React Testing Library to test components. Set store state before rendering 
          and verify component responds to state changes.
        </p>
        <CodeBlock code={componentTestCode} filename="Counter.test.tsx" highlightLines={[10, 11, 15, 16, 29, 30, 31]} />
      </section>

      {/* Mock Stores */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Creating Mock Stores
        </h2>
        <p className="text-obsidian-300 mb-4">
          Create mock stores for isolated component testing. Use Jest's module mocking.
        </p>
        <CodeBlock code={mockStoreCode} filename="mockStore.ts" highlightLines={[6, 7, 8, 9, 10, 11, 12, 13, 17, 18, 19, 20, 21, 22, 23]} />
      </section>

      {/* Integration Tests */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Integration Testing
        </h2>
        <p className="text-obsidian-300 mb-4">
          Test how multiple stores interact. Verify cross-store side effects.
        </p>
        <CodeBlock code={integrationTestCode} filename="integration.test.ts" highlightLines={[18, 19, 20, 21, 25, 26, 29, 30]} />
      </section>

      {/* Subscription Tests */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Testing Subscriptions
        </h2>
        <p className="text-obsidian-300 mb-4">
          Verify that subscriptions are called correctly when state changes.
        </p>
        <CodeBlock code={subscriptionTestCode} filename="subscription.test.ts" />
      </section>

      {/* Test Utilities */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Test Utilities
        </h2>
        <p className="text-obsidian-300 mb-4">
          Create helper functions for common testing patterns.
        </p>
        <CodeBlock code={testUtilsCode} filename="testUtils.ts" highlightLines={[6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20]} />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Reset store state before each test with setState()',
            'Use getState() to read state and call actions',
            'Mock external dependencies for async action tests',
            'Test components with React Testing Library',
            'Create mock stores for isolated component tests',
            'Integration tests verify cross-store interactions',
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

