/**
 * Global State Management using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User state
interface UserState {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  setUser: (user: UserState['user']) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
    },
  ),
);

// UI state
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: UIState['theme']) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    },
  ),
);

// Course progress state
interface CourseProgressState {
  progress: Record<
    string,
    {
      courseId: string;
      completedLessons: string[];
      currentLesson: string | null;
      lastAccessed: string;
      percentComplete: number;
    }
  >;
  updateProgress: (
    courseId: string,
    data: Partial<CourseProgressState['progress'][string]>,
  ) => void;
  clearProgress: (courseId: string) => void;
}

export const useCourseProgressStore = create<CourseProgressState>()(
  persist(
    (set) => ({
      progress: {},
      updateProgress: (courseId, data) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [courseId]: {
              ...state.progress[courseId],
              courseId,
              ...data,
            },
          },
        })),
      clearProgress: (courseId) =>
        set((state) => {
          const { [courseId]: _, ...rest } = state.progress;
          return { progress: rest };
        }),
    }),
    {
      name: 'course-progress-storage',
    },
  ),
);

// Notification state
interface NotificationState {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
  addNotification: (
    notification: Omit<NotificationState['notifications'][0], 'id' | 'timestamp'>,
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));

// Cart state (for course purchases)
interface CartState {
  items: Array<{
    id: string;
    courseId: string;
    courseName: string;
    price: number;
  }>;
  addItem: (item: CartState['items'][0]) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price, 0);
      },
    }),
    {
      name: 'cart-storage',
    },
  ),
);
