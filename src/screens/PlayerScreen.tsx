import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  AppState, AppStateStatus,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useKeepAwake } from 'expo-keep-awake';
import { RootStackParamList, Module } from '../types';
import {
  playSound, scheduleEndNotification, cancelNotification,
  speakWarning, announceModule, formatDuration,
} from '../audio';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;
type Phase = 'leadIn' | 'running' | 'paused' | 'done';

// One entry per module in the session timeline
interface ModuleEntry {
  moduleIndex: number;
  runStartMs: number;  // when the actual countdown begins (after any lead-in)
  endMs: number;       // when the module ends
  notifId: string;     // notification ID for the end sound
}

// Gap between end sound and next module's start sound (ms)
const INTER_MODULE_GAP_MS = 1500;

export default function PlayerScreen({ navigation, route }: Props) {
  const { modules } = route.params;
  useKeepAwake();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // ── Refs: mutable session state for use in intervals/callbacks ─────────────
  const phaseRef    = useRef<Phase>('leadIn');
  const indexRef    = useRef(0);
  const endTimeMsRef = useRef(0);
  const warningFiredRef = useRef(false);
  const pausedSecsRef   = useRef<number | null>(null);
  const pausedPhaseRef  = useRef<'leadIn' | 'running'>('running');
  const busyRef     = useRef(false);
  const timelineRef = useRef<ModuleEntry[]>([]);  // full session schedule

  // ── Display state ──────────────────────────────────────────────────────────
  const [phase,         setPhase]         = useState<Phase>('leadIn');
  const [index,         setIndex]         = useState(0);
  const [seconds,       setSeconds]       = useState(0);
  const [totalSecsLeft, setTotalSecsLeft] = useState(0);

  function setPhaseSync(p: Phase) { phaseRef.current = p; setPhase(p); }
  function setIndexSync(i: number) { indexRef.current = i; setIndex(i); }

  function updateTotalSecsLeft() {
    const last = timelineRef.current[timelineRef.current.length - 1];
    if (last) setTotalSecsLeft(Math.max(0, Math.ceil((last.endMs - Date.now()) / 1000)));
  }

  // ── Timeline: calculate and schedule ALL module notifications up front ─────
  //
  // This is the key to locked-screen operation. iOS holds every notification
  // and fires them on schedule even while JS is completely suspended.
  // We schedule ALL end sounds now rather than one at a time.

  async function buildAndScheduleTimeline(
    startIndex: number,
    startMs: number,
  ): Promise<ModuleEntry[]> {
    const entries: ModuleEntry[] = [];
    let t = startMs;

    for (let i = startIndex; i < modules.length; i++) {
      const mod = modules[i];
      if (mod.leadIn) t += 10_000;      // lead-in is 10 s
      const runStartMs = t;
      t += mod.durationSeconds * 1000;
      const endMs = t;
      const notifId = await scheduleEndNotification(endMs, mod.endSound);
      entries.push({ moduleIndex: i, runStartMs, endMs, notifId });
    }

    return entries;
  }

  async function cancelAllNotifications() {
    const ids = timelineRef.current.map(e => e.notifId);
    await Promise.all(ids.map(id => cancelNotification(id)));
    timelineRef.current = [];
  }

  // ── Session initialisation ─────────────────────────────────────────────────

  async function initSession() {
    busyRef.current = true;
    const now = Date.now();

    // Build the full timeline and schedule every end-notification in one go
    const timeline = await buildAndScheduleTimeline(0, now);
    timelineRef.current = timeline;

    const firstEntry = timeline[0];
    const firstMod   = modules[0];

    setIndexSync(0);
    warningFiredRef.current = false;

    if (firstMod.leadIn) {
      // Lead-in: announce the module now so the model has 10 s to prepare
      announceModule(firstMod);
      endTimeMsRef.current = firstEntry.runStartMs;
      setPhaseSync('leadIn');
      setSeconds(10);
    } else {
      await playSound(firstMod.startSound);
      announceModule(firstMod);
      endTimeMsRef.current = firstEntry.endMs;
      setPhaseSync('running');
      setSeconds(Math.max(0, Math.ceil((firstEntry.endMs - Date.now()) / 1000)));
    }

    busyRef.current = false;
  }

  // ── Foreground module transition ───────────────────────────────────────────
  //
  // Looks up the pre-scheduled timeline entry and updates the display.
  // Does NOT schedule a new notification — it's already in the timeline.

  async function transitionToModule(idx: number) {
    if (idx >= modules.length) {
      setPhaseSync('done');
      busyRef.current = false;
      return;
    }

    const entry = timelineRef.current.find(e => e.moduleIndex === idx);
    if (!entry) {
      setPhaseSync('done');
      busyRef.current = false;
      return;
    }

    const mod = modules[idx];
    setIndexSync(idx);
    warningFiredRef.current = false;

    const now = Date.now();

    if (mod.leadIn && now < entry.runStartMs) {
      // Lead-in: announce now so the model has time to prepare
      announceModule(mod);
      endTimeMsRef.current = entry.runStartMs;
      setPhaseSync('leadIn');
      setSeconds(Math.max(0, Math.ceil((entry.runStartMs - now) / 1000)));
    } else {
      // No lead-in: ding then announce
      await playSound(mod.startSound);
      announceModule(mod);
      endTimeMsRef.current = entry.endMs;
      setPhaseSync('running');
      setSeconds(Math.max(0, Math.ceil((entry.endMs - Date.now()) / 1000)));
    }

    busyRef.current = false;
  }

  // ── Tick: 500 ms interval, reads only refs ─────────────────────────────────

  useEffect(() => {
    const iv = setInterval(async () => {
      const p = phaseRef.current;
      if (p === 'paused' || p === 'done') return;
      if (busyRef.current) return;

      const secsLeft = Math.max(0, Math.ceil((endTimeMsRef.current - Date.now()) / 1000));
      setSeconds(secsLeft);
      updateTotalSecsLeft();

      // Verbal warning (running phase only)
      if (p === 'running' && !warningFiredRef.current) {
        const mod = modules[indexRef.current];
        if (mod.warningThresholdSeconds != null && secsLeft > 0 && secsLeft <= mod.warningThresholdSeconds) {
          warningFiredRef.current = true;
          const m = Math.floor(secsLeft / 60);
          const s = secsLeft % 60;
          speakWarning(m > 0 ? `${m} minute${m > 1 ? 's' : ''} remaining` : `${s} seconds`);
        }
      }

      if (secsLeft > 0) return;

      // ── Phase transition ───────────────────────────────────────────────────
      busyRef.current = true;

      if (p === 'leadIn') {
        // Lead-in finished: ding and begin running (announcement was already
        // spoken at the start of the lead-in, so no repeat here)
        const mod   = modules[indexRef.current];
        const entry = timelineRef.current.find(e => e.moduleIndex === indexRef.current);
        await playSound(mod.startSound);
        endTimeMsRef.current = entry?.endMs ?? 0;
        warningFiredRef.current = false;
        setPhaseSync('running');
        setSeconds(Math.max(0, Math.ceil(((entry?.endMs ?? 0) - Date.now()) / 1000)));
        busyRef.current = false;

      } else if (p === 'running') {
        // How long ago did this module actually end?
        const expiredMs = Date.now() - endTimeMsRef.current;

        if (expiredMs <= 2000) {
          // ── Live foreground transition ─────────────────────────────────────
          // Module ended just now while the screen was on. Play sounds and
          // wait the deliberate gap before the next start sound.
          const mod = modules[indexRef.current];
          await playSound(mod.endSound);
          await new Promise<void>(resolve => setTimeout(resolve, INTER_MODULE_GAP_MS));
          await transitionToModule(indexRef.current + 1);
          // busyRef cleared inside transitionToModule

        } else {
          // ── Recovery after screen lock ────────────────────────────────────
          // Module ended while JS was suspended. The notification already
          // played the end sound. Don't replay it — just snap the display to
          // wherever the session actually is right now.
          syncToTimeline();
          // busyRef cleared inside syncToTimeline
        }
      }
    }, 500);

    return () => clearInterval(iv);
  }, []); // [] — all state is read through refs

  // ── Sync display to the timeline's current module ─────────────────────────
  //
  // Used both by the AppState handler (after screen unlock) and by the tick
  // when recovering from a lock. Looks at real time vs the pre-scheduled
  // timeline and jumps the display to wherever the session actually is.

  function syncToTimeline() {
    const now   = Date.now();
    const entry = timelineRef.current.find(e => e.endMs > now);

    if (!entry) {
      setPhaseSync('done');
      busyRef.current = false;
      return;
    }

    setIndexSync(entry.moduleIndex);
    warningFiredRef.current = false;

    if (now < entry.runStartMs) {
      endTimeMsRef.current = entry.runStartMs;
      setPhaseSync('leadIn');
      setSeconds(Math.max(0, Math.ceil((entry.runStartMs - now) / 1000)));
    } else {
      endTimeMsRef.current = entry.endMs;
      setPhaseSync('running');
      setSeconds(Math.max(0, Math.ceil((entry.endMs - now) / 1000)));
    }

    updateTotalSecsLeft();
    busyRef.current = false;
  }

  // ── AppState: sync display when app foregrounds after screen lock ──────────
  //
  // Force-clears busyRef first — JS may have been suspended mid-transition,
  // leaving the lock set. Notifications already fired on schedule while locked;
  // we just need to update the display to match.

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next !== 'active') return;

      const p = phaseRef.current;
      if (p === 'paused' || p === 'done') return;

      // Always reset the busy lock on wake — any in-progress async operation
      // that was suspended will complete harmlessly since we're about to
      // overwrite all display state from the timeline anyway.
      busyRef.current = false;

      syncToTimeline();
    });

    return () => sub.remove();
  }, []);

  // ── Kick off ───────────────────────────────────────────────────────────────

  useEffect(() => {
    initSession();
  }, []);

  // ── Controls ───────────────────────────────────────────────────────────────

  async function handlePauseResume() {
    const p = phaseRef.current;

    if (p === 'running' || p === 'leadIn') {
      // Pause: endTimeMsRef points to runStartMs during lead-in, endMs during running
      // — either way, remaining seconds from it is the right value to save.
      const secsLeft = Math.max(1, Math.ceil((endTimeMsRef.current - Date.now()) / 1000));
      pausedSecsRef.current  = secsLeft;
      pausedPhaseRef.current = p;
      await cancelAllNotifications();
      setPhaseSync('paused');
      setSeconds(secsLeft);

    } else if (p === 'paused') {
      const idx      = indexRef.current;
      const secsLeft = pausedSecsRef.current ?? 0;
      const now      = Date.now();
      const entries: ModuleEntry[] = [];

      if (pausedPhaseRef.current === 'leadIn') {
        // Resume mid-lead-in: push runStartMs into the future by remaining lead-in secs
        const newRunStartMs = now + secsLeft * 1000;
        const newEndMs      = newRunStartMs + modules[idx].durationSeconds * 1000;
        const notifId = await scheduleEndNotification(newEndMs, modules[idx].endSound);
        entries.push({ moduleIndex: idx, runStartMs: newRunStartMs, endMs: newEndMs, notifId });
        endTimeMsRef.current = newRunStartMs; // interval still counts down to lead-in end

        // Remaining modules follow in sequence
        let t = newEndMs;
        for (let i = idx + 1; i < modules.length; i++) {
          const mod = modules[i];
          if (mod.leadIn) t += 10_000;
          const runStartMs = t;
          t += mod.durationSeconds * 1000;
          const notifId = await scheduleEndNotification(t, mod.endSound);
          entries.push({ moduleIndex: i, runStartMs, endMs: t, notifId });
        }

        timelineRef.current = entries;
        setPhaseSync('leadIn');

      } else {
        // Resume mid-run: same as before
        const currentEndMs   = now + secsLeft * 1000;
        const currentNotifId = await scheduleEndNotification(currentEndMs, modules[idx].endSound);
        entries.push({ moduleIndex: idx, runStartMs: now, endMs: currentEndMs, notifId: currentNotifId });

        let t = currentEndMs;
        for (let i = idx + 1; i < modules.length; i++) {
          const mod = modules[i];
          if (mod.leadIn) t += 10_000;
          const runStartMs = t;
          t += mod.durationSeconds * 1000;
          const notifId = await scheduleEndNotification(t, mod.endSound);
          entries.push({ moduleIndex: i, runStartMs, endMs: t, notifId });
        }

        timelineRef.current  = entries;
        endTimeMsRef.current = currentEndMs;
        setPhaseSync('running');
      }
    }
  }

  async function handleSkip() {
    if (phaseRef.current === 'done') return;
    if (busyRef.current) return;
    busyRef.current = true;

    const nextIdx = indexRef.current + 1;

    // Cancel all existing notifications and rebuild from next module
    await cancelAllNotifications();

    if (nextIdx >= modules.length) {
      setPhaseSync('done');
      busyRef.current = false;
      return;
    }

    const now      = Date.now();
    const timeline = await buildAndScheduleTimeline(nextIdx, now);
    timelineRef.current = timeline;

    await transitionToModule(nextIdx);
    // busyRef cleared inside transitionToModule
  }

  function handleStop() {
    cancelAllNotifications();
    navigation.goBack();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function formatTotalRemaining(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // ── Render: session complete ───────────────────────────────────────────────

  if (phase === 'done') {
    return (
      <View style={styles.container}>
        <Text style={styles.doneCheck}>✓</Text>
        <Text style={styles.doneTitle}>Session complete.</Text>
        <Text style={styles.doneSub}>Good work today.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>Back to Sessions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render: active session ─────────────────────────────────────────────────

  const mod = modules[index] ?? modules[0];
  const isPose = mod?.type === 'pose';
  const moduleLabel = mod?.label || (isPose ? 'Pose' : 'Break');

  const displayM = Math.floor(seconds / 60);
  const displayS = seconds % 60;
  const timeString = phase === 'leadIn'
    ? String(seconds)
    : `${displayM}:${displayS.toString().padStart(2, '0')}`;

  const nextMod   = index < modules.length - 1 ? modules[index + 1] : null;
  const nextLabel = nextMod
    ? (nextMod.label || (nextMod.type === 'pose' ? 'Pose' : 'Break'))
    : null;

  return (
    <View style={styles.container}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleStop}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.stopText}>✕ Stop</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>{index + 1} / {modules.length}</Text>
      </View>

      {/* Total session time remaining */}
      {totalSecsLeft > 0 && phase !== 'done' && (
        <Text style={styles.totalTime}>
          {formatTotalRemaining(totalSecsLeft)} remaining
        </Text>
      )}

      {/* Center */}
      <View style={styles.center}>

        {phase === 'leadIn' && (
          <Text style={styles.leadInLabel}>Starting in</Text>
        )}

        <Text style={[
          styles.timer,
          phase === 'paused'  && styles.timerPaused,
          phase === 'leadIn'  && styles.timerLeadIn,
        ]}>
          {timeString}
        </Text>

        {phase === 'paused' && (
          <Text style={styles.pausedBadge}>PAUSED</Text>
        )}

        <View style={[styles.typeBadge, isPose ? styles.typePose : styles.typeBreak]}>
          <Text style={styles.typeBadgeText}>{isPose ? 'POSE' : 'BREAK'}</Text>
        </View>

        <Text style={styles.moduleLabel}>{moduleLabel}</Text>
        <Text style={styles.moduleDuration}>{formatDuration(mod.durationSeconds)}</Text>

        {nextMod && (
          <Text style={styles.upNext}>
            Up next: {nextLabel} · {formatDuration(nextMod.durationSeconds)}
          </Text>
        )}
        {!nextMod && (
          <Text style={styles.upNext}>Last module</Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={handlePauseResume}
          disabled={phase === 'done'}
        >
          <Text style={styles.pauseBtnText}>
            {phase === 'paused' ? '▶  Resume' : '⏸  Pause'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>
            {index >= modules.length - 1 ? 'End Session' : 'Skip ›'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
  },
  stopText:     { color: '#c8803c', fontSize: 17 },
  progressText: { color: '#c8803c', fontSize: 17, fontWeight: '500' },
  totalTime: {
    textAlign: 'center',
    color: '#c8803c',
    fontSize: 15,
    letterSpacing: 0.3,
    paddingBottom: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  leadInLabel: {
    color: '#c8803c',
    fontSize: 18,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  timer: {
    color: '#ffffff',
    fontSize: 88,
    fontWeight: '100',
    letterSpacing: -2,
    marginBottom: 28,
  },
  timerLeadIn:  { fontSize: 102, color: '#c8803c' },
  timerPaused:  { color: '#777' },
  pausedBadge: {
    color: '#c8803c',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: -22,
    marginBottom: 28,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 14,
  },
  typePose:  { backgroundColor: '#1a3a6b' },
  typeBreak: { backgroundColor: '#4a2800' },
  typeBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  moduleLabel: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
  },
  moduleDuration: { color: '#c8803c', fontSize: 17 },
  upNext: {
    color: '#c8803c',
    fontSize: 15,
    marginTop: 36,
    textAlign: 'center',
    opacity: 0.6,
  },
  footer: {
    padding: 20,
    paddingBottom: 44,
    gap: 10,
  },
  pauseBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.25 },
  pauseBtnText: { color: '#fff', fontSize: 19, fontWeight: '500' },
  skipBtn: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  skipBtnText: { color: '#c8803c', fontSize: 17 },
  doneCheck: {
    color: '#1a6b3c',
    fontSize: 66,
    textAlign: 'center',
    marginBottom: 16,
  },
  doneTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  doneSub: {
    color: '#777',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 56,
  },
  doneBtn: {
    backgroundColor: '#1a6b3c',
    borderRadius: 14,
    paddingVertical: 18,
    marginHorizontal: 40,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
