import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getEasProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

async function getPushToken(requestPermission: boolean): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators/web can't hold a real push token

  const projectId = getEasProjectId();
  if (!projectId) {
    // No EAS project configured yet (`eas init`) -- Expo Go can't deliver
    // remote push either way, so this is a silent no-op until a dev/prod
    // build exists.
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted' && requestPermission) {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token;
}

export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    const token = await getPushToken(true);
    if (!token) return;

    await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, expo_push_token: token, device_name: Device.deviceName ?? null },
        { onConflict: 'user_id,expo_push_token' },
      );
  } catch (err) {
    console.warn('[notifications] Registration failed (non-fatal):', err);
  }
}

export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    // Never prompt for permission on the way out -- only clean up a token
    // that was already granted and registered.
    const token = await getPushToken(false);
    if (!token) return;
    await supabase.from('push_tokens').delete().eq('user_id', userId).eq('expo_push_token', token);
  } catch (err) {
    console.warn('[notifications] Unregistration failed (non-fatal):', err);
  }
}
