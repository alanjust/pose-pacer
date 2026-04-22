import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { SoundChoice, Module } from './types';

// ---------------------------------------------------------------------------
// Audio session — call once at app startup
// ---------------------------------------------------------------------------
export async function configureAudioSession(): Promise<void> {
  await Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    interruptionModeIOS: 1,   // duck others
    shouldDuckAndroid: true,
    interruptionModeAndroid: 1,
    playThroughEarpieceAndroid: false,
  });
}

// ---------------------------------------------------------------------------
// Notification handler — set once at app startup
// ---------------------------------------------------------------------------
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,   // foreground sound is played directly; background uses notification sound
      shouldSetBadge: false,
    }),
  });
}

// ---------------------------------------------------------------------------
// Request notification permissions
// ---------------------------------------------------------------------------
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ---------------------------------------------------------------------------
// App-wide volume (0.0 – 1.0) — set once at startup, updated from Settings
// ---------------------------------------------------------------------------
let appVolume   = 1.0;
let voiceEnabled = true;
let dingEnabled  = true;

export function setAppVolume(v: number): void { appVolume = Math.min(1, Math.max(0, v)); }
export function getAppVolume(): number { return appVolume; }

export function setVoiceEnabled(v: boolean): void { voiceEnabled = v; }
export function getVoiceEnabled(): boolean { return voiceEnabled; }

export function setDingEnabled(v: boolean): void { dingEnabled = v; }
export function getDingEnabled(): boolean { return dingEnabled; }

// ---------------------------------------------------------------------------
// Immediate sound playback (foreground)
// ---------------------------------------------------------------------------
const soundFiles: Record<SoundChoice, ReturnType<typeof require>> = {
  single: require('../assets/sounds/ding_single.wav'),
  double: require('../assets/sounds/ding_double.wav'),
};

export async function playSound(which: SoundChoice): Promise<void> {
  if (!dingEnabled) return;
  try {
    const { sound } = await Audio.Sound.createAsync(soundFiles[which]);
    await sound.setVolumeAsync(appVolume);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) {
    console.warn('playSound error:', e);
  }
}

// ---------------------------------------------------------------------------
// Schedule a notification to fire at a specific future timestamp
// Returns the notification ID (use to cancel on skip/pause)
// ---------------------------------------------------------------------------
export async function scheduleEndNotification(
  fireAtMs: number,
  sound: SoundChoice = 'double'
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time',
      body: 'Pose complete.',
      sound: dingEnabled,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Math.max(Date.now() + 1000, fireAtMs)),
    },
  });
  return id;
}

export async function cancelNotification(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

// ---------------------------------------------------------------------------
// Voice selection — find the best available English voice at startup
// ---------------------------------------------------------------------------

// Stored after initBestVoice() runs; undefined = use system default
let bestVoiceId: string | undefined;

export async function initBestVoice(): Promise<void> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();

    // Only consider US English voices
    const english = voices.filter(
      v => v.language?.startsWith('en') && v.identifier
    );

    // Quality ranking: premium > enhanced > anything else
    // iOS identifiers contain these keywords for the better voices
    const premium  = english.find(v => v.identifier.includes('premium'));
    const enhanced = english.find(v => v.identifier.includes('enhanced'));
    const fallback = english[0];

    bestVoiceId = (premium ?? enhanced ?? fallback)?.identifier;
  } catch {
    bestVoiceId = undefined; // fall back to system default silently
  }
}

// ---------------------------------------------------------------------------
// Announce the module that is about to start
// Called at the beginning of a lead-in (giving the model 10 s to prepare)
// or immediately after the start ding for modules with no lead-in.
// ---------------------------------------------------------------------------
export function announceModule(module: Module): void {
  if (!voiceEnabled) return;
  // Stop any speech already in progress (e.g. a leftover warning)
  Speech.stop();

  const type  = module.type === 'pose' ? 'pose' : 'break';
  const label = module.label;

  const mins = Math.floor(module.durationSeconds / 60);
  const secs = module.durationSeconds % 60;

  let durationText: string;
  if (mins > 0 && secs > 0) {
    durationText = `${mins} minute${mins !== 1 ? 's' : ''} ${secs} seconds`;
  } else if (mins > 0) {
    durationText = `${mins} minute${mins !== 1 ? 's' : ''}`;
  } else {
    durationText = `${secs} seconds`;
  }

  // "Next pose: Gesture warm-up. One minute."
  // "Next break. Ten minutes."
  const intro = label ? `Next ${type}: ${label}.` : `Next ${type}.`;

  Speech.speak(`${intro} ${durationText}.`, {
    language: 'en-US',
    rate: 0.88,
    volume: appVolume,
    ...(bestVoiceId ? { voice: bestVoiceId } : {}),
  });
}

// ---------------------------------------------------------------------------
// Verbal countdown warning using text-to-speech
// ---------------------------------------------------------------------------
export function speakWarning(text: string): void {
  if (!voiceEnabled) return;
  Speech.speak(text, {
    language: 'en-US',
    rate: 0.9,
    volume: appVolume,
    ...(bestVoiceId ? { voice: bestVoiceId } : {}),
  });
}

// ---------------------------------------------------------------------------
// Format seconds -> "1:30" or "45"
// ---------------------------------------------------------------------------
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}
