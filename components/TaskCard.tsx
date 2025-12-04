import React, { useState } from 'react';
import { Task, Priority, Category, SubTask } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Calendar, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical,
  BookOpen,
  GraduationCap,
  Beer,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateSubtasks: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  isGenerating?: boolean;
}

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    [Priority.LOW]: 'bg-slate-100 text-slate-600',
    [Priority.MEDIUM]: 'bg-blue-100 text-blue-600',
    [Priority.HIGH]: 'bg-orange-100 text-orange-600',
    [Priority.URGENT]: 'bg-red-100 text-red-600 animate-pulse',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const CategoryIcon = ({ category }: { category: Category }) => {
  switch (category) {
    case Category.HOMEWORK: return <BookOpen className="w-3 h-3 mr-1" />;
    case Category.EXAM: return <AlertCircle className="w-3 h-3 mr-1" />;
    case Category.PROJECT: return <Briefcase className="w-3 h-3 mr-1" />;
    case Category.SOCIAL: return <Beer className="w-3 h-3 mr-1" />;
    case Category.CLUB: return <GraduationCap className="w-3 h-3 mr-1" />;
    default: return <Circle className="w-3 h-3 mr-1" />;
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onToggleComplete, 
  onDelete, 
  onGenerateSubtasks,
  onToggleSubtask,
  isGenerating 
}) => {
  const [expanded, setExpanded] = useState(false);

  const isOverdue = task.dueDate 
    ? new Date(task.dueDate) < new Date() && !task.completed 
    : false;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`group bg-white rounded-xl p-4 shadow-sm border transition-all duration-200 hover:shadow-md ${task.completed ? 'opacity-60 bg-slate-50' : 'border-slate-200'}`}>
      
      {/* Main Row */}
      <div className="flex items-start gap-3">
        <button 
          onClick={() => onToggleComplete(task.id)}
          className={`mt-1 flex-shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-slate-300 hover:text-slate-400'}`}
        >
          {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-semibold text-slate-800 truncate ${task.completed ? 'line-through text-slate-500' : ''}`}>
              {task.title}
            </h3>
            <PriorityBadge priority={task.priority} />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
             <span className="flex items-center bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
               <CategoryIcon category={task.category} /> {task.category}
             </span>
             {task.dueDate && (
               <span className={`flex items-center ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                 <Calendar className="w-3 h-3 mr-1" />
                 {formatDate(task.dueDate)}
               </span>
             )}
          </div>

          {task.description && (
             <p className="text-sm text-slate-600 mt-2 line-clamp-2">{task.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 items-end">
          <button 
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded / Subtasks Area */}
      {(expanded || task.subTasks.length > 0) && (
        <div className={`mt-4 pt-3 border-t border-slate-100 ${!expanded && task.subTasks.length > 0 ? 'hidden' : 'block'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Breakdown</span>
            {task.subTasks.length === 0 && !task.completed && (
              <button 
                onClick={() => onGenerateSubtasks(task.id)}
                disabled={isGenerating}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <span className="animate-spin mr-1">✦</span>
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                AI Breakdown
              </button>
            )}
          </div>

          <div className="space-y-2">
            {task.subTasks.length === 0 && !task.completed && (
               <div className="text-xs text-slate-400 italic">No subtasks yet. Use AI Breakdown to split this task.</div>
            )}
            
            {task.subTasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2 group/sub">
                <button 
                  onClick={() => onToggleSubtask(task.id, sub.id)}
                  className={`flex-shrink-0 ${sub.completed ? 'text-green-500' : 'text-slate-300 group-hover/sub:text-slate-400'}`}
                >
                  {sub.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>
                <span className={`text-sm ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {sub.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};