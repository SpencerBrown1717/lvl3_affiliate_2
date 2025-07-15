// Enhanced notification system with persistence

const NotificationSystem = {
  notifications: [],
  
  // Initialize and load saved notifications
  init() {
    try {
      // Check if localStorage is available
      if (!this.isStorageAvailable('localStorage')) {
        console.warn('localStorage is not available. Notifications will not persist.');
        this.notifications = [];
        this.renderNotifications();
        return;
      }
      
      const savedNotifications = localStorage.getItem('lvl3_notifications');
      if (savedNotifications) {
        try {
          this.notifications = JSON.parse(savedNotifications);
          // Clean up old notifications (older than 7 days)
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          this.notifications = this.notifications.filter(n => {
            const notificationDate = new Date(n.createdAt);
            return notificationDate > oneWeekAgo;
          });
          
          this.save();
        } catch (error) {
          console.error('Error parsing saved notifications:', error);
          this.notifications = [];
        }
      } else {
        this.notifications = [];
      }
    } catch (error) {
      console.error('Error initializing notification system:', error);
      this.notifications = [];
    }
    
    // Always try to render notifications, even if there's an error
    this.renderNotifications();
  },
  
  // Check if storage is available
  isStorageAvailable(type) {
    let storage;
    try {
      storage = window[type];
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return (
        e instanceof DOMException &&
        // everything except Firefox
        (e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          e.name === 'QuotaExceededError' ||
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        storage &&
        storage.length !== 0
      );
    }
  },
  
  // Save notifications to localStorage with error handling
  save() {
    try {
      if (this.isStorageAvailable('localStorage')) {
        localStorage.setItem('lvl3_notifications', JSON.stringify(this.notifications));
      } else {
        console.warn('Unable to save notifications: localStorage is not available');
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
      // If quota exceeded, try to remove old notifications
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.code === 22)) {
        this.cleanupOldNotifications();
        try {
          localStorage.setItem('lvl3_notifications', JSON.stringify(this.notifications));
        } catch (innerError) {
          console.error('Still unable to save after cleanup:', innerError);
        }
      }
    }
  },
  
  // Clean up older notifications when storage quota is exceeded
  cleanupOldNotifications() {
    if (this.notifications.length > 10) {
      // Keep only the 10 most recent notifications
      this.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      this.notifications = this.notifications.slice(0, 10);
      console.log('Cleaned up notifications to save space');
    }
  },
  
  // Add a new notification
  add(type, message, isPersistent = false, autoDismissTime = 5000) {
    const notification = {
      id: Date.now(),
      type,
      message,
      isPersistent,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    this.notifications.push(notification);
    
    if (isPersistent) {
      this.save();
    }
    
    this.renderNotifications();
    
    // Auto-dismiss non-persistent notifications
    if (!isPersistent && autoDismissTime > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, autoDismissTime);
    }
    
    return notification.id;
  },
  
  // Remove a notification
  remove(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.save();
    this.renderNotifications();
  },
  
  // Mark as read
  markAsRead(id) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.save();
    this.renderNotifications();
  },
  
  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.save();
    this.renderNotifications();
  },
  
  // Count unread notifications
  countUnread() {
    return this.notifications.filter(n => !n.read).length;
  },
  
  // Render all notifications with enhanced error handling and accessibility
  renderNotifications() {
    try {
      const container = document.getElementById('notification-container');
      if (!container) {
        console.warn('Notification container not found in DOM');
        return;
      }
      
      // Sort notifications with newest first
      const sortedNotifications = [...this.notifications].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Limit to max 5 visible notifications to prevent overwhelming the UI
      const visibleNotifications = sortedNotifications.slice(0, 5);
      
      // Create notification HTML with ARIA attributes for accessibility
      container.innerHTML = visibleNotifications.map(n => `
        <div class="notification ${n.type} ${n.read ? 'read' : ''}" 
             data-id="${n.id}" 
             role="alert" 
             aria-live="polite"
             tabindex="0">
          <div class="flex items-center gap-4">
            <span style="font-size: 20px;" aria-hidden="true">
              ${n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : '❌'}
            </span>
            <span style="font-weight: 600; font-size: 15px;">${this.escapeHTML(n.message)}</span>
          </div>
          <button class="notification-close" 
                  onclick="NotificationSystem.remove(${n.id})" 
                  aria-label="Dismiss notification">
            ×
          </button>
        </div>
      `).join('');
      
      // Count of additional hidden notifications
      const hiddenCount = this.notifications.length - visibleNotifications.length;
      if (hiddenCount > 0) {
        const moreNotificationsElement = document.createElement('div');
        moreNotificationsElement.className = 'notification more-notifications';
        moreNotificationsElement.innerHTML = `
          <div class="text-center">
            ${hiddenCount} more notification${hiddenCount !== 1 ? 's' : ''}
            <button class="show-all-btn" onclick="NotificationSystem.showAllNotifications()">Show all</button>
          </div>
        `;
        container.appendChild(moreNotificationsElement);
      }
      
      // Add event listeners
      document.querySelectorAll('.notification').forEach(el => {
        if (!el.classList.contains('more-notifications')) {
          el.addEventListener('click', (event) => {
            // Don't mark as read if clicking the close button
            if (!event.target.classList.contains('notification-close')) {
              this.markAsRead(parseInt(el.dataset.id));
            }
          });
          
          // Add keyboard accessibility
          el.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              this.markAsRead(parseInt(el.dataset.id));
            } else if (event.key === 'Escape') {
              event.preventDefault();
              this.remove(parseInt(el.dataset.id));
            }
          });
        }
      });
    } catch (error) {
      console.error('Error rendering notifications:', error);
    }
  },
  
  // Escape HTML to prevent XSS
  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
  
  // Show all notifications in a modal
  showAllNotifications() {
    try {
      // Create modal container if not exists
      let modal = document.getElementById('notifications-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'notifications-modal';
        modal.className = 'modal glass-effect';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');
        document.body.appendChild(modal);
      }
      
      // Sort notifications with newest first
      const sortedNotifications = [...this.notifications].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Create modal content
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="modal-title">All Notifications</h2>
            <button class="close-modal" onclick="document.getElementById('notifications-modal').remove()">
              ×
            </button>
          </div>
          <div class="modal-body">
            ${sortedNotifications.length ? sortedNotifications.map(n => `
              <div class="notification ${n.type} ${n.read ? 'read' : ''}" data-id="${n.id}">
                <div class="flex items-center gap-4 justify-between">
                  <div>
                    <span style="font-size: 20px;">
                      ${n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : '❌'}
                    </span>
                    <span style="font-weight: 600; font-size: 15px;">
                      ${this.escapeHTML(n.message)}
                    </span>
                  </div>
                  <div class="notification-meta">
                    <small>${new Date(n.createdAt).toLocaleString()}</small>
                    <button class="notification-action" onclick="NotificationSystem.remove(${n.id})">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            `).join('') : '<p class="text-center">No notifications</p>'}
          </div>
          <div class="modal-footer">
            <button class="button" onclick="NotificationSystem.clearAll(); document.getElementById('notifications-modal').remove()">
              Clear All
            </button>
          </div>
        </div>
      `;
      
      // Show modal
      modal.style.display = 'flex';
      
      // Add escape key handler
      const closeOnEscape = (e) => {
        if (e.key === 'Escape') {
          modal.remove();
          document.removeEventListener('keydown', closeOnEscape);
        }
      };
      document.addEventListener('keydown', closeOnEscape);
      
    } catch (error) {
      console.error('Error showing all notifications:', error);
    }
  }
};

// Error message helper
function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  
  // Firebase errors
  if (error.code) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
      'auth/invalid-email': 'Invalid email address format.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
      'firestore/permission-denied': 'You don\'t have permission to perform this action.',
      'firestore/unavailable': 'The Firestore service is temporarily unavailable.',
      'link/not-found': 'This sales link no longer exists or has been deactivated.',
      'link/already-processed': 'This click has already been processed.',
      'link/rate-limit': 'Too many clicks from the same source.',
    };
    
    return errorMessages[error.code] || error.message || 'An unknown error occurred.';
  }
  
  return error.message || 'An unknown error occurred.';
}

// Export for use in other modules
export { NotificationSystem, getErrorMessage };
