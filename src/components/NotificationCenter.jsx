import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaTag, FaHome, FaHandshake } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import io from 'socket.io-client';
import { authAPI } from '../services/api';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupSocketConnection();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      if (!user?._id) {
        console.error('No user ID available');
        return;
      }

      const response = await notificationAPI.getUserNotifications(user._id);
      if (response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Try to refresh token
        try {
          const refreshSuccess = await authAPI.refreshToken();
          if (refreshSuccess) {
            // Retry fetching notifications
            return fetchNotifications();
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to fetch notifications', 
        { variant: 'error' }
      );
    }
  };

  const setupSocketConnection = () => {
    try {
      if (!user?._id) {
        console.error('No user ID available for socket connection');
        return;
      }

      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          token: localStorage.getItem('refreshToken')
        }
      });
      
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        newSocket.emit('join-user-room', user._id);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        if (error.message.includes('authentication')) {
          // Try to refresh token
          authAPI.refreshToken().then(refreshSuccess => {
            if (refreshSuccess) {
              // Reconnect socket with new token
              newSocket.auth = { token: localStorage.getItem('refreshToken') };
              newSocket.connect();
            }
          });
        } else {
          enqueueSnackbar('Real-time notifications are currently unavailable', { 
            variant: 'warning',
            persist: false
          });
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('notification', (notification) => {
        console.log('New notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        enqueueSnackbar(notification.message, {
          variant: 'info',
          preventDuplicate: true
        });
      });

      return () => {
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('Error setting up socket connection:', error);
      enqueueSnackbar('Failed to setup real-time notifications', { 
        variant: 'error',
        persist: false
      });
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      enqueueSnackbar('Notification marked as read', { variant: 'success' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to mark notification as read', 
        { variant: 'error' }
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      enqueueSnackbar('All notifications marked as read', { variant: 'success' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to mark all notifications as read', 
        { variant: 'error' }
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(prev =>
        prev.filter(n => n._id !== notificationId)
      );
      setUnreadCount(prev =>
        notifications.find(n => n._id === notificationId)?.read ? prev : Math.max(0, prev - 1)
      );
      enqueueSnackbar('Notification deleted', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to delete notification', 
        { variant: 'error' }
      );
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'PRICE_DROP':
        return <FaTag className="text-green-500" />;
      case 'AVAILABILITY':
        return <FaHome className="text-blue-500" />;
      case 'OFFER':
        return <FaHandshake className="text-purple-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  // Test notification function
  const testNotification = async () => {
    try {
      await notificationAPI.testNotification({
        userId: user._id,
        type: 'TEST',
        message: 'This is a test notification'
      });
      enqueueSnackbar('Test notification sent', { variant: 'success' });
    } catch (error) {
      console.error('Error sending test notification:', error);
      enqueueSnackbar('Failed to send test notification', { variant: 'error' });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-primary transition-all ease-in-out"
      >
        <FaBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
                {!isConnected && (
                  <span className="ml-2 text-xs text-yellow-500">(Offline)</span>
                )}
              </h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={testNotification}
                  className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                >
                  Test
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
                      !notification.read ? 'bg-gray-50 dark:bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <span className="text-xs">Mark as read</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <FaTimes className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 