import axios from './axios';

// VAPID public key from environment variable
// Set VITE_VAPID_PUBLIC_KEY in your deployment platform environment variables
// For development, falls back to placeholder key (generate real keys for production)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HIvH2kK5SxJLtybTewVUzXJQlYjYgFK8Z_DuoZcFQ2xrtQH0FwEQoI-c7M';

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushNotificationSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  // Check current permission first
  const currentPermission = Notification.permission;
  
  // If already denied, we can't request again
  if (currentPermission === 'denied') {
    throw new Error('PERMISSION_DENIED');
  }
  
  // If already granted, no need to request again
  if (currentPermission === 'granted') {
    return true;
  }

  // Request permission (only works if status is 'default')
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    return true;
  } else if (permission === 'denied') {
    throw new Error('PERMISSION_DENIED');
  } else {
    throw new Error('Notification permission not granted');
  }
}

// Get current notification permission
export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(notificationPreferences = {}) {
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    // Register service worker if not already registered
    let registration = await navigator.serviceWorker.ready;

    // Request notification permission
    await requestNotificationPermission();

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Send subscription to backend
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth')),
      },
      notificationPreferences,
    };

    const response = await axios.post('/api/notifications/push/subscribe', subscriptionData);

    return {
      success: true,
      subscription: response.data.data,
    };
  } catch (error) {
    logger.error('Error subscribing to push notifications:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from push service
      await subscription.unsubscribe();

      // Remove from backend
      await axios.delete('/api/notifications/push/unsubscribe', {
        data: { endpoint: subscription.endpoint },
      });

      return { success: true };
    }

    return { success: true, message: 'No active subscription found' };
  } catch (error) {
    logger.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
}

// Get current subscription
export async function getPushSubscription() {
  try {
    const response = await axios.get('/api/notifications/push/subscription');
    return response.data.data;
  } catch (error) {
    logger.error('Error getting push subscription:', error);
    return null;
  }
}

// Update notification preferences
export async function updateNotificationPreferences(preferences) {
  try {
    const response = await axios.patch('/api/notifications/push/preferences', {
      notificationPreferences: preferences,
    });
    return response.data.data;
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    throw error;
  }
}

// Check if user is subscribed
export async function isSubscribed() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    logger.error('Error checking subscription:', error);
    return false;
  }
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

