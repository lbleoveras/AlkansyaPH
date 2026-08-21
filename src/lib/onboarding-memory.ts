import AsyncStorage from '@react-native-async-storage/async-storage';

// Set at the moment someone signs up (before we even know their user id, if
// email confirmation is required) and consumed once after their first real
// authenticated session lands -- so onboarding shows exactly once, right
// after signup, regardless of whether email verification sits in between.
function key(email: string): string {
  return `alkansyaph.pendingOnboarding.${email.trim().toLowerCase()}`;
}

export async function markOnboardingPending(email: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key(email), '1');
  } catch {
    // best-effort -- worst case the user just doesn't see onboarding
  }
}

export async function consumeOnboardingPending(email: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(key(email));
    if (value) await AsyncStorage.removeItem(key(email));
    return value === '1';
  } catch {
    return false;
  }
}
