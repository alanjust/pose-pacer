# Life Drawing Timer — ROADMAP.md
**Working title.** Do not use in App Store or public-facing materials until trademark cleared.

---

## 1. Project Summary

A modular, preset-based session timer for life drawing instructors. Replaces kitchen timers and improvised phone timers with a purpose-built tool that handles variable-length sessions composed of sequential pose and break modules. Works entirely offline. Designed for iOS first.

The app is a smart timer, not a planner. It warns but never stops you.

---

## 2. Primary User

**The instructor or session moderator.**
- Holds or places the phone on a table adjacent to their position or near the model
- Minimally tech-savvy — assumes basic phone literacy, nothing more
- May also be the model or one of the artists in smaller private settings
- Uses iPad or iPhone; iPhone is the primary target device

---

## 3. Core Use Case

An instructor runs a 2–3 hour life drawing session composed of sequential timed segments: gestural warm-ups, progressive pose durations, breaks, and long poses. Each segment has a defined duration. The session structure varies by instructor and may vary week to week. The app needs to:

1. Let the instructor define a session as a stack of modules before it starts
2. Run that session unattended if everything goes smoothly
3. Alert audibly at key moments (pose start, pose end, countdown warnings)
4. Allow ad hoc intervention at any point without crashing the session
5. Save and reload session structures as named presets

---

## 4. Technology Stack

**React Native with Expo**

Rationale:
- Reliable screen-awake API on iOS (browser-based PWAs cannot guarantee this)
- Reliable background audio on iOS
- Single codebase; Android-ready without a rewrite later
- App Store distribution when ready

**Storage:** Local device only. No accounts, no login, no cloud sync, no internet required.

---

## 5. Module System

### 5.1 What a Module Is

A module is the base unit of a session. Every module is structurally identical — only its label and settings differ. There are two types:

- **Pose module** — active drawing time
- **Break module** — rest, discussion, setup, or transition time

Both types use the same underlying timer. The label distinguishes them visually.

### 5.2 Minimum Required Settings Per Module

- Duration (any length, no hard limits)
- Type: Pose or Break
- Start sound
- End sound

### 5.3 Optional Settings Per Module

- **Lead-in countdown:** A 10-second "get ready" period before the module timer starts
- **Verbal countdown warning:** A voice alert at a configurable threshold before the module ends (e.g., "30 seconds," "10 seconds," "5 minutes remaining"). Default female English voice. Threshold is set per module.
- **Custom label:** Optional text title for the module (e.g., "Gesture warm-up"). Not required — time and type are sufficient.

### 5.4 Module Behavior

- Modules can be created, duplicated, reordered, and deleted at any time — before or during a session
- No module is locked once the session starts
- Modules stack sequentially; the session plays through them in order
- At the end of the last module, the app goes silent. No "session complete" fanfare.

---

## 6. Session Builder

### 6.1 Starting a New Session

1. Instructor enters total session length (required first step)
2. App displays a blank slate with total time and an **Add Module** button
3. Instructor adds modules one at a time
4. App provides running feedback: time allocated vs. total session length
   - "You have X minutes unallocated"
   - "You are X minutes over your session length"
   - Warning only — never blocks action

### 6.2 Progressive Disclosure (First-Time Use)

The first module slot is live and ready to configure. Subsequent slots are visible but grayed out. Each slot unlocks after the previous one is configured. This prevents overwhelm for first-time users.

### 6.3 Duplicate and Reorder

- Any module can be duplicated with one tap
- Modules can be reordered by drag-and-drop at any time
- Duplication is the primary way to build sequences of identical timers (e.g., three 1-minute gesture poses in a row)

---

## 7. Session Runtime

### 7.1 Controls During a Running Session

- **Pause / Resume** — stops the current module timer; resumes from where it paused, or optionally restarts the current module fresh (both options offered on resume)
- **Skip** — ends current module early and advances to the next
- **Edit** — opens the module stack for in-session edits; app warns if changes affect total session time

### 7.2 Unplanned Time Changes

If a pause or edit causes the session to run over or under the total session length, the app surfaces a non-blocking alert:

> "Session is now X minutes over. Remove a module or shorten existing ones, or continue anyway."

Two resolution options:
1. **Auto-suggest:** App offers specific modules to remove or shorten to get back on time
2. **Manual:** Instructor dismisses the alert and adjusts manually

### 7.3 Screen Behavior

- Screen stays on for the duration of the session
- Dims (not off) after 1 minute of no interaction to save battery
- Timer remains visible at all times

### 7.4 Background and Interruptions

- Timer continues running if the instructor receives a phone call
- Audio alerts still fire during calls and when the screen is locked
- App does not pause on interruption unless the instructor manually pauses

---

## 8. Display During Session

### Primary (large, top): 
Current module countdown

### Secondary (below countdown):
Next module in queue — duration and type label

### Tertiary (optional, smaller):
Total session time remaining

---

## 9. Audio System

### 9.1 Sound Events

| Event | Sound |
|---|---|
| Pose/module start | Single dong |
| Pose/module end | Double dong (distinct from start) |
| Verbal countdown warning | Female English voice ("30 seconds," "10 seconds," etc.) |

Sounds are brief and non-repeating. No continuous alarm that requires manual dismissal.

### 9.2 Sound Library

Built-in library of 3–5 options for start and end sounds. Instructor selects per module or sets a session default. Custom audio file import: deferred to post-beta based on user feedback.

### 9.3 Volume

Loud enough to cut through ambient music and conversation in a studio environment.

---

## 10. Presets

### 10.1 Saving a Preset

After building a session, instructor can save it as a named preset.

Preset list displays:
- Title (instructor-assigned)
- Total session duration
- Module count (e.g., "14 modules · 2h 30m")

No limit on number of saved presets.

### 10.2 Loading a Preset

1. Instructor taps preset
2. Session loads in review mode — full module stack visible
3. Instructor can edit before starting
4. If loaded session length differs from available time, app flags the discrepancy and suggests adjustments (remove modules, shorten durations)

### 10.3 Starter Preset

App ships with one pre-built example session: a typical 2-hour life drawing class structure (30-second gestures escalating to 20-minute long poses with breaks). Clearly labeled as an example. Fully editable.

---

## 11. Onboarding

First launch triggers a brief walkthrough (3 screens max):

1. **What this is** — modular session timer, how modules work
2. **How to build a session** — add, duplicate, reorder
3. **Presets** — save and reload

After onboarding, user lands on the session builder with the starter preset loaded and ready to inspect or run.

---

## 12. Visual Design

- Dark background (Apple Watch Modular face aesthetic)
- SF Pro numerals
- High contrast — legible at a glance from across a table
- iOS default design language — no custom chrome or decorative elements
- Utilitarian, not precious

---

## 13. Out of Scope for v1.0 (Beta)

These are explicitly deferred:

- Android build
- Custom audio file import
- Sound customization beyond built-in library
- Multi-language voice support
- Internet-dependent features of any kind
- Accounts, login, or cloud sync
- Preset sharing between devices
- App Store submission

---

## 14. Beta Goals

Ship a working build to a small group of instructors and artist friends for real-session testing. Success = reliable, unattended operation through a full session with no crashes, missed alerts, or screen-sleep failures.

Expect: feature requests around alert sounds, edge cases in the module builder, and UI confusion around the modular paradigm for users coming from single-timer apps.

---

## 15. Post-Beta Candidates (Parking Lot)

- Custom audio file import
- Android build
- Alert sound library expansion
- Multi-language voice support
- App Store release
- Haptic feedback as secondary alert
- Landscape/iPad layout optimization
- Apple Watch app — timer face on wrist, module name and countdown visible at a glance, crown or tap to skip/pause
