# 🐻 Zustand Playground

An interactive tutorial for mastering [Zustand](https://github.com/pmndrs/zustand) state management in React applications, with a special focus on **Micro Frontend (MFE) architectures**.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit-orange)](https://zustand-playground-scetiner.vercel.app/) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-cyan)

## ✨ Features

- **19 Progressive Lessons** — From basics to advanced patterns
- **Interactive Code Editor** — Write and execute code in real-time with Monaco Editor
- **Live Preview** — See your stores in action with instant visual feedback
- **Real Middleware** — Use actual `persist`, `devtools`, and `immer` middleware
- **MFE Patterns** — Learn isolated stores, shared state, event bus, and initialization strategies
- **Progress Tracking** — Your progress is saved to localStorage
- **Production-Ready Examples** — Enterprise patterns and best practices

## 📚 Curriculum

### Fundamentals
1. **Your First Store** — Create a basic Zustand store
2. **TypeScript Integration** — Add type safety to your stores
3. **Selectors & Performance** — Optimize re-renders with selectors
4. **Actions & Updates** — Manage state mutations
5. **Async Actions** — Handle API calls and loading states

### Middleware
6. **DevTools Middleware** — Time-travel debugging
7. **Persist Middleware** — Save state to localStorage
8. **Immer Middleware** — Write mutable-style immutable updates

### Advanced Patterns
9. **Store Slices** — Split large stores into manageable pieces
10. **Advanced TypeScript** — Full type safety for complex stores
11. **Replacing Context** — Migrate from React Context to Zustand
12. **External Subscriptions** — Subscribe to stores outside React
13. **Dynamic Stores** — Create stores on-demand

### Micro Frontend Architecture
14. **MFE: Isolated Stores** — Separate stores per micro frontend
15. **MFE: Shared State** — Share auth/config across MFEs
16. **MFE: Communication** — Event bus pattern for decoupled messaging
17. **MFE: Initialization** — Coordinate async startup across apps

### Production
18. **Testing Stores** — Unit test patterns with store factories
19. **Best Practices** — Production-ready patterns and anti-patterns

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/scetiner/zustand-playground.git
cd zustand-playground

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🛠 Tech Stack

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Vite** — Fast build tool
- **TailwindCSS** — Styling
- **Monaco Editor** — Code editing
- **Zustand** — State management
- **Babel Standalone** — In-browser code transpilation

## 🎯 How It Works

1. **Select a lesson** from the sidebar
2. **Read the instructions** in the Help panel
3. **Complete the TODO** items in the code editor
4. **Click Run** to execute your code
5. **Interact with the preview** to test your store
6. **Mark complete** and move to the next lesson

## 📸 Screenshots

### Interactive Code Editor
Write code with syntax highlighting, auto-completion, and real-time error feedback.

### Live Preview
See your Zustand stores in action with interactive demos that respond to state changes.

### State Inspector
View the current state as formatted JSON, updated in real-time as you interact with your stores.

## 🏗 Project Structure

```
src/
├── components/
│   ├── CodeEditor.tsx    # Monaco editor with lesson code
│   └── LivePreview.tsx   # Interactive store demos
├── data/
│   └── lessons.ts        # Lesson definitions
├── stores/
│   └── progressStore.ts  # User progress tracking
├── utils/
│   └── codeRunner.ts     # Sandboxed code execution
└── App.tsx               # Main application
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Zustand](https://github.com/pmndrs/zustand) — The bear necessities of state management
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — The code editor that powers VS Code
- [Vite](https://vitejs.dev/) — Next generation frontend tooling

---

<p align="center">
  Made with ❤️ for the React community
  <br><br>
  <sub>Tutorial prepared by <a href="https://github.com/scetiner">Serif Cetiner</a> with development assistance from <a href="https://cursor.com">Cursor AI</a></sub>
</p>
