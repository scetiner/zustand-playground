export interface Lesson {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: string;
}

export const lessons: Lesson[] = [
  // Fundamentals
  {
    id: 1,
    title: 'Your First Store',
    description: 'Create a basic Zustand store with state and actions. Learn the fundamental create() function that makes Zustand so simple.',
    category: 'Fundamentals',
    duration: '5 min',
  },
  {
    id: 2,
    title: 'TypeScript Integration',
    description: 'Add full TypeScript support to your stores. Define interfaces for state and actions with proper type inference.',
    category: 'Fundamentals',
    duration: '8 min',
  },
  {
    id: 3,
    title: 'Selectors & Performance',
    description: 'Use selectors to subscribe to specific state slices. Prevent unnecessary re-renders for optimal performance.',
    category: 'Fundamentals',
    duration: '10 min',
  },
  {
    id: 4,
    title: 'Actions & Updates',
    description: 'Master state updates with set(). Learn when to use object vs function form and how to update nested state.',
    category: 'Fundamentals',
    duration: '10 min',
  },
  {
    id: 5,
    title: 'Async Actions',
    description: 'Handle API calls and async operations inside your store. Manage loading states and errors gracefully.',
    category: 'Fundamentals',
    duration: '12 min',
  },

  // Middleware
  {
    id: 6,
    title: 'DevTools Middleware',
    description: 'Debug your stores with Redux DevTools. Time-travel, inspect state changes, and track actions.',
    category: 'Middleware',
    duration: '5 min',
  },
  {
    id: 7,
    title: 'Persist Middleware',
    description: 'Save store state to localStorage or sessionStorage. Configure what to persist and handle hydration.',
    category: 'Middleware',
    duration: '10 min',
  },
  {
    id: 8,
    title: 'Immer Middleware',
    description: 'Write immutable updates with mutable syntax. Perfect for deeply nested state structures.',
    category: 'Middleware',
    duration: '8 min',
  },

  // Patterns
  {
    id: 9,
    title: 'Store Slices',
    description: 'Organize large stores into modular slices. Combine related state and actions for better maintainability.',
    category: 'Patterns',
    duration: '12 min',
  },
  {
    id: 10,
    title: 'Advanced TypeScript',
    description: 'Master StateCreator types, middleware typing, and generic stores for maximum type safety.',
    category: 'Patterns',
    duration: '15 min',
  },
  {
    id: 11,
    title: 'Replacing Context',
    description: 'Migrate from React Context to Zustand. Eliminate Provider hell and improve render performance.',
    category: 'Patterns',
    duration: '10 min',
  },
  {
    id: 12,
    title: 'External Subscriptions',
    description: 'Subscribe to store changes outside React. Integrate with analytics, logging, or other systems.',
    category: 'Patterns',
    duration: '8 min',
  },
  {
    id: 13,
    title: 'Dynamic Stores',
    description: 'Create stores on-demand at runtime. Build store factories for multi-instance components.',
    category: 'Patterns',
    duration: '10 min',
  },

  // Micro Frontends
  {
    id: 14,
    title: 'MFE: Isolated Stores',
    description: 'Create scoped stores per micro frontend. Ensure isolation and prevent naming conflicts.',
    category: 'MFE',
    duration: '12 min',
  },
  {
    id: 15,
    title: 'MFE: Shared State',
    description: 'Share state across MFEs using Module Federation. Configure singleton stores for global state.',
    category: 'MFE',
    duration: '15 min',
  },
  {
    id: 16,
    title: 'MFE: Communication',
    description: 'Implement event-based communication between MFEs. Build pub/sub patterns with Zustand.',
    category: 'MFE',
    duration: '15 min',
  },
  {
    id: 17,
    title: 'MFE: Initialization',
    description: 'Handle store initialization in distributed architectures. Implement hydration and loading guards.',
    category: 'MFE',
    duration: '12 min',
  },

  // Quality
  {
    id: 18,
    title: 'Testing Stores',
    description: 'Write comprehensive tests for your stores. Test actions, selectors, and async operations.',
    category: 'Testing',
    duration: '12 min',
  },
  {
    id: 19,
    title: 'Best Practices',
    description: 'Apply production-ready patterns. Avoid common pitfalls and optimize for maintainability.',
    category: 'Summary',
    duration: '10 min',
  },
];
