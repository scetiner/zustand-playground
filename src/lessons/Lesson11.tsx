import { useState, createContext, useContext, ReactNode } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';
import { ArrowRight, Zap } from 'lucide-react';

// Zustand store replacing context
interface ThemeStore {
  theme: 'light' | 'dark';
  primaryColor: string;
  fontSize: number;
  setTheme: (theme: 'light' | 'dark') => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: number) => void;
}

const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark',
  primaryColor: '#f0db4f',
  fontSize: 16,
  setTheme: (theme) => set({ theme }),
  setPrimaryColor: (primaryColor) => set({ primaryColor }),
  setFontSize: (fontSize) => set({ fontSize }),
}));

// Original Context implementation for comparison
interface ThemeContextValue {
  theme: 'light' | 'dark';
  primaryColor: string;
  fontSize: number;
  setTheme: (theme: 'light' | 'dark') => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [primaryColor, setPrimaryColor] = useState('#f0db4f');
  const [fontSize, setFontSize] = useState(16);

  return (
    <ThemeContext.Provider
      value={{ theme, primaryColor, fontSize, setTheme, setPrimaryColor, setFontSize }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within ThemeProvider');
  return context;
}

export function Lesson11() {
  const lesson = lessons.find((l) => l.id === 'lesson-11')!;
  const [showHint, setShowHint] = useState(false);
  const [activeDemo, setActiveDemo] = useState<'context' | 'zustand'>('zustand');
  
  const store = useThemeStore();

  const contextProblemsCode = `// Context API Problems

// 1. Provider Hell
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <UserProvider>
          <CartProvider>
            <NotificationProvider>
              <RouterProvider>
                <MainApp />
              </RouterProvider>
            </NotificationProvider>
          </CartProvider>
        </UserProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// 2. Re-render Issues - ALL consumers re-render on ANY change
const ThemeContext = createContext({
  theme: 'dark',
  fontSize: 16,
  language: 'en',
});

function ThemeToggle() {
  // This component re-renders when fontSize or language changes
  // even though it only uses theme!
  const { theme } = useContext(ThemeContext);
  return <button>{theme}</button>;
}

// 3. Can't Subscribe Outside React
// Context only works inside React components
// No way to use theme in utility functions`;

  const zustandSolutionCode = `// Zustand Solutions

// 1. No Providers Needed
import { create } from 'zustand';

const useThemeStore = create((set) => ({
  theme: 'dark',
  fontSize: 16,
  language: 'en',
  setTheme: (theme) => set({ theme }),
}));

// Just use it anywhere!
function App() {
  return <MainApp />;  // No wrapper needed
}

// 2. Surgical Re-renders with Selectors
function ThemeToggle() {
  // Only re-renders when theme changes
  const theme = useThemeStore((state) => state.theme);
  return <button>{theme}</button>;
}

function FontSizeDisplay() {
  // Only re-renders when fontSize changes
  const fontSize = useThemeStore((state) => state.fontSize);
  return <span>{fontSize}px</span>;
}

// 3. Use Anywhere - Inside or Outside React
// In a utility function
function getContrastColor() {
  const theme = useThemeStore.getState().theme;
  return theme === 'dark' ? '#ffffff' : '#000000';
}

// Subscribe to changes outside React
useThemeStore.subscribe((state) => {
  document.body.className = state.theme;
});`;

  const migrationGuideCode = `// Migration Guide: Context to Zustand

// BEFORE: Context Implementation
// ================================
interface AuthContextValue {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: Credentials) => {
    const user = await api.login(credentials);
    setUser(user);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}

// AFTER: Zustand Implementation
// ================================
interface AuthStore {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  
  login: async (credentials) => {
    const user = await api.login(credentials);
    set({ user });
  },
  
  logout: () => set({ user: null }),
}));

// Usage stays almost identical!
// Before: const { user, login } = useAuth();
// After:  const user = useAuthStore((s) => s.user);
//         const login = useAuthStore((s) => s.login);`;

  const performanceComparisonCode = `// Performance Comparison

// Context: O(n) re-renders
// When theme changes, ALL components using ThemeContext re-render
function ThemeProvider({ children }) {
  const [state, setState] = useState({
    theme: 'dark',
    fontSize: 16,
    language: 'en',
    // ... 10 more properties
  });
  
  // Every child with useContext(ThemeContext) re-renders
  // Even if they only use one property!
}

// Zustand: O(1) re-renders
// Only components subscribed to changed properties re-render
const useThemeStore = create((set) => ({
  theme: 'dark',
  fontSize: 16,
  language: 'en',
  // ... 10 more properties
}));

// When theme changes:
// - ThemeToggle re-renders (uses theme) ✓
// - FontDisplay doesn't re-render (uses fontSize) ✓
// - LanguageSelector doesn't re-render (uses language) ✓`;

  const whenToUseContextCode = `// When to Still Use Context

// 1. Dependency Injection (different implementations)
const ApiContext = createContext<ApiService>(defaultApi);

function App() {
  const api = useMemo(() => 
    isTest ? mockApi : realApi,
    [isTest]
  );
  
  return (
    <ApiContext.Provider value={api}>
      <MainApp />
    </ApiContext.Provider>
  );
}

// 2. Component-scoped state (modal, form)
const ModalContext = createContext<ModalState>(null);

function Modal({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

// 3. Third-party library integration
// Many libraries expect Context (React Router, React Query)

// Rule of thumb:
// - Global app state → Zustand
// - Component-scoped state → Context or local state
// - Dependency injection → Context`;

  const colors = ['#f0db4f', '#4dabf7', '#26de81', '#ff6b6b', '#a78bfa'];

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Why Replace Context with Zustand?
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          React Context is great for dependency injection and component-scoped state, but it has 
          significant drawbacks for global state management. Zustand solves these while keeping 
          a similar API.
        </p>

        <div className="grid grid-cols-3 gap-4">
          {[
            { problem: 'Provider Hell', solution: 'No providers needed' },
            { problem: 'All consumers re-render', solution: 'Surgical re-renders' },
            { problem: 'React-only', solution: 'Use anywhere' },
          ].map((item) => (
            <div key={item.problem} className="p-4 rounded-lg bg-obsidian-800 border border-obsidian-600">
              <p className="text-cyber-red text-sm mb-2">❌ {item.problem}</p>
              <div className="flex items-center gap-2 text-cyber-green text-sm">
                <ArrowRight size={14} />
                <span>✓ {item.solution}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Context Problems */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Context API Limitations
        </h2>
        <CodeBlock code={contextProblemsCode} filename="context-problems.tsx" highlightLines={[5, 6, 7, 8, 9, 10, 11, 27, 28, 29, 34, 35]} />
      </section>

      {/* Zustand Solution */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          How Zustand Solves These
        </h2>
        <CodeBlock code={zustandSolutionCode} filename="zustand-solution.tsx" highlightLines={[14, 19, 20, 25, 26, 32, 33, 34, 38, 39, 40]} />
      </section>

      {/* Interactive Comparison */}
      <section className="mb-10">
        <InteractivePanel
          title="Side-by-Side Comparison"
          description="Compare Context vs Zustand behavior"
          onReset={() => {
            useThemeStore.setState({
              theme: 'dark',
              primaryColor: '#f0db4f',
              fontSize: 16,
            });
          }}
          hint="With Context, changing ANY property re-renders ALL consumers. With Zustand, only components using the changed property re-render."
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="space-y-4">
            {/* Demo Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveDemo('zustand')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeDemo === 'zustand'
                    ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30'
                    : 'bg-obsidian-700 text-obsidian-300'
                }`}
              >
                <Zap size={16} />
                Zustand
              </button>
              <button
                onClick={() => setActiveDemo('context')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeDemo === 'context'
                    ? 'bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30'
                    : 'bg-obsidian-700 text-obsidian-300'
                }`}
              >
                Context API
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Controls */}
                <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                  <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-3">
                    Theme Controls
                  </p>
                  
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-obsidian-300">Theme</span>
                    <div className="flex gap-1">
                      {(['light', 'dark'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => store.setTheme(t)}
                          className={`px-3 py-1 text-sm rounded ${
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

                  {/* Color Picker */}
                  <div className="mb-4">
                    <span className="text-sm text-obsidian-300 block mb-2">Primary Color</span>
                    <div className="flex gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => store.setPrimaryColor(color)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            store.primaryColor === color
                              ? 'border-white scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-obsidian-300">Font Size</span>
                      <span className="text-cyber-yellow font-mono">{store.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={store.fontSize}
                      onChange={(e) => store.setFontSize(Number(e.target.value))}
                      className="w-full accent-cyber-yellow"
                    />
                  </div>
                </div>

                {/* Simulated Components */}
                <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                  <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-3">
                    Component Re-renders
                  </p>
                  
                  {activeDemo === 'zustand' ? (
                    <div className="space-y-2 text-sm">
                      <p className="text-obsidian-200">
                        <span className="text-cyber-green">ThemeToggle</span> - only re-renders when theme changes
                      </p>
                      <p className="text-obsidian-200">
                        <span className="text-cyber-green">ColorPicker</span> - only re-renders when color changes
                      </p>
                      <p className="text-obsidian-200">
                        <span className="text-cyber-green">FontSlider</span> - only re-renders when fontSize changes
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p className="text-obsidian-200">
                        <span className="text-cyber-red">ThemeToggle</span> - re-renders on ANY change
                      </p>
                      <p className="text-obsidian-200">
                        <span className="text-cyber-red">ColorPicker</span> - re-renders on ANY change
                      </p>
                      <p className="text-obsidian-200">
                        <span className="text-cyber-red">FontSlider</span> - re-renders on ANY change
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <StateInspector
                state={{
                  theme: store.theme,
                  primaryColor: store.primaryColor,
                  fontSize: store.fontSize,
                }}
                title="Theme Store"
              />
            </div>
          </div>
        </InteractivePanel>
      </section>

      {/* Migration Guide */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Migration Guide
        </h2>
        <p className="text-obsidian-300 mb-4">
          Migrating from Context to Zustand is straightforward. The API is similar, and you can 
          migrate one context at a time.
        </p>
        <CodeBlock code={migrationGuideCode} filename="migration-guide.tsx" />
      </section>

      {/* Performance Comparison */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Performance Impact
        </h2>
        <CodeBlock code={performanceComparisonCode} filename="performance.tsx" />
      </section>

      {/* When to Use Context */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          When to Still Use Context
        </h2>
        <p className="text-obsidian-300 mb-4">
          Context isn't bad—it's just not ideal for global state. It's still great for certain use cases.
        </p>
        <CodeBlock code={whenToUseContextCode} filename="when-context.tsx" />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Zustand eliminates Provider Hell - no wrappers needed',
            'Selectors enable surgical re-renders vs Context\'s all-or-nothing',
            'Zustand works outside React - utilities, services, subscriptions',
            'Migration is straightforward - similar API patterns',
            'Keep Context for dependency injection and component-scoped state',
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

