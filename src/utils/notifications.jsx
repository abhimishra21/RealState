import { createRoot } from 'react-dom/client';
import { SnackbarProvider, useSnackbar } from 'notistack';
import React from 'react';

// Create a notification utility
let notify = null;

const NotificationProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  notify = enqueueSnackbar;
  return children;
};

// Create a root element for notifications
const notificationRoot = document.createElement('div');
document.body.appendChild(notificationRoot);
const root = createRoot(notificationRoot);
root.render(
  <SnackbarProvider maxSnack={3}>
    <NotificationProvider>
      <div id="notification-container" />
    </NotificationProvider>
  </SnackbarProvider>
);

export const showNotification = (message, options = {}) => {
  if (notify) {
    notify(message, {
      variant: 'info',
      persist: false,
      ...options
    });
  }
}; 