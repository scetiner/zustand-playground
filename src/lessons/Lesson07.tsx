import { useState, useEffect } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { HardDrive, RefreshCw, Trash2 } from 'lucide-react';

// Demo store with persist
interface PreferencesStore {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: number) => void;
  setLanguage: (lang: string) => void;
  toggleNotification: (type: 'email' | 'push' | 'sms') => void;
  resetToDefaults: () => void;
}

const defaultState = {
  theme: 'dark' as const,
  fontSize: 16,
  language: 'en',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
};

const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...defaultState,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLanguage: (language) => set({ language }),
      toggleNotification: (type) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [type]: !state.notifications[type],
          },
        })),
      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function Lesson07() {
  const lesson = lessons.find((l) => l.id === 'lesson-7')!;
  const [showHint, setShowHint] = useState(false);
  const [storageValue, setStorageValue] = useState<string>('');
  
  const store = usePreferencesStore();

  // Read localStorage value for display
  useEffect(() => {
    const value = localStorage.getItem('user-preferences');
    setStorageValue(value || 'null');
  }, [store]);

  const refreshStorageValue = () => {
    const value = localStorage.getItem('user-preferences');
    setStorageValue(value || 'null');
  };

  const basicPersistCode = `import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsStore {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'app-settings', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);`;

  const storageOptionsCode = `// Different storage backends
import { persist, createJSONStorage } from 'zustand/middleware';

// localStorage (default)
persist(storeCreator, {
  name: 'my-store',
  storage: createJSONStorage(() => localStorage),
});

// sessionStorage (cleared when tab closes)
persist(storeCreator, {
  name: 'my-store',
  storage: createJSONStorage(() => sessionStorage),
});

// Custom async storage (e.g., IndexedDB, AsyncStorage)
const customStorage = {
  getItem: async (name) => {
    const value = await indexedDB.get(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await indexedDB.set(name, value);
  },
  removeItem: async (name) => {
    await indexedDB.delete(name);
  },
};

persist(storeCreator, {
  name: 'my-store',
  storage: createJSONStorage(() => customStorage),
});`;

  const partializeCode = `// Only persist specific parts of state
const useStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      preferences: { theme: 'dark' },
      tempData: [],  // Don't persist this
      
      // Actions...
    }),
    {
      name: 'user-store',
      // Only persist user and preferences, not token or tempData
      partialize: (state) => ({
        user: state.user,
        preferences: state.preferences,
      }),
    }
  )
);`;

  const migrationCode = `// Handle state migrations when schema changes
const useStore = create(
  persist(
    (set) => ({
      version: 2,  // Current version
      user: { name: '', email: '', role: 'user' },
    }),
    {
      name: 'user-store',
      version: 2,  // Storage version
      
      migrate: (persistedState, version) => {
        // Migration from v0 to v1
        if (version === 0) {
          persistedState.user = {
            name: persistedState.username || '',
            email: '',
            role: 'user',
          };
          delete persistedState.username;
        }
        
        // Migration from v1 to v2
        if (version < 2) {
          persistedState.user.role = 'user';
        }
        
        return persistedState;
      },
    }
  )
);`;

  const hydrationCode = `// Handle hydration (when persisted state loads)
const useStore = create(
  persist(
    (set) => ({ /* state */ }),
    {
      name: 'my-store',
      
      // Called when hydration starts
      onRehydrateStorage: (state) => {
        console.log('Hydration starting...');
        
        // Return function called when hydration finishes
        return (state, error) => {
          if (error) {
            console.error('Hydration failed:', error);
          } else {
            console.log('Hydration finished:', state);
          }
        };
      },
    }
  )
);

// Check hydration status in components
function App() {
  const hasHydrated = useStore.persist.hasHydrated();
  
  if (!hasHydrated) {
    return <LoadingScreen />;
  }
  
  return <MainApp />;
}

// Or wait for hydration
useEffect(() => {
  const unsubFinishHydration = useStore.persist
    .onFinishHydration(() => {
      console.log('Hydration complete!');
    });
    
  return unsubFinishHydration;
}, []);`;

  const clearStorage = () => {
    localStorage.removeItem('user-preferences');
    refreshStorageValue();
    // Force rehydration by reloading the store state
    usePreferencesStore.persist.clearStorage();
  };

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Persisting State Across Sessions
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          The <code className="text-cyber-yellow">persist</code> middleware automatically saves 
          your store state to storage (localStorage, sessionStorage, or custom backends) and 
          rehydrates it when the app loads. Essential for user preferences, draft data, and 
          offline-first features.
        </p>
        
        <div className="p-4 rounded-lg bg-cyber-green/10 border border-cyber-green/30 flex items-start gap-3">
          <HardDrive size={20} className="text-cyber-green flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-obsidian-200">
              <strong className="text-cyber-green">Perfect for MFEs:</strong> Each micro frontend 
              can have its own persisted store with a unique key, avoiding conflicts.
            </p>
          </div>
        </div>
      </section>

      {/* Basic Setup */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Basic Persist Setup
        </h2>
        <p className="text-obsidian-300 mb-4">
          Wrap your store with <code className="text-cyber-yellow">persist()</code> and provide 
          a unique name for the storage key.
        </p>
        <CodeBlock code={basicPersistCode} filename="basic-persist.ts" highlightLines={[9, 10, 15, 16, 17]} />
      </section>

      {/* Interactive Example */}
      <section className="mb-10">
        <InteractivePanel
          title="Persisted Preferences"
          description="Change settings and refresh the page - they'll persist!"
          onReset={() => {
            store.resetToDefaults();
            setTimeout(refreshStorageValue, 100);
          }}
          hint="Change some settings, then refresh the browser. Your preferences will be restored from localStorage!"
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Theme */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-3">Theme</p>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        store.setTheme(t);
                        setTimeout(refreshStorageValue, 100);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                        store.theme === t
                          ? 'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30'
                          : 'bg-obsidian-700 text-obsidian-300 hover:text-obsidian-100'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-obsidian-400 uppercase tracking-wider">Font Size</p>
                  <span className="text-cyber-yellow font-mono">{store.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={store.fontSize}
                  onChange={(e) => {
                    store.setFontSize(Number(e.target.value));
                    setTimeout(refreshStorageValue, 100);
                  }}
                  className="w-full accent-cyber-yellow"
                />
              </div>

              {/* Language */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-3">Language</p>
                <select
                  value={store.language}
                  onChange={(e) => {
                    store.setLanguage(e.target.value);
                    setTimeout(refreshStorageValue, 100);
                  }}
                  className="w-full px-3 py-2 bg-obsidian-700 border border-obsidian-600 rounded-lg text-obsidian-100 focus:outline-none focus:border-cyber-yellow"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              {/* Notifications */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-3">
                  Notifications
                </p>
                <div className="space-y-2">
                  {(['email', 'push', 'sms'] as const).map((type) => (
                    <label
                      key={type}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-obsidian-200 capitalize">{type}</span>
                      <button
                        onClick={() => {
                          store.toggleNotification(type);
                          setTimeout(refreshStorageValue, 100);
                        }}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          store.notifications[type]
                            ? 'bg-cyber-green'
                            : 'bg-obsidian-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            store.notifications[type]
                              ? 'translate-x-5'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              {/* Storage Actions */}
              <div className="flex gap-2">
                <button
                  onClick={refreshStorageValue}
                  className="flex items-center gap-2 px-3 py-2 bg-obsidian-700 text-obsidian-300 text-sm rounded-lg hover:text-obsidian-100 transition-colors"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
                <button
                  onClick={clearStorage}
                  className="flex items-center gap-2 px-3 py-2 bg-cyber-red/20 text-cyber-red text-sm rounded-lg hover:bg-cyber-red/30 transition-colors"
                >
                  <Trash2 size={14} />
                  Clear Storage
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <StateInspector
                state={{
                  theme: store.theme,
                  fontSize: store.fontSize,
                  language: store.language,
                  notifications: store.notifications,
                }}
                title="Preferences State"
              />

              {/* Raw localStorage */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-2">
                  localStorage["user-preferences"]
                </p>
                <pre className="text-xs font-mono text-obsidian-300 overflow-x-auto whitespace-pre-wrap break-all">
                  {storageValue}
                </pre>
              </div>
            </div>
          </div>
        </InteractivePanel>
      </section>

      {/* Storage Options */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Storage Backends
        </h2>
        <p className="text-obsidian-300 mb-4">
          Use different storage backends depending on your needs. You can even create 
          custom async storage for IndexedDB or React Native's AsyncStorage.
        </p>
        <CodeBlock code={storageOptionsCode} filename="storage-backends.ts" />
      </section>

      {/* Partialize */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Selective Persistence
        </h2>
        <p className="text-obsidian-300 mb-4">
          Don't persist everything! Use <code className="text-cyber-yellow">partialize</code> to 
          save only specific parts of your state. Never persist sensitive data like tokens.
        </p>
        <CodeBlock code={partializeCode} filename="partialize.ts" highlightLines={[15, 16, 17, 18]} />
      </section>

      {/* Migrations */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          State Migrations
        </h2>
        <p className="text-obsidian-300 mb-4">
          When your state schema changes, use migrations to transform old persisted data 
          to the new format without breaking existing users.
        </p>
        <CodeBlock code={migrationCode} filename="migrations.ts" highlightLines={[10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]} />
      </section>

      {/* Hydration */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Handling Hydration
        </h2>
        <p className="text-obsidian-300 mb-4">
          Hydration is when persisted state loads into the store. Handle this properly to 
          avoid UI flashes or using default state before hydration completes.
        </p>
        <CodeBlock code={hydrationCode} filename="hydration.ts" />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Use persist() to automatically save and restore state',
            'Choose the right storage backend for your use case',
            'Use partialize to persist only necessary data',
            'Implement migrations for schema changes',
            'Handle hydration to avoid UI flashes',
            'Never persist sensitive data like auth tokens',
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

