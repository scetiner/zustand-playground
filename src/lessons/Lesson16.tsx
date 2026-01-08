import { CodeBlock, LessonHeader } from '../components';
import { NavigationButtons } from '../components/NavigationButtons';
import { lessons } from '../data/lessons';
import { Radio, Zap, MessageSquare } from 'lucide-react';

export function Lesson16() {
  const lesson = lessons.find((l) => l.id === 'lesson-16')!;

  const customEventCode = `// Event-Based Communication Pattern

// Define event types
interface MFEEvents {
  'cart:item-added': { productId: string; quantity: number };
  'cart:cleared': void;
  'user:logged-in': { userId: string; name: string };
  'user:logged-out': void;
  'product:selected': { productId: string };
}

// Type-safe event emitter
class MFEEventBus {
  private listeners = new Map<string, Set<Function>>();

  emit<K extends keyof MFEEvents>(
    event: K,
    data?: MFEEvents[K]
  ) {
    window.dispatchEvent(
      new CustomEvent(event, { detail: data })
    );
  }

  on<K extends keyof MFEEvents>(
    event: K,
    handler: (data: MFEEvents[K]) => void
  ): () => void {
    const wrapper = (e: CustomEvent) => handler(e.detail);
    window.addEventListener(event, wrapper as EventListener);
    return () => window.removeEventListener(event, wrapper as EventListener);
  }
}

export const eventBus = new MFEEventBus();

// Usage in Product Catalog MFE
function AddToCartButton({ product }) {
  const handleClick = () => {
    eventBus.emit('cart:item-added', {
      productId: product.id,
      quantity: 1,
    });
  };
  
  return <button onClick={handleClick}>Add to Cart</button>;
}

// Usage in Shopping Cart MFE (listening)
useEffect(() => {
  return eventBus.on('cart:item-added', ({ productId, quantity }) => {
    useCartStore.getState().addItem(productId, quantity);
  });
}, []);`;

  const zustandBridgeCode = `// Zustand Store Bridge Pattern
// Connect stores across MFEs via subscriptions

// shared-utils/src/storeBridge.ts
type UnsubscribeFn = () => void;

interface StoreBridge<T> {
  publish: (data: T) => void;
  subscribe: (handler: (data: T) => void) => UnsubscribeFn;
}

function createStoreBridge<T>(channelName: string): StoreBridge<T> {
  const channel = new BroadcastChannel(channelName);
  
  return {
    publish: (data: T) => {
      channel.postMessage(data);
    },
    
    subscribe: (handler: (data: T) => void) => {
      const listener = (event: MessageEvent<T>) => handler(event.data);
      channel.addEventListener('message', listener);
      return () => channel.removeEventListener('message', listener);
    },
  };
}

// Create bridges for different data types
export const userBridge = createStoreBridge<User | null>('user-channel');
export const cartBridge = createStoreBridge<CartItem[]>('cart-channel');

// User Profile MFE: Publish user changes
useSharedUserStore.subscribe(
  (state) => state.user,
  (user) => {
    userBridge.publish(user);
  }
);

// Other MFEs: Subscribe to user changes
useEffect(() => {
  return userBridge.subscribe((user) => {
    // React to user changes from another MFE
    console.log('User changed in another MFE:', user);
  });
}, []);`;

  const storeSubscriptionCode = `// Cross-MFE Store Subscription Pattern

// In the Cart MFE, subscribe to shared user store
// shopping-cart/src/bootstrap.ts

import { useSharedUserStore } from 'sharedStores/stores';
import { useCartStore } from './stores/cartStore';

// Set up cross-store subscriptions on MFE load
export function initializeCartMFE() {
  // When user logs out, clear the cart
  const unsubLogout = useSharedUserStore.subscribe(
    (state) => state.isAuthenticated,
    (isAuthenticated, wasAuthenticated) => {
      if (wasAuthenticated && !isAuthenticated) {
        useCartStore.getState().clearCart();
      }
    }
  );

  // When user logs in, fetch their saved cart
  const unsubLogin = useSharedUserStore.subscribe(
    (state) => state.user,
    async (user, prevUser) => {
      if (user && !prevUser) {
        const savedCart = await fetchUserCart(user.id);
        useCartStore.getState().setItems(savedCart);
      }
    }
  );

  // Return cleanup function
  return () => {
    unsubLogout();
    unsubLogin();
  };
}`;

  const pubSubStoreCode = `// PubSub Store Pattern
// A dedicated store for MFE communication

import { create } from 'zustand';

interface Message {
  id: string;
  source: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

interface PubSubStore {
  messages: Message[];
  publish: (source: string, type: string, payload: unknown) => void;
  subscribe: (type: string, handler: (msg: Message) => void) => () => void;
  clearMessages: () => void;
}

export const usePubSubStore = create<PubSubStore>((set, get) => ({
  messages: [],
  
  publish: (source, type, payload) => {
    const message: Message = {
      id: crypto.randomUUID(),
      source,
      type,
      payload,
      timestamp: Date.now(),
    };
    
    set((state) => ({
      messages: [...state.messages.slice(-99), message],
    }));
  },
  
  subscribe: (type, handler) => {
    // Return unsubscribe function
    return usePubSubStore.subscribe(
      (state) => state.messages,
      (messages, prevMessages) => {
        const newMessages = messages.filter(
          (m) => m.type === type && !prevMessages.includes(m)
        );
        newMessages.forEach(handler);
      }
    );
  },
  
  clearMessages: () => set({ messages: [] }),
}));

// Usage
// Product Catalog publishes
usePubSubStore.getState().publish(
  'product-catalog',
  'product:viewed',
  { productId: '123' }
);

// Analytics MFE subscribes
usePubSubStore.getState().subscribe('product:viewed', (msg) => {
  trackEvent('product_view', msg.payload);
});`;

  const commandPatternCode = `// Command Pattern for Complex Communication

interface Command {
  type: string;
  payload: unknown;
  metadata: {
    source: string;
    timestamp: number;
    correlationId?: string;
  };
}

interface CommandHandler {
  canHandle: (command: Command) => boolean;
  handle: (command: Command) => void | Promise<void>;
}

// Command dispatcher
class CommandBus {
  private handlers: CommandHandler[] = [];
  
  register(handler: CommandHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }
  
  async dispatch(command: Command) {
    const handler = this.handlers.find(h => h.canHandle(command));
    if (handler) {
      await handler.handle(command);
    } else {
      console.warn('No handler for command:', command.type);
    }
  }
}

export const commandBus = new CommandBus();

// Register handlers in each MFE
// shopping-cart/src/commandHandlers.ts
commandBus.register({
  canHandle: (cmd) => cmd.type === 'ADD_TO_CART',
  handle: (cmd) => {
    const { productId, quantity } = cmd.payload as any;
    useCartStore.getState().addItem(productId, quantity);
  },
});

// Dispatch from anywhere
commandBus.dispatch({
  type: 'ADD_TO_CART',
  payload: { productId: '123', quantity: 1 },
  metadata: {
    source: 'product-catalog',
    timestamp: Date.now(),
  },
});`;

  return (
    <div className="animate-fade-in">
      <LessonHeader lesson={lesson} />

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Communication Patterns Between MFEs
        </h2>
        <p className="text-obsidian-300 mb-4 leading-relaxed">
          When MFEs can't share stores directly, they need other ways to communicate. 
          This lesson covers patterns from simple events to sophisticated command buses.
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: <MessageSquare size={20} />,
              title: 'Custom Events',
              description: 'Simple DOM events for loose coupling',
              color: 'cyber-green',
            },
            {
              icon: <Radio size={20} />,
              title: 'Store Bridges',
              description: 'BroadcastChannel for cross-tab sync',
              color: 'cyber-blue',
            },
            {
              icon: <Zap size={20} />,
              title: 'PubSub Store',
              description: 'Zustand-based message passing',
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

      {/* Custom Events */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Pattern 1: Custom Events
        </h2>
        <p className="text-obsidian-300 mb-4">
          The simplest pattern. Use CustomEvents on the window for type-safe, loosely-coupled 
          communication between MFEs.
        </p>
        <CodeBlock code={customEventCode} filename="eventBus.ts" highlightLines={[18, 19, 20, 21, 22, 25, 26, 27, 28, 29, 30, 31]} />
      </section>

      {/* Store Bridge */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Pattern 2: Store Bridge
        </h2>
        <p className="text-obsidian-300 mb-4">
          Use BroadcastChannel to sync state changes across browser tabs and windows. 
          Great for keeping MFEs in sync even when loaded in iframes.
        </p>
        <CodeBlock code={zustandBridgeCode} filename="storeBridge.ts" highlightLines={[12, 14, 15, 16, 18, 19, 20, 21, 22]} />
      </section>

      {/* Cross-Store Subscription */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Pattern 3: Cross-Store Subscriptions
        </h2>
        <p className="text-obsidian-300 mb-4">
          Subscribe to shared stores and react to changes in your local store. 
          Perfect for coordinating actions across MFEs.
        </p>
        <CodeBlock code={storeSubscriptionCode} filename="crossStore.ts" highlightLines={[12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28]} />
      </section>

      {/* PubSub Store */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Pattern 4: PubSub Store
        </h2>
        <p className="text-obsidian-300 mb-4">
          A dedicated Zustand store for message passing. Provides a history of messages 
          and type-safe pub/sub semantics.
        </p>
        <CodeBlock code={pubSubStoreCode} filename="pubSubStore.ts" />
      </section>

      {/* Command Pattern */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Pattern 5: Command Bus
        </h2>
        <p className="text-obsidian-300 mb-4">
          For complex applications, use the Command pattern. MFEs register handlers, 
          and any MFE can dispatch commands.
        </p>
        <CodeBlock code={commandPatternCode} filename="commandBus.ts" />
      </section>

      {/* Comparison Table */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-obsidian-100 mb-4">
          Pattern Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-obsidian-600">
                <th className="text-left py-3 px-4 text-obsidian-300">Pattern</th>
                <th className="text-left py-3 px-4 text-obsidian-300">Complexity</th>
                <th className="text-left py-3 px-4 text-obsidian-300">Cross-Tab</th>
                <th className="text-left py-3 px-4 text-obsidian-300">Best For</th>
              </tr>
            </thead>
            <tbody>
              {[
                { pattern: 'Custom Events', complexity: 'Low', crossTab: 'No', best: 'Simple notifications' },
                { pattern: 'Store Bridge', complexity: 'Medium', crossTab: 'Yes', best: 'State sync across tabs' },
                { pattern: 'Cross-Store Sub', complexity: 'Low', crossTab: 'No', best: 'Coordinated actions' },
                { pattern: 'PubSub Store', complexity: 'Medium', crossTab: 'No', best: 'Message history, debugging' },
                { pattern: 'Command Bus', complexity: 'High', crossTab: 'No', best: 'Complex workflows' },
              ].map((row) => (
                <tr key={row.pattern} className="border-b border-obsidian-700">
                  <td className="py-3 px-4 text-obsidian-100">{row.pattern}</td>
                  <td className="py-3 px-4 text-obsidian-300">{row.complexity}</td>
                  <td className="py-3 px-4">
                    <span className={row.crossTab === 'Yes' ? 'text-cyber-green' : 'text-obsidian-500'}>
                      {row.crossTab}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-obsidian-300">{row.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Key Takeaways */}
      <section className="mb-10 p-6 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-transparent border border-cyber-yellow/20">
        <h2 className="font-display text-lg font-semibold text-cyber-yellow mb-3">
          Key Takeaways
        </h2>
        <ul className="space-y-2">
          {[
            'Custom Events are simplest - use for basic notifications',
            'BroadcastChannel syncs state across browser tabs',
            'Cross-store subscriptions coordinate shared + local stores',
            'PubSub stores provide message history for debugging',
            'Command Bus handles complex multi-step workflows',
            'Choose pattern based on complexity needs',
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

