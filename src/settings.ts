import AsyncStorage from '@react-native-async-storage/async-storage';

const VOLUME_KEY = 'app_volume';
const VOICE_KEY  = 'voice_enabled';
const DING_KEY   = 'ding_enabled';
const DEFAULT_VOLUME = 1.0;

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------
export async function loadVolume(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(VOLUME_KEY);
    if (raw === null) return DEFAULT_VOLUME;
    const v = parseFloat(raw);
    return isNaN(v) ? DEFAULT_VOLUME : Math.min(1, Math.max(0, v));
  } catch {
    return DEFAULT_VOLUME;
  }
}

export async function saveVolume(volume: number): Promise<void> {
  try { await AsyncStorage.setItem(VOLUME_KEY, String(volume)); } catch {}
}

// ---------------------------------------------------------------------------
// Voice (verbal pose announcements)
// ---------------------------------------------------------------------------
export async function loadVoiceEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(VOICE_KEY);
    return raw === null ? true : raw === 'true';
  } catch { return true; }
}

export async function saveVoiceEnabled(v: boolean): Promise<void> {
  try { await AsyncStorage.setItem(VOICE_KEY, String(v)); } catch {}
}

// ---------------------------------------------------------------------------
// Ding (start / end chimes)
// ---------------------------------------------------------------------------
export async function loadDingEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DING_KEY);
    return raw === null ? true : raw === 'true';
  } catch { return true; }
}

export async function saveDingEnabled(v: boolean): Promise<void> {
  try { await AsyncStorage.setItem(DING_KEY, String(v)); } catch {}
}
