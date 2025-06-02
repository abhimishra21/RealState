import { useState } from 'react';
import { notificationAPI } from '../services/api';
import { useSnackbar } from 'notistack';

export default function TestNotifications() {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const sendTestNotification = async (type) => {
    setLoading(true);
    try {
      let message, data;
      
      switch (type) {
        case 'PRICE_DROP':
          message = 'Price dropped by $50,000 for Luxury Villa';
          data = {
            oldPrice: 500000,
            newPrice: 450000,
            priceDrop: 50000
          };
          break;
        case 'AVAILABILITY':
          message = 'Luxury Villa is now available for viewing';
          data = {
            available: true
          };
          break;
        case 'OFFER':
          message = 'New offer received for Luxury Villa';
          data = {
            offerAmount: 475000,
            offerMessage: 'I am interested in your property'
          };
          break;
        default:
          message = 'Test notification';
          data = {};
      }

      const response = await notificationAPI.testNotification({
        type,
        message,
        data,
        listingId: '65f1a2b3c4d5e6f7g8h9i0j1'
      });

      if (response.data) {
        enqueueSnackbar('Test notification sent successfully', { 
          variant: 'success',
          preventDuplicate: true 
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to send test notification', { 
        variant: 'error',
        preventDuplicate: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Test Notifications
      </h2>
      <div className="space-y-2">
        <button
          onClick={() => sendTestNotification('PRICE_DROP')}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : 'Send Price Drop Notification'}
        </button>
        <button
          onClick={() => sendTestNotification('AVAILABILITY')}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : 'Send Availability Notification'}
        </button>
        <button
          onClick={() => sendTestNotification('OFFER')}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : 'Send Offer Notification'}
        </button>
      </div>
    </div>
  );
} 