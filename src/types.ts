// ---------------------------------------------------------------------------
// Core data types for Life Drawing Timer
// ---------------------------------------------------------------------------

export type ModuleType = 'pose' | 'break';
export type SoundChoice = 'single' | 'double';

export interface Module {
  id: string;
  type: ModuleType;
  durationSeconds: number;
  label?: string;
  startSound: SoundChoice;
  endSound: SoundChoice;
  leadIn: boolean;                      // 10-second "get ready" countdown before module
  warningThresholdSeconds?: number;     // verbal warning at this many seconds remaining
}

export interface Preset {
  id: string;
  name: string;
  totalSessionSeconds: number;          // instructor-declared target duration
  modules: Module[];
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Session runtime — never persisted, lives only in PlayerScreen state
// ---------------------------------------------------------------------------

export type SessionPhase = 'idle' | 'leadIn' | 'running' | 'paused' | 'done';

export interface SessionState {
  modules: Module[];                    // working copy — editable during session
  currentIndex: number;
  phase: SessionPhase;
  endTimeMs: number | null;            // absolute timestamp — the right way to track time
  pausedSecondsLeft: number | null;    // saved when paused
  notifId: string | null;             // scheduled notification id (cancel on skip/pause)
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Help: undefined;
  Settings: undefined;
  Builder: { presetId?: string; isNewSession?: boolean };
  Player: { modules: Module[]; totalSessionSeconds: number };
};
