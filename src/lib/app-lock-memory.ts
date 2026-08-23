import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_LOCK_ENABLED_KEY = 'alkansyaph.appLockEnabled';

export async function getAppLockEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(APP_LOCK_ENABLED_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(APP_LOCK_ENABLED_KEY, enabled ? '1' : '0');
  } catch {
    // best-effort -- worst case the preference doesn't stick
  }
}
