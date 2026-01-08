import { useState, useEffect } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';
import { Radio, Zap } from 'lucide-react';

// Demo store
interface AppStore {
  user: { id: string; name: string } | null;
  theme: 'light' | 'dark';
  notifications: string[];
  setUser: (user: { id: string; name: string } | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (message: string) => void;
  clearNotifications: () => void;
}

const useAppStore = create<AppStore>((set) => ({
  user: null,
  theme: 'dark',
  notifications: [],
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
  addNotification: (message) =>
    set((state) => ({ notifications: [...state.notifications, message] })),
  clearNotifications: () => set({ notifications: [] }),
}));

// Outside React subscription
const subscriptionLog: string[] = [];
useAppStore.subscribe((state, prevState) => {
  if (state.theme !== prevState.theme) {
    subscriptionLog.push(`Theme changed to: ${state.theme}`);
  }
  if (state.user?.id !== prevState.user?.id) {
    subscriptionLog.push(state.user ? `User logged in: ${state.user.name}` : 'User logged out');
  }
});

export function Lesson12() {
  const lesson = lessons.find((l) => l.id === 'lesson-12')!;
  const [showHint, setShowHint] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  
  const store = useAppStore();

  // Update log display
  useEffect(() => {
    const interval = setInterval(() => {
      setLog([...subscriptionLog].slice(-10));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const getStateCode = `import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  theme: 'dark',
  setUser: (user) => set({ user }),
}));

// Get current state OUTSIDE React
const currentUser = useStore.getState().user;
const currentTheme = useStore.getState().theme;

// Use in utility functions
function formatUserGreeting() {
  const { user, theme } = useStore.getState();
  
  if (!user) return 'Hello, Guest!';
  
  const emoji = theme === 'dark' ? '🌙' : '☀️';
  return \`\${emoji} Hello, \${user.name}!\`;
}

// Use in API interceptors
axios.interceptors.request.use((config) => {
  const { token } = useStore.getState();
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});`;

  const setStateCode = `// Set state from OUTSIDE React
import { useStore } from './store';

// Direct state update
useStore.setState({ theme: 'dark' });

// Function form for access to current state
useStore.setState((state) => ({
  count: state.count + 1,
}));

// Real-world example: WebSocket handler
socket.on('notification', (data) => {
  useStore.setState((state) => ({
    notifications: [...state.notifications, data],
  }));
});

// Event listener
document.addEventListener('visibilitychange', () => {
  useStore.setState({
    isTabVisible: document.visibilityState === 'visible',
  });
});

// Third-party library callback
analytics.onEvent((event) => {
  const { user } = useStore.getState();
  if (user) {
    analytics.identify(user.id);
  }
});`;

  const subscribeCode = `// Subscribe to state changes OUTSIDE React
const useStore = create((set) => ({
  theme: 'dark',
  user: null,
}));

// Basic subscription - fires on ANY state change
const unsubscribe = useStore.subscribe((state, prevState) => {
  console.log('State changed:', state);
});

// Later: clean up
unsubscribe();

// Selective subscription with selector
const unsubTheme = useStore.subscribe(
  (state) => state.theme,
  (theme, prevTheme) => {
    console.log('Theme changed:', prevTheme, '->', theme);
    document.body.className = theme;
  }
);

// Subscribe to user changes
const unsubUser = useStore.subscribe(
  (state) => state.user,
  (user) => {
    if (user) {
      analytics.identify(user.id);
    } else {
      analytics.reset();
    }
  }
);`;

  const realWorldPatternsCode = `// Real-World Patterns

// 1. Sync with localStorage
useStore.subscribe((state) => {
  localStorage.setItem('app-state', JSON.stringify({
    theme: state.theme,
    preferences: state.preferences,
  }));
});

// 2. Update document title
useStore.subscribe(
  (state) => state.notifications.length,
  (count) => {
    document.title = count > 0 
      ? \`(\${count}) My App\` 
      : 'My App';
  }
);

// 3. CSS custom properties
useStore.subscribe(
  (state) => state.theme,
  (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg-color', '#1a1a21');
      root.style.setProperty('--text-color', '#ffffff');
    } else {
      root.style.setProperty('--bg-color', '#ffffff');
      root.style.setProperty('--text-color', '#1a1a21');
    }
  }
);

// 4. Analytics tracking
useStore.subscribe(
  (state) => state.currentPage,
  (page) => {
    analytics.page(page);
  }
);

// 5. Service worker communication
useStore.subscribe((state) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'STATE_UPDATE',
      payload: { user: state.user },
    });
  }
});`;

  const cleanupPatternsCode = `// Cleanup Patterns

// Store subscriptions in a module
const subscriptions: (() => void)[] = [];

export function initializeSubscriptions() {
  // Theme sync
  subscriptions.push(
    useStore.subscribe(
      (s) => s.theme,
      (theme) => {
        document.body.dataset.theme = theme;
      }
    )
  );
  
  // User analytics
  subscriptions.push(
    useStore.subscribe(
      (s) => s.user,
      (user) => {
        if (user) analytics.identify(user.id);
      }
    )
  );
}

export function cleanupSubscriptions() {
  subscriptions.forEach((unsub) => unsub());
  subscriptions.length = 0;
}

// In your app entry point
initializeSubscriptions();

// On app unmount (if needed)
window.addEventListener('beforeunload', cleanupSubscriptions);`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Beyond React: Zustand Everywhere
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          Unlike Context, Zustand stores work outside React components. This is incredibly useful 
          for utility functions, API interceptors, WebSocket handlers, analytics, and more.
        </p>
        
        <div className="p-4 rounded-lg bg-cyber-purple/10 border border-cyber-purple/30 flex items-start gap-3">
          <Radio size={20} className="text-cyber-purple flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-obsidian-200">
              <strong className="text-cyber-purple">MFE Power:</strong> In micro frontends, external 
              subscriptions enable cross-app communication and state synchronization without React tree dependencies.
            </p>
          </div>
        </div>
      </section>

      {/* getState */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Reading State with getState()
        </h2>
        <p className="text-obsidian-300 mb-4">
          <code className="text-cyber-yellow">useStore.getState()</code> returns current state 
          synchronously. Perfect for utility functions and callbacks.
        </p>
        <CodeBlock code={getStateCode} filename="getState.ts" highlightLines={[9, 10, 15, 23, 24, 25, 26]} />
      </section>

      {/* setState */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Updating State with setState()
        </h2>
        <p className="text-obsidian-300 mb-4">
          <code className="text-cyber-yellow">useStore.setState()</code> updates state from anywhere. 
          Great for event handlers, WebSockets, and third-party integrations.
        </p>
        <CodeBlock code={setStateCode} filename="setState.ts" highlightLines={[5, 8, 9, 10, 14, 15, 16, 20, 21, 22, 23]} />
      </section>

      {/* Interactive Demo */}
      <section className="mb-10">
        <InteractivePanel
          title="External Subscriptions Demo"
          description="Watch state changes logged from outside React"
          onReset={() => {
            useAppStore.setState({
              user: null,
              theme: 'dark',
              notifications: [],
            });
            subscriptionLog.length = 0;
            setLog([]);
          }}
          hint="The subscription log is updated by code running outside React - it subscribes directly to the store and logs changes."
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* User Actions */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-3">
                  User Actions (triggers subscription)
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      store.setUser({ id: '1', name: 'Alice' })
                    }
                    className="px-3 py-1.5 text-sm bg-cyber-green/20 text-cyber-green rounded-lg hover:bg-cyber-green/30"
                  >
                    Login as Alice
                  </button>
                  <button
                    onClick={() => store.setUser(null)}
                    className="px-3 py-1.5 text-sm bg-cyber-red/20 text-cyber-red rounded-lg hover:bg-cyber-red/30"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Theme Actions */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-3">
                  Theme Toggle (triggers subscription)
                </p>
                <div className="flex gap-2">
                  {(['light', 'dark'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => store.setTheme(t)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        store.theme === t
                          ? 'bg-cyber-yellow/20 text-cyber-yellow'
                          : 'bg-obsidian-700 text-obsidian-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* External Subscription Log */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-cyber-purple/30">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-cyber-purple" />
                  <p className="text-xs text-cyber-purple uppercase tracking-wider">
                    External Subscription Log
                  </p>
                </div>
                <div className="space-y-1 font-mono text-xs max-h-32 overflow-y-auto">
                  {log.length === 0 ? (
                    <p className="text-obsidian-500 italic">No events logged yet...</p>
                  ) : (
                    log.map((entry, i) => (
                      <p key={i} className="text-obsidian-300">
                        <span className="text-cyber-purple">&gt;</span> {entry}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>

            <StateInspector
              state={{
                user: store.user,
                theme: store.theme,
                notificationCount: store.notifications.length,
              }}
              title="App Store State"
            />
          </div>
        </InteractivePanel>
      </section>

      {/* Subscribe */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Subscribing to Changes
        </h2>
        <p className="text-obsidian-300 mb-4">
          <code className="text-cyber-yellow">useStore.subscribe()</code> lets you react to state 
          changes outside React. Returns an unsubscribe function.
        </p>
        <CodeBlock code={subscribeCode} filename="subscribe.ts" highlightLines={[8, 9, 10, 16, 17, 18, 19, 20, 21, 24, 25, 26, 27, 28, 29, 30, 31]} />
      </section>

      {/* Real-World Patterns */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Real-World Subscription Patterns
        </h2>
        <p className="text-obsidian-300 mb-4">
          Common patterns for using external subscriptions in enterprise applications.
        </p>
        <CodeBlock code={realWorldPatternsCode} filename="patterns.ts" />
      </section>

      {/* Cleanup */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Cleanup Patterns
        </h2>
        <p className="text-obsidian-300 mb-4">
          Always clean up subscriptions when they're no longer needed to prevent memory leaks.
        </p>
        <CodeBlock code={cleanupPatternsCode} filename="cleanup.ts" highlightLines={[4, 7, 8, 9, 10, 11, 12, 13, 14, 24, 25, 26]} />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'getState() reads current state synchronously from anywhere',
            'setState() updates state from outside React',
            'subscribe() reacts to state changes outside React',
            'Use selectors with subscribe for targeted reactions',
            'Always clean up subscriptions to prevent memory leaks',
            'Perfect for utilities, WebSockets, analytics, and MFE communication',
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

