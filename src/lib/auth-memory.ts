import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_EMAIL_KEY = 'alkansyaph.lastEmail';

export async function getRememberedEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_EMAIL_KEY);
  } catch {
    return null;
  }
}

export async function rememberEmail(email: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_EMAIL_KEY, email);
  } catch {
    // best-effort convenience only -- fine to lose silently
  }
}
