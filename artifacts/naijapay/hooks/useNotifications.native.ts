import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  setupNotificationChannel,
} from '@/lib/notifications';

const NOTIF_PREF_KEY = '@zela_notifications_enabled';

export function useNotifications() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const listenerRef = useRef<Notifications.Subscription | null>(null);
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    init();
    return () => {
      listenerRef.current?.remove();
      responseListenerRef.current?.remove();
    };
  }, []);

  const init = async () => {
    try {
      await setupNotificationChannel();
      const [granted, prefRaw] = await Promise.all([
        getNotificationPermission(),
        AsyncStorage.getItem(NOTIF_PREF_KEY),
      ]);
      setHasPermission(granted);
      setIsEnabled(prefRaw === 'true' && granted);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const enable = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    if (granted) {
      await AsyncStorage.setItem(NOTIF_PREF_KEY, 'true');
      setIsEnabled(true);
    }
    return granted;
  }, []);

  const disable = useCallback(async () => {
    await AsyncStorage.setItem(NOTIF_PREF_KEY, 'false');
    setIsEnabled(false);
  }, []);

  const toggle = useCallback(async (val: boolean) => {
    if (val) return enable();
    await disable();
    return false;
  }, [enable, disable]);

  return { hasPermission, isEnabled, isLoading, enable, disable, toggle };
}
