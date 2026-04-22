# Life Drawing Timer — CLAUDE.md

## Project Overview

**App name:** Life Drawing Timer (working title)
**Type:** React Native Expo app — modular session timer for figure drawing practice
**Feature spec:** See ROADMAP.md for full specifications

---

## Stack

- **Framework:** React Native + Expo (managed workflow)
- **Language:** TypeScript
- **Storage:** Local device only — no backend, no auth, no network required
- **Target platform:** iOS first; all architecture decisions must be Android-compatible

---

## Key Packages

| Package | Purpose |
|---|---|
| `expo-keep-awake` | Prevent screen from sleeping during active sessions |
| `expo-av` | Foreground audio playback |
| `expo-notifications` | Background/locked-screen audio alerts — scheduled at exact timestamps |
| `expo-speech` | Verbal countdown warnings ("30 seconds remaining") |
| `@react-navigation/native-stack` | Screen navigation (Home → Builder → Player) |
| `@react-native-async-storage/async-storage` | Local preset storage |
| `react-native-gesture-handler` | Required by navigation; imported in `index.ts` |
| `react-native-screens` | Required by navigation; native module |
| `react-native-reanimated` | Installed, Babel plugin disabled — do not enable without Xcode rebuild |
| `react-native-draggable-flatlist` | Installed, not yet wired — for drag-to-reorder when reanimated is enabled |

---

## Critical Technical Constraints

These are non-negotiable and take priority over all other concerns:

1. **Screen must stay awake** during active timer sessions using `expo-keep-awake`. Never let the OS dim or lock the screen while a session is running.

2. **Audio must play in background and when the screen is locked.** Use `expo-av` with the correct iOS audio session configuration (`staysActiveInBackground: true`, `interruptionModeIOS` set to duck others or mix). Test this early — it requires specific `app.json` permissions and `Info.plist` entries.

3. **Timer must continue running during phone calls.** Handle audio interruption events gracefully: pause audio, keep the timer running, resume audio when the call ends. Do not stop or reset the session on interruption.

---

## App Architecture

Sessions are built from sequential **modules**. Each module is either:
- A **pose** — timed drawing interval
- A **break** — rest or transition interval

The session player steps through modules in order, announcing each one with audio cues.

---

## Current Build Status

**Last updated: 2026-03-28**

The app is running as a development build on the user's iPhone. All three main screens exist and are functional. The session player has not yet been fully tested end-to-end on device.

### What's confirmed working ✓
- Development build installed via Xcode (`npx expo run:ios --device`)
- Screen stays awake during sessions (`expo-keep-awake`)
- Background audio via `expo-notifications` — notifications fire and play sound when screen is locked
- Timestamp-based timer (not setInterval) — accurate through screen lock/unlock
- Home screen — loads presets, shows starter preset on first launch, long-press to delete
- Builder screen — session length, timing indicator, module list, add/edit/duplicate/reorder/delete modules, save preset modal, start session
- Player screen — written and loaded but **not yet fully tested on device**
- Ding sounds (single and double) playing correctly in foreground and via notifications in background

### What's built but needs testing
- **PlayerScreen.tsx** — the full timer engine. Written in this session, not yet put through its paces. Test: lead-in countdown, running timer, pause/resume, skip, verbal warning, module-to-module transitions, session complete screen, AppState recovery after screen lock.
- **BuilderScreen.tsx, ModuleCard.tsx, ModuleForm.tsx** — written in this session; the user confirmed the Builder screen appeared but full editing flow hasn't been tested thoroughly.

### What's not yet built
- Onboarding flow (3 screens, stored flag in AsyncStorage)
- Sound library expansion (currently only `single` and `double` ding — ROADMAP calls for 3–5 options)
- Total session time remaining display in Player
- In-session module editing (ROADMAP §7.1 "Edit" control)
- Pause → "restart module fresh" option (ROADMAP §7.1)
- Time-over/time-under warning in Player after pause
- Screen dim (not off) after 1 min of no interaction (ROADMAP §7.3)

---

## Architecture Decisions Made During Development

These are locked-in decisions. Do not revisit without good reason.

### Timer accuracy
**Use timestamp-based timers, not setInterval counting.** Store `endTimeMs = Date.now() + durationSeconds * 1000`. Compute remaining time as `Math.ceil((endTimeMs - Date.now()) / 1000)`. This survives JS thread suspension when the screen locks or the app backgrounds.

### Background audio
**Use `expo-notifications` for background/locked-screen audio alerts.** `expo-av` only plays in the foreground. Notifications fire via the iOS scheduler regardless of app state. Each module schedules a notification at `endTimeMs`; cancel it on skip/pause/advance.

**Foreground sound:** `expo-av` plays sounds directly (`playSound()` in audio.ts).
**Background/locked sound:** Notification fires with sound from the iOS bundle.
**Do not double-play:** `configureNotificationHandler` sets `shouldPlaySound: false` so the notification doesn't also play sound in the foreground (the interval handles it directly).

### Navigation
`@react-navigation/native-stack`. Three routes: `Home`, `Builder`, `Player`.
Player has `headerBackVisible: false, gestureEnabled: false` — the Stop button is the only exit.
PlayerScreen hides the header entirely via `useLayoutEffect`.

### State in PlayerScreen
All mutable timer state lives in **refs** (`phaseRef`, `endTimeMsRef`, etc.) so interval callbacks and AppState handlers always read current values without stale closures. React state (`phase`, `index`, `seconds`) is kept in sync for rendering only.

### react-native-reanimated
Installed but the Babel plugin is **disabled** in `babel.config.js` (causes a native rebuild requirement that hasn't been done). Do not add it back until a full Xcode rebuild is planned. Use up/down buttons instead of drag-to-reorder until then.

---

## Build Priority

~~**Get background audio and screen-awake working before any UI work.**~~

**This milestone is complete.** Background audio confirmed working via development build on device. Screen-awake confirmed. Proceed directly to feature development.

### Next priorities (in order)
1. **Verify PlayerScreen end-to-end** — test all states on device before adding more features
2. **Onboarding flow** — 3 screens, `hasOnboarded` flag in AsyncStorage, lands on Home after
3. **Sound library** — add 2–3 more sound options; wire per-module sound selection through to Player
4. **Polish Player display** — total session time remaining, better paused state UX

---

## Voice and Copy

Default voice style for all user-facing text (labels, prompts, messages, onboarding) is **Ira Glass** — conversational, slightly wry, humanistic. Not corporate. Not clinical. Write copy as if you're explaining something interesting to a curious person, not issuing commands to a user.

---

## What to Avoid

- No internet calls of any kind
- No user accounts or authentication
- No third-party analytics or crash reporting SDKs (unless explicitly added later)
- Do not start UI polish before background audio is verified working
- Do not use deprecated Expo APIs — check the current Expo SDK docs before assuming an API is available
