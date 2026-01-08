import { ChevronLeft, ChevronRight } from 'lucide-react';
import { lessons } from '../data/lessons';
import { useProgressStore } from '../stores/progressStore';

export function NavigationButtons() {
  const { currentLessonId, setCurrentLesson } = useProgressStore();
  
  const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="flex items-center justify-between pt-8 mt-8 border-t border-obsidian-600">
      {prevLesson ? (
        <button
          onClick={() => setCurrentLesson(prevLesson.id)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-obsidian-600 bg-obsidian-800 hover:border-obsidian-500 hover:bg-obsidian-700 transition-colors group"
        >
          <ChevronLeft 
            size={20} 
            className="text-obsidian-400 group-hover:text-cyber-yellow transition-colors" 
          />
          <div className="text-left">
            <p className="text-xs text-obsidian-400">Previous</p>
            <p className="text-sm text-obsidian-200 group-hover:text-obsidian-100">
              {prevLesson.title}
            </p>
          </div>
        </button>
      ) : (
        <div />
      )}

      {nextLesson ? (
        <button
          onClick={() => setCurrentLesson(nextLesson.id)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-cyber-yellow/30 bg-cyber-yellow/5 hover:bg-cyber-yellow/10 hover:border-cyber-yellow/50 transition-colors group"
        >
          <div className="text-right">
            <p className="text-xs text-obsidian-400">Next</p>
            <p className="text-sm text-cyber-yellow">
              {nextLesson.title}
            </p>
          </div>
          <ChevronRight 
            size={20} 
            className="text-cyber-yellow" 
          />
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-cyber-green/10 border border-cyber-green/30">
          <span className="text-cyber-green text-sm font-medium">
            🎉 Congratulations! You've completed all lessons!
          </span>
        </div>
      )}
    </div>
  );
}

