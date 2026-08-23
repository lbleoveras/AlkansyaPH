import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

type AppReleaseRow = {
  latest_version: string;
  download_url: string;
  release_notes: string | null;
};

function isVersionNewer(latest: string, current: string): boolean {
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);
  const length = Math.max(latestParts.length, currentParts.length);
  for (let i = 0; i < length; i++) {
    const l = latestParts[i] ?? 0;
    const c = currentParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

async function fetchLatestRelease(platform: string): Promise<AppReleaseRow | null> {
  const { data, error } = await supabase
    .from('app_releases')
    .select('latest_version, download_url, release_notes')
    .eq('platform', platform)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Only meaningful on native -- the web build has no APK to install and no
// version-pinned binary to fall behind.
export function useAppUpdateCheck() {
  const platform = Platform.OS;
  const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

  const query = useQuery({
    queryKey: ['app-release', platform],
    queryFn: () => fetchLatestRelease(platform),
    enabled: platform === 'android' || platform === 'ios',
    staleTime: 60 * 60_000,
  });

  const release = query.data;
  const updateAvailable = !!release && isVersionNewer(release.latest_version, currentVersion);

  return {
    updateAvailable,
    latestVersion: release?.latest_version,
    downloadUrl: release?.download_url,
    releaseNotes: release?.release_notes,
  };
}
