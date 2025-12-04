export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum Category {
  HOMEWORK = 'Homework',
  EXAM = 'Exam',
  PROJECT = 'Project',
  CLUB = 'Club',
  SOCIAL = 'Social',
  OTHER = 'Other'
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO Date string
  priority: Priority;
  category: Category;
  completed: boolean;
  subTasks: SubTask[];
  createdAt: number;
}

export type FilterType = 'all' | 'today' | 'upcoming' | 'completed';
