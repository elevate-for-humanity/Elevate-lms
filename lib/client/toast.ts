'use client';

/**
 * Simple toast notification system
 * Can be replaced with react-hot-toast or similar library
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?:
    | 'top-right'
    | 'top-center'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'bottom-left';
}

class ToastManager {
  private container: HTMLElement | null = null;
  private toasts: Map<string, HTMLElement> = new Map();

  private ensureContainer() {
    if (this.container) return this.container;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
    return this.container;
  }

  show(message: string, type: ToastType = 'info', options: ToastOptions = {}) {
    const container = this.ensureContainer();
    const id = `toast-${Date.now()}-${Math.random()}`;
    const duration = options.duration || 5000;

    const toast = document.createElement('div');
    toast.id = id;
    toast.style.cssText = `
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 300px;
      max-width: 500px;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.875rem;
      line-height: 1.5;
    `;

    // Set colors based on type
    const colors = {
      success: { bg: '#10b981', text: '#ffffff' },
      error: { bg: '#ef4444', text: '#ffffff' },
      warning: { bg: '#f59e0b', text: '#ffffff' },
      info: { bg: '#3b82f6', text: '#ffffff' },
    };

    const color = colors[type];
    toast.style.backgroundColor = color.bg;
    toast.style.color = color.text;

    // Icon
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    toast.innerHTML = `
      <span style="font-size: 1.25rem; font-weight: bold;">${icons[type]}</span>
      <span style="flex: 1;">${message}</span>
      <button 
        onclick="this.parentElement.remove()" 
        style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.25rem; padding: 0; opacity: 0.7; hover: opacity: 1;"
      >×</button>
    `;

    container.appendChild(toast);
    this.toasts.set(id, toast);

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        toast.remove();
        this.toasts.delete(id);
      }, 300);
    }, duration);

    // Add animations
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  success(message: string, options?: ToastOptions) {
    this.show(message, 'success', options);
  }

  error(message: string, options?: ToastOptions) {
    this.show(message, 'error', options);
  }

  warning(message: string, options?: ToastOptions) {
    this.show(message, 'warning', options);
  }

  info(message: string, options?: ToastOptions) {
    this.show(message, 'info', options);
  }

  clear() {
    this.toasts.forEach((toast) => toast.remove());
    this.toasts.clear();
  }
}

// Singleton instance
export const toast = new ToastManager();
