import { useState } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';
import { Loader2 } from 'lucide-react';

// Simulated API
const fakeApi = {
  fetchUsers: (): Promise<User[]> =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve([
            { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
            { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'user' },
            { id: '3', name: 'Carol White', email: 'carol@example.com', role: 'user' },
          ]),
        1500
      )
    ),
  fetchUserById: (id: string): Promise<User> =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        if (id === 'error') reject(new Error('User not found'));
        resolve({ id, name: `User ${id}`, email: `user${id}@example.com`, role: 'user' });
      }, 1000)
    ),
  createUser: (user: Omit<User, 'id'>): Promise<User> =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ ...user, id: Date.now().toString() }), 1000)
    ),
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UsersStore {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  
  // Async actions
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  createUser: (user: Omit<User, 'id'>) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  selectedUser: null,
  isLoading: false,
  isCreating: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await fakeApi.fetchUsers();
      set({ users, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch users', 
        isLoading: false 
      });
    }
  },

  fetchUserById: async (id: string) => {
    set({ isLoading: true, error: null, selectedUser: null });
    try {
      const user = await fakeApi.fetchUserById(id);
      set({ selectedUser: user, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch user', 
        isLoading: false 
      });
    }
  },

  createUser: async (userData) => {
    set({ isCreating: true, error: null });
    try {
      const newUser = await fakeApi.createUser(userData);
      const { users } = get();
      set({ users: [...users, newUser], isCreating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create user', 
        isCreating: false 
      });
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => set({ 
    users: [], 
    selectedUser: null, 
    isLoading: false, 
    isCreating: false, 
    error: null 
  }),
}));

export function Lesson05() {
  const lesson = lessons.find((l) => l.id === 'lesson-5')!;
  const [showHint, setShowHint] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  
  const store = useUsersStore();

  const asyncPatternCode = `interface DataStore {
  data: Item[];
  isLoading: boolean;
  error: string | null;
  
  fetchData: () => Promise<void>;
}

const useDataStore = create<DataStore>((set) => ({
  data: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    // 1. Set loading state
    set({ isLoading: true, error: null });
    
    try {
      // 2. Perform async operation
      const data = await api.fetchData();
      
      // 3. Update state with data
      set({ data, isLoading: false });
    } catch (error) {
      // 4. Handle errors
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },
}));`;

  const optimisticUpdateCode = `// Optimistic updates for better UX
const useTaskStore = create((set, get) => ({
  tasks: [],
  
  toggleTask: async (id) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === id);
    
    // 1. Optimistically update UI
    set({
      tasks: tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    });
    
    try {
      // 2. Sync with server
      await api.updateTask(id, { completed: !task.completed });
    } catch (error) {
      // 3. Rollback on failure
      set({
        tasks: tasks.map(t =>
          t.id === id ? { ...t, completed: task.completed } : t
        ),
        error: 'Failed to update task',
      });
    }
  },
}));`;

  const abortControllerCode = `// Cancellable requests with AbortController
const useSearchStore = create((set) => {
  let abortController: AbortController | null = null;
  
  return {
    results: [],
    isSearching: false,
    
    search: async (query) => {
      // Cancel previous request
      abortController?.abort();
      abortController = new AbortController();
      
      set({ isSearching: true });
      
      try {
        const results = await api.search(query, {
          signal: abortController.signal,
        });
        set({ results, isSearching: false });
      } catch (error) {
        if (error.name !== 'AbortError') {
          set({ isSearching: false, error: error.message });
        }
      }
    },
  };
});`;

  const loadingStatesCode = `// Granular loading states for complex UIs
interface ComplexStore {
  // Separate loading states per operation
  isLoadingList: boolean;
  isLoadingDetails: boolean;
  isSubmitting: boolean;
  isDeleting: Record<string, boolean>; // Per-item loading
  
  // Actions with their own loading state
  fetchList: () => Promise<void>;
  fetchDetails: (id: string) => Promise<void>;
  submitForm: (data: FormData) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const useComplexStore = create<ComplexStore>((set) => ({
  isLoadingList: false,
  isLoadingDetails: false,
  isSubmitting: false,
  isDeleting: {},
  
  deleteItem: async (id) => {
    // Set loading for specific item
    set((state) => ({
      isDeleting: { ...state.isDeleting, [id]: true },
    }));
    
    try {
      await api.deleteItem(id);
      set((state) => ({
        items: state.items.filter(i => i.id !== id),
        isDeleting: { ...state.isDeleting, [id]: false },
      }));
    } catch (error) {
      set((state) => ({
        isDeleting: { ...state.isDeleting, [id]: false },
        error: error.message,
      }));
    }
  },
}));`;

  const handleCreateUser = async () => {
    if (newUserName.trim()) {
      await store.createUser({
        name: newUserName.trim(),
        email: `${newUserName.toLowerCase().replace(/\s/g, '')}@example.com`,
        role: 'user',
      });
      setNewUserName('');
    }
  };

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Async Pattern */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          The Standard Async Pattern
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          Zustand handles async actions naturally. Since actions are just functions, you can use 
          async/await directly. The key is managing loading and error states properly.
        </p>
        <CodeBlock code={asyncPatternCode} filename="async-pattern.ts" highlightLines={[15, 16, 19, 22, 25, 26, 27]} />
      </section>

      {/* Interactive Example */}
      <section className="mb-10">
        <InteractivePanel
          title="Async Actions Demo"
          description="Fetch data, handle loading states, and manage errors"
          onReset={store.reset}
          hint="Watch the state inspector to see loading and error states update in real-time during async operations."
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={store.fetchUsers}
                  disabled={store.isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-cyber-blue/20 text-cyber-blue rounded-lg hover:bg-cyber-blue/30 transition-colors disabled:opacity-50"
                >
                  {store.isLoading && <Loader2 size={16} className="animate-spin" />}
                  Fetch All Users
                </button>
                <button
                  onClick={() => store.fetchUserById('error')}
                  disabled={store.isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-cyber-red/20 text-cyber-red rounded-lg hover:bg-cyber-red/30 transition-colors disabled:opacity-50"
                >
                  Trigger Error
                </button>
              </div>

              {/* Create User */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="New user name"
                  className="flex-1 px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded-lg text-obsidian-100 placeholder-obsidian-500 focus:outline-none focus:border-cyber-yellow"
                />
                <button
                  onClick={handleCreateUser}
                  disabled={store.isCreating || !newUserName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-cyber-green/20 text-cyber-green rounded-lg hover:bg-cyber-green/30 transition-colors disabled:opacity-50"
                >
                  {store.isCreating && <Loader2 size={16} className="animate-spin" />}
                  Create
                </button>
              </div>

              {/* Error Display */}
              {store.error && (
                <div className="flex items-center justify-between p-3 bg-cyber-red/10 border border-cyber-red/30 rounded-lg">
                  <p className="text-cyber-red text-sm">{store.error}</p>
                  <button
                    onClick={store.clearError}
                    className="text-cyber-red hover:text-cyber-red/70 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Users List */}
              <div>
                <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-2">
                  Users ({store.users.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {store.isLoading && store.users.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 size={24} className="animate-spin text-cyber-yellow" />
                    </div>
                  ) : store.users.length === 0 ? (
                    <p className="text-obsidian-500 italic text-sm p-4 text-center">
                      No users loaded. Click "Fetch All Users" to load data.
                    </p>
                  ) : (
                    store.users.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 bg-obsidian-900 rounded-lg border border-obsidian-600"
                      >
                        <p className="text-obsidian-100 font-medium">{user.name}</p>
                        <p className="text-obsidian-400 text-sm">{user.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                          user.role === 'admin' 
                            ? 'bg-cyber-purple/20 text-cyber-purple' 
                            : 'bg-obsidian-700 text-obsidian-300'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <StateInspector
              state={{
                users: store.users,
                selectedUser: store.selectedUser,
                isLoading: store.isLoading,
                isCreating: store.isCreating,
                error: store.error,
              }}
              title="Users Store State"
            />
          </div>
        </InteractivePanel>
      </section>

      {/* Optimistic Updates */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Optimistic Updates
        </h2>
        <p className="text-obsidian-300 mb-4">
          For better UX, update the UI immediately and sync with the server in the background. 
          Roll back if the server request fails.
        </p>
        <CodeBlock code={optimisticUpdateCode} filename="optimistic-updates.ts" highlightLines={[9, 10, 11, 12, 13, 16, 19, 20, 21, 22]} />
      </section>

      {/* Cancellable Requests */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Cancellable Requests
        </h2>
        <p className="text-obsidian-300 mb-4">
          For search or typeahead features, cancel previous requests when a new one starts. 
          This prevents race conditions and stale data.
        </p>
        <CodeBlock code={abortControllerCode} filename="cancellable-requests.ts" highlightLines={[10, 11, 15, 16, 17, 21, 22]} />
      </section>

      {/* Granular Loading States */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Granular Loading States
        </h2>
        <p className="text-obsidian-300 mb-4">
          In enterprise apps, you often need separate loading states for different operations. 
          Use a loading state per action type, or per item for collections.
        </p>
        <CodeBlock code={loadingStatesCode} filename="loading-states.ts" />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Async actions are just regular functions with async/await',
            'Always manage loading and error states explicitly',
            'Use optimistic updates for better perceived performance',
            'Cancel pending requests to prevent race conditions',
            'Consider granular loading states for complex UIs',
            'Use get() to access current state in async operations',
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

