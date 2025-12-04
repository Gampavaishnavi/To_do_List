import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, Category, SubTask, FilterType } from './types';
import { TaskCard } from './components/TaskCard';
import { AddTaskForm } from './components/AddTaskForm';
import { generateSubtasks, getSmartAdvice } from './services/geminiService';
import { 
  Layout, 
  Plus, 
  CalendarDays, 
  CheckSquare, 
  LayoutList, 
  Zap, 
  Search,
  BookOpen,
  Sparkles
} from 'lucide-react';

// --- Local Storage Helper ---
const loadTasks = (): Task[] => {
  const stored = localStorage.getItem('uniflow-tasks');
  return stored ? JSON.parse(stored) : [];
};

const saveTasks = (tasks: Task[]) => {
  localStorage.setItem('uniflow-tasks', JSON.stringify(tasks));
};

// Safer ID generation for broader compatibility
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Load
  useEffect(() => {
    const loaded = loadTasks();
    setTasks(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on Change
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Load advice once on mount if tasks exist
  useEffect(() => {
    if (tasks.length > 0 && !advice) {
      setLoadingAdvice(true);
      getSmartAdvice(tasks).then(res => {
        setAdvice(res);
        setLoadingAdvice(false);
      });
    }
  }, [tasks.length]); // Only re-trigger if task count changes significantly (simple heuristic)

  const addTask = (newTask: { title: string; description: string; priority: Priority; category: Category; dueDate: string }) => {
    const task: Task = {
      id: generateId(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      category: newTask.category,
      dueDate: newTask.dueDate,
      completed: false,
      subTasks: [],
      createdAt: Date.now(),
    };
    setTasks(prev => [task, ...prev]);
    setIsAddModalOpen(false);
  };

  const toggleComplete = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subTasks: t.subTasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
      };
    }));
  };

  const handleGenerateSubtasks = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setGeneratingId(taskId);
    const subtaskTitles = await generateSubtasks(task.title, task.description);
    
    const newSubTasks: SubTask[] = subtaskTitles.map(title => ({
      id: generateId(),
      title,
      completed: false
    }));

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subTasks: [...t.subTasks, ...newSubTasks] } : t));
    setGeneratingId(null);
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }

    // Tab Filter
    const todayStr = new Date().toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        result = result.filter(t => !t.completed && t.dueDate === todayStr);
        break;
      case 'upcoming':
        result = result.filter(t => !t.completed && t.dueDate && t.dueDate > todayStr);
        break;
      case 'completed':
        result = result.filter(t => t.completed);
        break;
      case 'all':
      default:
        // For 'all', we usually want incomplete first
        result = [...result].sort((a, b) => (Number(a.completed) - Number(b.completed)));
        break;
    }
    
    // Secondary Sort by Priority (High to Low) for non-completed
    // Using a simple map for value
    const pVal = { [Priority.URGENT]: 3, [Priority.HIGH]: 2, [Priority.MEDIUM]: 1, [Priority.LOW]: 0 };
    if (filter !== 'completed') {
        result.sort((a, b) => {
            if (a.completed !== b.completed) return 0; // Already sorted by completion above
            return pVal[b.priority] - pVal[a.priority];
        });
    }

    return result;
  }, [tasks, filter, searchQuery]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [tasks]);

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:flex">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-indigo-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center mb-4">
           <h1 className="text-xl font-bold flex items-center gap-2">
             <BookOpen className="w-6 h-6" /> UniFlow
           </h1>
           <div className="text-xs font-medium bg-indigo-500/50 px-2 py-1 rounded">
             {stats.percent}% Done
           </div>
        </div>
        
        {/* Mobile Search */}
         <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-indigo-200" />
            <input 
              type="text" 
              placeholder="Search assignments..." 
              className="w-full bg-indigo-700/50 text-white placeholder:text-indigo-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen sticky top-0 border-r border-slate-800">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-500" /> UniFlow
          </h1>
          <p className="text-xs text-slate-500 mt-1">Smart Student Planner</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setFilter('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Layout className="w-5 h-5" /> All Tasks
          </button>
          <button 
            onClick={() => setFilter('today')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${filter === 'today' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Zap className="w-5 h-5" /> Today's Focus
          </button>
          <button 
            onClick={() => setFilter('upcoming')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${filter === 'upcoming' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <CalendarDays className="w-5 h-5" /> Upcoming
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${filter === 'completed' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <CheckSquare className="w-5 h-5" /> Completed
          </button>
        </nav>

        <div className="p-6">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex justify-between text-xs mb-2">
              <span>Progress</span>
              <span className="text-white">{stats.percent}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                style={{ width: `${stats.percent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto p-4 md:p-8 w-full">
        
        {/* Desktop Header & Search */}
        <div className="hidden md:flex justify-between items-center mb-8">
           <div>
             <h2 className="text-2xl font-bold text-slate-800">
               {filter === 'all' && 'All Assignments'}
               {filter === 'today' && 'Today\'s Focus'}
               {filter === 'upcoming' && 'Upcoming Deadlines'}
               {filter === 'completed' && 'History'}
             </h2>
             <p className="text-slate-500 text-sm mt-1">
               {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
             </p>
           </div>
           
           <div className="relative w-72">
             <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
             <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
        </div>

        {/* AI Advice Banner */}
        {advice && filter !== 'completed' && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Sparkles className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 opacity-90 text-sm font-medium tracking-wide uppercase">
                <Sparkles className="w-4 h-4" />
                Smart Insight
              </div>
              <p className="text-lg md:text-xl font-medium leading-relaxed">
                "{advice}"
              </p>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutList className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-600">No tasks found</h3>
              <p className="text-sm">Time to relax or add a new mission.</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onToggleComplete={toggleComplete}
                onDelete={deleteTask}
                onGenerateSubtasks={handleGenerateSubtasks}
                onToggleSubtask={toggleSubtask}
                isGenerating={generatingId === task.id}
              />
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button (Mobile & Desktop) */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-105 active:scale-95 z-40"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 pb-safe z-30">
        <button onClick={() => setFilter('all')} className={`flex flex-col items-center p-1 ${filter === 'all' ? 'text-indigo-600' : 'text-slate-400'}`}>
           <Layout className="w-6 h-6" />
        </button>
        <button onClick={() => setFilter('today')} className={`flex flex-col items-center p-1 ${filter === 'today' ? 'text-indigo-600' : 'text-slate-400'}`}>
           <Zap className="w-6 h-6" />
        </button>
        <div className="w-8"></div> {/* Spacer for FAB */}
        <button onClick={() => setFilter('upcoming')} className={`flex flex-col items-center p-1 ${filter === 'upcoming' ? 'text-indigo-600' : 'text-slate-400'}`}>
           <CalendarDays className="w-6 h-6" />
        </button>
        <button onClick={() => setFilter('completed')} className={`flex flex-col items-center p-1 ${filter === 'completed' ? 'text-indigo-600' : 'text-slate-400'}`}>
           <CheckSquare className="w-6 h-6" />
        </button>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <AddTaskForm 
          onAdd={addTask} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;