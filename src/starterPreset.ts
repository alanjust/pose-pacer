import { Preset } from './types';

// ---------------------------------------------------------------------------
// Default presets shipped with the app.
// Instructors can edit or delete them freely.
// ---------------------------------------------------------------------------

function mins(m: number): number { return m * 60; }
function secs(s: number): number { return s; }

let _id = 1;
function uid(): string { return `starter-${_id++}`; }

// ---------------------------------------------------------------------------
// 1. 2 Hour Session — 20 modules, 120 min
// ---------------------------------------------------------------------------
export const PRESET_2HR: Preset = {
  id: 'starter-2hr',
  name: '2 Hour Session',
  totalSessionSeconds: mins(120),
  createdAt: 0,
  updatedAt: 0,
  modules: [
    // Gesture warm-up: 4 × 30s
    { id: uid(), type: 'pose', durationSeconds: secs(30), label: 'Gesture warm-up', startSound: 'single', endSound: 'single', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: secs(30), label: 'Gesture warm-up', startSound: 'single', endSound: 'single', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: secs(30), label: 'Gesture warm-up', startSound: 'single', endSound: 'single', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: secs(30), label: 'Gesture warm-up', startSound: 'single', endSound: 'single', leadIn: false },
    // Gesture warm-up: 2 × 1m
    { id: uid(), type: 'pose', durationSeconds: mins(1), label: 'Gesture warm-up', startSound: 'single', endSound: 'single', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(1), label: 'Gesture warm-up', startSound: 'single', endSound: 'single', leadIn: false },
    // Gesture warm-up: 3 × 2m
    { id: uid(), type: 'pose', durationSeconds: mins(2), label: 'Gesture warm-up', startSound: 'single', endSound: 'double', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(2), label: 'Gesture warm-up', startSound: 'single', endSound: 'double', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(2), label: 'Gesture warm-up', startSound: 'single', endSound: 'double', leadIn: false },
    // Break
    { id: uid(), type: 'break', durationSeconds: mins(5), label: 'Break', startSound: 'single', endSound: 'single', leadIn: false },
    // 5-minute poses
    { id: uid(), type: 'pose', durationSeconds: mins(5), label: '5-minute pose', startSound: 'single', endSound: 'double', leadIn: true },
    { id: uid(), type: 'pose', durationSeconds: mins(5), label: '5-minute pose', startSound: 'single', endSound: 'double', leadIn: true },
    // 10-minute poses
    { id: uid(), type: 'pose', durationSeconds: mins(10), label: '10-minute pose', startSound: 'single', endSound: 'double', leadIn: true, warningThresholdSeconds: 60 },
    { id: uid(), type: 'pose', durationSeconds: mins(10), label: '10-minute pose', startSound: 'single', endSound: 'double', leadIn: true, warningThresholdSeconds: 60 },
    // Break + 3 long poses
    { id: uid(), type: 'break', durationSeconds: mins(5), label: 'Break', startSound: 'single', endSound: 'single', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(20), label: 'Long pose', startSound: 'single', endSound: 'double', leadIn: true, warningThresholdSeconds: 300 },
    { id: uid(), type: 'break', durationSeconds: mins(5), label: 'Break', startSound: 'single', endSound: 'single', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(20), label: 'Long pose', startSound: 'single', endSound: 'double', leadIn: true, warningThresholdSeconds: 300 },
    { id: uid(), type: 'break', durationSeconds: mins(5), label: 'Break', startSound: 'single', endSound: 'single', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(20), label: 'Long pose', startSound: 'single', endSound: 'double', leadIn: true, warningThresholdSeconds: 300 },
  ],
};

// ---------------------------------------------------------------------------
// 2. 30 Minute Gesture Sprint — 12 modules, 30 min
// ---------------------------------------------------------------------------
export const PRESET_30MIN: Preset = {
  id: 'starter-30min',
  name: '30 Minute Gesture Sprint',
  totalSessionSeconds: mins(30),
  createdAt: 0,
  updatedAt: 0,
  modules: [
    // 3 × 1m
    { id: uid(), type: 'pose', durationSeconds: mins(1), label: 'Pose', startSound: 'single', endSound: 'single', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(1), label: 'Pose', startSound: 'single', endSound: 'single', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(1), label: 'Pose', startSound: 'single', endSound: 'single', leadIn: false },
    // 4 × 2m
    { id: uid(), type: 'pose', durationSeconds: mins(2), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(2), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(2), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(2), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: false },
    // 3 × 3m
    { id: uid(), type: 'pose', durationSeconds: mins(3), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(3), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(3), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: false },
    // 2 × 5m
    { id: uid(), type: 'pose', durationSeconds: mins(5), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: true },
    { id: uid(), type: 'pose', durationSeconds: mins(5), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: true },
  ],
};

// ---------------------------------------------------------------------------
// 3. 1 Hour Long Pose Set — 3 modules, 60 min
// ---------------------------------------------------------------------------
export const PRESET_1HR_LONG: Preset = {
  id: 'starter-1hr-long',
  name: '1 Hour Long Pose Set',
  totalSessionSeconds: mins(60),
  createdAt: 0,
  updatedAt: 0,
  modules: [
    { id: uid(), type: 'pose', durationSeconds: mins(29), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: true, warningThresholdSeconds: 300 },
    { id: uid(), type: 'break', durationSeconds: mins(2), label: 'Break', startSound: 'single', endSound: 'single', leadIn: false },
    { id: uid(), type: 'pose', durationSeconds: mins(29), label: 'Pose', startSound: 'single', endSound: 'double', leadIn: true, warningThresholdSeconds: 300 },
  ],
};

// ---------------------------------------------------------------------------
// All starter presets in display order
// ---------------------------------------------------------------------------
export const STARTER_PRESETS: Preset[] = [PRESET_2HR, PRESET_30MIN, PRESET_1HR_LONG];

// Keep for backwards compatibility
export const STARTER_PRESET = PRESET_2HR;
