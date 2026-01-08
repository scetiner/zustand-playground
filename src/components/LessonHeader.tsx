import { CheckCircle2, Circle, Clock, Signal } from 'lucide-react';
import { useProgressStore } from '../stores/progressStore';
import { categoryLabels, categoryColors, difficultyColors } from '../data/lessons';
import type { Lesson } from '../types';

interface LessonHeaderProps {
  lesson: Lesson;
}

export function LessonHeader({ lesson }: LessonHeaderProps) {
  const { isLessonCompleted, markLessonComplete, markLessonIncomplete } = useProgressStore();
  const completed = isLessonCompleted(lesson.id);

  const handleToggleComplete = () => {
    if (completed) {
      markLessonIncomplete(lesson.id);
    } else {
      markLessonComplete(lesson.id);
    }
  };

  return (
    <header className="mb-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                categoryColors[lesson.category]
              }`}
            >
              {categoryLabels[lesson.category]}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-obsidian-300">
              <Clock size={12} />
              {lesson.duration}
            </span>
            <span className={`flex items-center gap-1.5 text-xs ${difficultyColors[lesson.difficulty]}`}>
              <Signal size={12} />
              {lesson.difficulty.charAt(0).toUpperCase() + lesson.difficulty.slice(1)}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-obsidian-100 mb-2">
            <span className="text-cyber-yellow font-mono mr-3">
              {String(lesson.number).padStart(2, '0')}
            </span>
            {lesson.title}
          </h1>
          <p className="text-lg text-obsidian-300">{lesson.description}</p>
        </div>
        <button
          onClick={handleToggleComplete}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
            completed
              ? 'bg-cyber-green/10 border-cyber-green/30 text-cyber-green hover:bg-cyber-green/20'
              : 'bg-obsidian-700 border-obsidian-600 text-obsidian-300 hover:border-obsidian-500 hover:text-obsidian-100'
          }`}
        >
          {completed ? (
            <>
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">Completed</span>
            </>
          ) : (
            <>
              <Circle size={18} />
              <span className="text-sm font-medium">Mark Complete</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

