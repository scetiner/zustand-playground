import { useState } from 'react';
import { CodeBlock, StateInspector, InteractivePanel, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Edit3 } from 'lucide-react';

// Demo store with immer
interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  tasks: {
    id: string;
    title: string;
    done: boolean;
    assignee: { id: string; name: string } | null;
  }[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    tags: string[];
  };
}

interface ProjectStore {
  projects: Project[];
  addProject: (name: string) => void;
  updateProjectStatus: (id: string, status: Project['status']) => void;
  addTask: (projectId: string, title: string) => void;
  toggleTask: (projectId: string, taskId: string) => void;
  assignTask: (projectId: string, taskId: string, assignee: { id: string; name: string } | null) => void;
  addTag: (projectId: string, tag: string) => void;
  removeTag: (projectId: string, tag: string) => void;
  reset: () => void;
}

const initialProjects: Project[] = [
  {
    id: '1',
    name: 'MFE Migration',
    status: 'active',
    tasks: [
      { id: 't1', title: 'Set up Module Federation', done: true, assignee: { id: 'u1', name: 'Alice' } },
      { id: 't2', title: 'Migrate user store', done: false, assignee: null },
      { id: 't3', title: 'Testing integration', done: false, assignee: { id: 'u2', name: 'Bob' } },
    ],
    metadata: {
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
      tags: ['frontend', 'zustand', 'mfe'],
    },
  },
];

const useProjectStore = create<ProjectStore>()(
  immer((set) => ({
    projects: initialProjects,

    addProject: (name) =>
      set((state) => {
        // With immer, we can "mutate" directly!
        state.projects.push({
          id: Date.now().toString(),
          name,
          status: 'active',
          tasks: [],
          metadata: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: [],
          },
        });
      }),

    updateProjectStatus: (id, status) =>
      set((state) => {
        const project = state.projects.find((p) => p.id === id);
        if (project) {
          project.status = status;
          project.metadata.updatedAt = Date.now();
        }
      }),

    addTask: (projectId, title) =>
      set((state) => {
        const project = state.projects.find((p) => p.id === projectId);
        if (project) {
          project.tasks.push({
            id: Date.now().toString(),
            title,
            done: false,
            assignee: null,
          });
          project.metadata.updatedAt = Date.now();
        }
      }),

    toggleTask: (projectId, taskId) =>
      set((state) => {
        const project = state.projects.find((p) => p.id === projectId);
        const task = project?.tasks.find((t) => t.id === taskId);
        if (task) {
          task.done = !task.done;
          project!.metadata.updatedAt = Date.now();
        }
      }),

    assignTask: (projectId, taskId, assignee) =>
      set((state) => {
        const project = state.projects.find((p) => p.id === projectId);
        const task = project?.tasks.find((t) => t.id === taskId);
        if (task) {
          task.assignee = assignee;
          project!.metadata.updatedAt = Date.now();
        }
      }),

    addTag: (projectId, tag) =>
      set((state) => {
        const project = state.projects.find((p) => p.id === projectId);
        if (project && !project.metadata.tags.includes(tag)) {
          project.metadata.tags.push(tag);
          project.metadata.updatedAt = Date.now();
        }
      }),

    removeTag: (projectId, tag) =>
      set((state) => {
        const project = state.projects.find((p) => p.id === projectId);
        if (project) {
          const idx = project.metadata.tags.indexOf(tag);
          if (idx > -1) {
            project.metadata.tags.splice(idx, 1);
            project.metadata.updatedAt = Date.now();
          }
        }
      }),

    reset: () =>
      set((state) => {
        state.projects = initialProjects;
      }),
  }))
);

export function Lesson08() {
  const lesson = lessons.find((l) => l.id === 'lesson-8')!;
  const [showHint, setShowHint] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newTag, setNewTag] = useState('');
  
  const store = useProjectStore();
  const project = store.projects[0];

  const withoutImmerCode = `// Without Immer - deeply nested updates are painful
const useStore = create((set) => ({
  user: {
    profile: {
      settings: {
        notifications: {
          email: true,
          push: true
        }
      }
    }
  },
  
  toggleEmailNotifications: () => set((state) => ({
    user: {
      ...state.user,
      profile: {
        ...state.user.profile,
        settings: {
          ...state.user.profile.settings,
          notifications: {
            ...state.user.profile.settings.notifications,
            email: !state.user.profile.settings.notifications.email
          }
        }
      }
    }
  }))
}));`;

  const withImmerCode = `// With Immer - write mutable code, get immutable results!
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  immer((set) => ({
    user: {
      profile: {
        settings: {
          notifications: {
            email: true,
            push: true
          }
        }
      }
    },
    
    // So much cleaner!
    toggleEmailNotifications: () => set((state) => {
      state.user.profile.settings.notifications.email = 
        !state.user.profile.settings.notifications.email;
    })
  }))
);`;

  const arrayOperationsCode = `// Array operations with Immer
const useTaskStore = create(
  immer((set) => ({
    tasks: [],
    
    // Push to array
    addTask: (task) => set((state) => {
      state.tasks.push(task);
    }),
    
    // Remove from array
    removeTask: (id) => set((state) => {
      const idx = state.tasks.findIndex(t => t.id === id);
      if (idx > -1) state.tasks.splice(idx, 1);
    }),
    
    // Update item in array
    toggleTask: (id) => set((state) => {
      const task = state.tasks.find(t => t.id === id);
      if (task) task.done = !task.done;
    }),
    
    // Move item in array
    moveTask: (fromIdx, toIdx) => set((state) => {
      const [task] = state.tasks.splice(fromIdx, 1);
      state.tasks.splice(toIdx, 0, task);
    }),
  }))
);`;

  const combiningMiddlewareCode = `// Combining Immer with other middleware
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  devtools(
    persist(
      immer((set) => ({
        items: [],
        
        addItem: (item) => set((state) => {
          state.items.push(item);
        }, undefined, 'items/add'),
      })),
      { name: 'my-store' }
    ),
    { name: 'MyStore' }
  )
);

// Order matters! From innermost to outermost:
// 1. immer - transforms state updates
// 2. persist - saves to storage
// 3. devtools - logs to DevTools`;

  const performanceCode = `// Performance considerations
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Enable Map/Set support if needed
enableMapSet();

const useStore = create(
  immer((set) => ({
    items: new Map(),
    
    addItem: (key, value) => set((state) => {
      state.items.set(key, value);
    }),
    
    // For very large arrays, consider:
    // 1. Using Maps for O(1) lookups
    // 2. Batching updates
    // 3. Using normalized state shape
  }))
);

// Immer adds some overhead, but it's negligible for most apps.
// Only optimize if you measure actual performance issues.`;

  const assignees = [
    { id: 'u1', name: 'Alice' },
    { id: 'u2', name: 'Bob' },
    { id: 'u3', name: 'Carol' },
  ];

  const handleAddTask = () => {
    if (newTask.trim() && project) {
      store.addTask(project.id, newTask.trim());
      setNewTask('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && project) {
      store.addTag(project.id, newTag.trim());
      setNewTag('');
    }
  };

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Immer: Write Mutable, Get Immutable
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          Immer is a library that lets you write code that looks like direct mutation, but 
          produces immutable updates under the hood. When combined with Zustand, it dramatically 
          simplifies complex nested state updates.
        </p>
        
        <div className="p-4 rounded-lg bg-cyber-purple/10 border border-cyber-purple/30 flex items-start gap-3">
          <Edit3 size={20} className="text-cyber-purple flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-obsidian-200">
              <strong className="text-cyber-purple">How it works:</strong> Immer creates a draft 
              copy of your state. You "mutate" the draft, and Immer produces an immutable update 
              by comparing the draft to the original.
            </p>
          </div>
        </div>
      </section>

      {/* Without vs With Immer */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          The Difference Immer Makes
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-cyber-red mb-2">❌ Without Immer</p>
            <CodeBlock code={withoutImmerCode} filename="without-immer.ts" />
          </div>
          <div>
            <p className="text-sm text-cyber-green mb-2">✅ With Immer</p>
            <CodeBlock code={withImmerCode} filename="with-immer.ts" highlightLines={[18, 19, 20]} />
          </div>
        </div>
      </section>

      {/* Interactive Example */}
      <section className="mb-10">
        <InteractivePanel
          title="Nested State Updates with Immer"
          description="Update deeply nested state with simple 'mutations'"
          onReset={store.reset}
          hint="Notice how we can use push(), splice(), and direct property assignment. Immer handles the immutability!"
          showHint={showHint}
          onToggleHint={() => setShowHint(!showHint)}
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Project Header */}
              <div className="p-4 rounded-lg bg-obsidian-900 border border-obsidian-600">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-obsidian-100">{project?.name}</h3>
                  <select
                    value={project?.status}
                    onChange={(e) =>
                      store.updateProjectStatus(project!.id, e.target.value as Project['status'])
                    }
                    className={`px-2 py-1 text-xs rounded-lg border ${
                      project?.status === 'active'
                        ? 'bg-cyber-green/20 border-cyber-green/30 text-cyber-green'
                        : project?.status === 'completed'
                        ? 'bg-cyber-blue/20 border-cyber-blue/30 text-cyber-blue'
                        : 'bg-obsidian-700 border-obsidian-600 text-obsidian-300'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {project?.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-obsidian-700 text-obsidian-300 rounded"
                    >
                      {tag}
                      <button
                        onClick={() => store.removeTag(project.id, tag)}
                        className="text-obsidian-500 hover:text-cyber-red"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-2 py-1 text-xs bg-obsidian-800 border border-obsidian-600 rounded text-obsidian-100 placeholder-obsidian-500"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-2 py-1 text-xs bg-obsidian-700 text-obsidian-300 rounded hover:text-obsidian-100"
                  >
                    + Tag
                  </button>
                </div>
              </div>

              {/* Add Task */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="Add a task..."
                  className="flex-1 px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded-lg text-obsidian-100 placeholder-obsidian-500"
                />
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-cyber-yellow hover:bg-cyber-yellow-dim text-obsidian-900 font-medium rounded-lg"
                >
                  Add
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {project?.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-obsidian-900 rounded-lg border border-obsidian-600"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => store.toggleTask(project.id, task.id)}
                        className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center ${
                          task.done
                            ? 'bg-cyber-green border-cyber-green'
                            : 'border-obsidian-500'
                        }`}
                      >
                        {task.done && (
                          <svg className="w-3 h-3 text-obsidian-900" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={task.done ? 'text-obsidian-500 line-through' : 'text-obsidian-100'}>
                          {task.title}
                        </p>
                        <select
                          value={task.assignee?.id || ''}
                          onChange={(e) => {
                            const assignee = assignees.find((a) => a.id === e.target.value) || null;
                            store.assignTask(project.id, task.id, assignee);
                          }}
                          className="mt-1 px-2 py-1 text-xs bg-obsidian-800 border border-obsidian-600 rounded text-obsidian-300"
                        >
                          <option value="">Unassigned</option>
                          {assignees.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <StateInspector
              state={project || {}}
              title="Project State (Nested)"
            />
          </div>
        </InteractivePanel>
      </section>

      {/* Array Operations */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Array Operations Made Easy
        </h2>
        <p className="text-obsidian-300 mb-4">
          With Immer, array methods like <code className="text-cyber-yellow">push()</code>, 
          <code className="text-cyber-yellow"> splice()</code>, and <code className="text-cyber-yellow">find()</code> 
          work exactly as you'd expect.
        </p>
        <CodeBlock code={arrayOperationsCode} filename="array-operations.ts" highlightLines={[8, 13, 14, 18, 19, 23, 24, 25]} />
      </section>

      {/* Combining Middleware */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Combining with Other Middleware
        </h2>
        <p className="text-obsidian-300 mb-4">
          Immer works great with other Zustand middleware. Note the nesting order: 
          immer should be the innermost middleware.
        </p>
        <CodeBlock code={combiningMiddlewareCode} filename="combined-middleware.ts" highlightLines={[6, 7, 8, 9]} />
      </section>

      {/* Performance */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Performance Considerations
        </h2>
        <p className="text-obsidian-300 mb-4">
          Immer adds minimal overhead for most applications. For very large state trees 
          or high-frequency updates, consider normalization.
        </p>
        <CodeBlock code={performanceCode} filename="performance.ts" />
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Immer lets you write mutable-looking code that produces immutable updates',
            'Perfect for deeply nested state structures',
            'Array methods like push, splice, find work naturally',
            'Combine with devtools and persist - immer should be innermost',
            'Minimal performance overhead for most use cases',
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

