import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  RotateCcw,
  Gauge,
  ChevronRight
} from 'lucide-react';
import { lessons, categoryLabels, categoryColors } from '../data/lessons';
import { useProgressStore } from '../stores/progressStore';
import type { Lesson, LessonCategory } from '../types';

export function Sidebar() {
  const { 
    currentLessonId, 
    setCurrentLesson, 
    isLessonCompleted, 
    getCompletionPercentage,
    resetProgress 
  } = useProgressStore();

  const percentage = getCompletionPercentage();

  // Group lessons by category
  const groupedLessons = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.category]) {
      acc[lesson.category] = [];
    }
    acc[lesson.category].push(lesson);
    return acc;
  }, {} as Record<LessonCategory, Lesson[]>);

  const categories = Object.keys(groupedLessons) as LessonCategory[];

  return (
    <aside className="w-80 h-screen bg-obsidian-800/50 border-r border-obsidian-600 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-obsidian-600">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-yellow to-cyber-yellow-dim flex items-center justify-center">
            <BookOpen size={20} className="text-obsidian-900" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-obsidian-100">
              Zustand
            </h1>
            <p className="text-xs text-obsidian-300">Enterprise Playground</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-obsidian-300 flex items-center gap-1.5">
              <Gauge size={14} />
              Progress
            </span>
            <span className="text-cyber-yellow font-mono">{percentage}%</span>
          </div>
          <div className="h-2 bg-obsidian-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyber-yellow to-cyber-orange transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lessons */}
      <nav className="flex-1 overflow-y-auto py-4">
        {categories.map((category) => (
          <div key={category} className="mb-4">
            <div className="px-6 mb-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${categoryColors[category]}`}
              >
                {categoryLabels[category]}
              </span>
            </div>
            <ul className="space-y-0.5">
              {groupedLessons[category].map((lesson) => {
                const isActive = lesson.id === currentLessonId;
                const isCompleted = isLessonCompleted(lesson.id);
                
                return (
                  <li key={lesson.id}>
                    <button
                      onClick={() => setCurrentLesson(lesson.id)}
                      className={`w-full flex items-center gap-3 px-6 py-2.5 text-left transition-all group ${
                        isActive
                          ? 'bg-cyber-yellow/10 border-r-2 border-cyber-yellow'
                          : 'hover:bg-obsidian-700/50'
                      }`}
                    >
                      <span className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 
                            size={18} 
                            className="text-cyber-green" 
                          />
                        ) : (
                          <Circle 
                            size={18} 
                            className={isActive ? 'text-cyber-yellow' : 'text-obsidian-400'} 
                          />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono ${
                              isActive ? 'text-cyber-yellow' : 'text-obsidian-400'
                            }`}
                          >
                            {String(lesson.number).padStart(2, '0')}
                          </span>
                          <span
                            className={`text-sm truncate ${
                              isActive
                                ? 'text-obsidian-100 font-medium'
                                : 'text-obsidian-200 group-hover:text-obsidian-100'
                            }`}
                          >
                            {lesson.title}
                          </span>
                        </div>
                        <p className="text-xs text-obsidian-400 truncate mt-0.5">
                          {lesson.duration}
                        </p>
                      </div>
                      <ChevronRight 
                        size={16} 
                        className={`flex-shrink-0 transition-transform ${
                          isActive 
                            ? 'text-cyber-yellow' 
                            : 'text-obsidian-500 group-hover:text-obsidian-300 group-hover:translate-x-0.5'
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-obsidian-600">
        <button
          onClick={resetProgress}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-obsidian-300 hover:text-cyber-red hover:bg-obsidian-700 rounded-lg transition-colors"
        >
          <RotateCcw size={16} />
          Reset Progress
        </button>
      </div>
    </aside>
  );
}

