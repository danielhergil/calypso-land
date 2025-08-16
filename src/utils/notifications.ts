/**
 * Secure notification utility to replace browser alerts
 * Prevents potential phishing attacks through alert() usage
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

// Simple notification system using DOM manipulation
// In a real application, you'd integrate with a proper toast library
export const showNotification = (options: NotificationOptions): void => {
  const { type, title, message, duration = 5000 } = options;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `
    fixed top-4 right-4 z-[100] max-w-sm p-4 rounded-lg shadow-lg
    ${getNotificationStyles(type)}
    transform translate-x-full transition-transform duration-300
  `;
  
  notification.innerHTML = `
    <div class="flex items-start">
      <div class="flex-1">
        <h4 class="font-semibold text-sm">${escapeHtml(title)}</h4>
        <p class="text-sm mt-1">${escapeHtml(message)}</p>
      </div>
      <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translate-x-0';
  }, 100);
  
  // Auto remove
  setTimeout(() => {
    notification.style.transform = 'translate-x-full';
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  }, duration);
};

const getNotificationStyles = (type: NotificationType): string => {
  switch (type) {
    case 'success':
      return 'bg-green-600 text-white';
    case 'error':
      return 'bg-red-600 text-white';
    case 'warning':
      return 'bg-amber-600 text-white';
    case 'info':
      return 'bg-blue-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

// Escape HTML to prevent XSS
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Convenience methods
export const showSuccess = (title: string, message: string) => 
  showNotification({ type: 'success', title, message });

export const showError = (title: string, message: string) => 
  showNotification({ type: 'error', title, message });

export const showWarning = (title: string, message: string) => 
  showNotification({ type: 'warning', title, message });

export const showInfo = (title: string, message: string) => 
  showNotification({ type: 'info', title, message });