# Life Drawing Timer — Developer Guide

*Everything you need to pick up where you left off, no matter how much time has passed.*

---

## Table of Contents

1. [The Big Picture — What's Running Where](#1-the-big-picture)
2. [Your Daily Development Workflow](#2-daily-development-workflow)
3. [Making Code Changes](#3-making-code-changes)
4. [Installing a Standalone Build (No Mac Required)](#4-standalone-release-build)
5. [When to Do a Full Xcode Rebuild](#5-full-xcode-rebuild)
6. [When Your 7-Day Certificate Expires](#6-certificate-renewal)
7. [Troubleshooting Common Situations](#7-troubleshooting)
8. [Continuing This Project with Claude](#8-continuing-with-claude)
9. [Project File Map](#9-project-file-map)

---

## 1. The Big Picture

There are two completely different ways the app can run on your iPhone. Understanding which one you're in is the key to everything.

### Mode A — Development Build (Debug)
- The app is installed on your phone via Xcode.
- The JavaScript code is **served live from your Mac** over WiFi.
- Your Mac must be on, Metro must be running, and both must be on the same WiFi network.
- You can make a code change on your Mac and see it on your phone in seconds by pressing `r`.
- **This is what you use while building the app.**

### Mode B — Release Build (Standalone)
- The JavaScript code is **baked into the app binary** on your phone.
- No Mac needed. No WiFi needed. Metro doesn't exist as far as this version is concerned.
- You can take your phone anywhere and the app just works.
- **This is what you use to actually use the app.**
- Caveat: with a free Apple ID, this certificate expires after 7 days. See [Section 6](#6-certificate-renewal).

---

## 2. Daily Development Workflow

This is what you do every time you sit down to work on the app.

### Step 1 — Open your terminal in the project directory

You need a Terminal window that's already inside the project folder. You'll know it's right when the prompt shows:

```
(base) alanjust@MacBook-Pro life-drawing-timer %
```

If your prompt shows `~` instead of `life-drawing-timer`, run:

```bash
cd ~/life-drawing-timer
```

### Step 2 — Start Metro

```bash
npx expo start
```

You'll see a QR code and a menu of options. Metro is now running and listening for your phone.

> **You do not need to scan the QR code again.** The development build app already knows how to find Metro. Just open the app on your phone.

### Step 3 — Open the app on your phone

Tap the **Life Drawing Timer** app icon (the one that was installed via Xcode — not Expo Go). It will connect to Metro automatically over WiFi.

If the app opens to a blank white screen or shows a connection error, see [Troubleshooting](#7-troubleshooting).

### Step 4 — Reload after changes

After you've made code changes (or Claude has made them), go to your Metro terminal and press:

```
r
```

The app reloads on your phone within a few seconds. No need to quit and reopen the app.

---

## 3. Making Code Changes

### What you tell Claude

Just describe what you want. For example:
- *"Add a settings screen where I can change the lead-in duration."*
- *"Make the timer font bigger."*
- *"When the session ends, show how long the whole thing took."*

Claude will edit the files directly. When it's done, press `r` in Metro to see the result.

### When `r` is enough

- Changing text, colors, layout
- Adding new screens (that don't require new native packages)
- Changing timer logic, adding features
- Editing any `.tsx`, `.ts`, or `.js` file in the `src/` folder

### When you need a full rebuild (not just `r`)

If Claude installs a new package that has **native iOS code** (anything requiring `pod install`), a Metro reload won't cut it. See [Section 5](#5-full-xcode-rebuild). Claude will tell you when this is needed.

---

## 4. Standalone Release Build

Use this when you want to use the app in real life — in a drawing session, away from your Mac, or just without thinking about it.

### Command

Make sure Metro is **not** running (press `Ctrl+C` to stop it first), then:

```bash
npx expo run:ios --configuration Release --device
```

### What to expect

- Takes 5–10 minutes. This is normal.
- Your phone needs to be plugged in via USB for the install.
- After it finishes, you can unplug and use the app anywhere.
- The app icon on your home screen is the same one — it just now runs a self-contained version.

### Getting back to development mode

Just start Metro again (`npx expo start`) and open the app. The app will automatically reconnect to Metro when it's available and you're on the same WiFi. It knows the difference.

> **Important:** After doing a Release build and then returning to development, make sure you're running `npx expo start` (not `npx expo run:ios`). The Release build and the Debug build share the same app slot on your phone — whichever was installed most recently is what runs.

---

## 5. Full Xcode Rebuild

You need this when:
- Claude adds a new package that includes native iOS code
- Something is deeply broken and a reload doesn't help
- You haven't built in a while and things seem out of sync

### How to do it

```bash
npx expo run:ios --device
```

This runs `pod install`, recompiles the native code, and reinstalls the app. Takes 5–15 minutes the first time, faster after that. Your phone needs to be plugged in via USB.

After it finishes, Metro starts automatically. You can also start it manually with `npx expo start`.

---

## 6. Certificate Renewal

With a free Apple ID (no paid developer account), the certificate that allows your app to run on your phone expires every **7 days**.

### How you'll know it expired

You tap the app and nothing happens, or iOS shows a message like "Unable to verify app" or the app just quietly refuses to open.

### The fix

Plug in your phone, open your project terminal, and run:

```bash
npx expo run:ios --device
```

That's it. This reinstalls the app with a fresh certificate. Takes about 5–10 minutes.

> **Note:** This will give you the Debug build (Metro-dependent). If you want the standalone version after renewing, run the Release build command from Section 4 immediately after.

---

## 7. Troubleshooting

### "Blank screen when I open the app"

**Most likely cause:** Metro isn't running, or your phone and Mac are on different WiFi networks.

1. Check your terminal — does it show the Metro QR code and options? If not, run `npx expo start`.
2. Make sure your iPhone and Mac are on the same WiFi network.
3. Press `r` in Metro.
4. If still blank, force-quit the app on your phone and reopen it.

---

### "It says 'Using Expo Go' in the Metro terminal"

You're connected to Expo Go instead of your development build. In the Metro terminal, press:

```
s
```

This toggles between Expo Go and development build mode. Press it until you see **"Using development build"**. Then reload.

---

### "Metro says address already in use" or "port 8081"

Another Metro process is still running. Kill it:

```bash
npx kill-port 8081
```

Then start Metro again: `npx expo start`.

---

### "I accidentally ran the command from the wrong folder"

If you see errors about missing files or Metro can't find the project, you're probably in the wrong directory. Check your prompt — it should show `life-drawing-timer`. If it shows `~` or anything else:

```bash
cd ~/life-drawing-timer
npx expo start
```

---

### "The app opens but shows old code after I press r"

Try force-quitting the app on your phone (swipe up from the app switcher) and reopening it. Sometimes the reload needs a fresh start.

---

### "Something is very broken and nothing is working"

Nuclear reset — clears all caches:

```bash
npx expo start --clear
```

If that doesn't help, full clean rebuild:

```bash
cd ~/life-drawing-timer
rm -rf node_modules
npm install
npx expo run:ios --device
```

This takes a while but fixes most deep issues.

---

### "The app works in development but not as a Release build"

Some things behave differently in Release mode (stricter JavaScript, no dev warnings). If this happens, describe the problem to Claude — it's usually a fixable code issue.

---

## 8. Continuing This Project with Claude

Claude doesn't automatically remember previous conversations, but the project is set up so it can get up to speed quickly every time.

### The key files Claude reads at the start of every session

- **`CLAUDE.md`** — Project overview, technical constraints, architecture decisions, voice guidelines. Claude reads this automatically.
- **`ROADMAP.md`** — Full feature spec and what's been built vs. what's planned.
- **`DEV-GUIDE.md`** — This document.

### How to start a new Claude session

Open a new Claude conversation and say something like:

> *"I'm working on the Life Drawing Timer app. The project is at ~/life-drawing-timer. Let's continue where we left off."*

Claude will read `CLAUDE.md` and `ROADMAP.md` automatically and know the full context: the stack, the architecture, what's been built, what constraints matter.

### If you want Claude to catch up on specifics

Ask it to read any relevant file:

> *"Read src/screens/PlayerScreen.tsx and then let's talk about adding a feature."*

Or describe what you last worked on:

> *"We just finished the Player screen. Now I want to add a settings screen."*

### What Claude will never forget (because it's in the code)

- The entire architecture — it can read every file
- All the technical decisions — they're documented in `CLAUDE.md`
- All the current features — they're in the code itself

### What you might want to remind Claude

- Any bugs you've noticed that aren't fixed yet
- Any preferences about how you like things to work
- What you were in the middle of when the last session ended

---

## 9. Project File Map

A quick reference so you know where everything lives.

```
life-drawing-timer/
│
├── App.tsx                    Navigation root, audio session setup
├── index.ts                   Entry point (do not edit)
├── app.json                   Expo config, iOS permissions, bundle ID
├── babel.config.js            Transpiler config
├── package.json               Dependencies
│
├── CLAUDE.md                  Project instructions for Claude (read every session)
├── ROADMAP.md                 Feature spec — what's built, what's next
├── DEV-GUIDE.md               This document
│
├── src/
│   ├── types.ts               All TypeScript interfaces (Module, Preset, etc.)
│   ├── audio.ts               Audio session, sounds, notifications, speech
│   ├── storage.ts             AsyncStorage wrappers for presets
│   ├── starterPreset.ts       The hardcoded Classic 2-Hour Session
│   │
│   ├── screens/
│   │   ├── HomeScreen.tsx     Preset list, new session button
│   │   ├── BuilderScreen.tsx  Session editor — modules, save, start
│   │   └── PlayerScreen.tsx   Timer engine — the actual session player
│   │
│   └── components/
│       ├── ModuleCard.tsx     One module row in the builder list
│       └── ModuleForm.tsx     Modal for creating/editing a module
│
├── assets/
│   └── sounds/
│       ├── ding_single.wav    One-ding sound cue
│       └── ding_double.wav    Two-ding sound cue
│
└── ios/                       Xcode project (native code — don't edit manually)
```

---

## Quick Reference Card

| I want to… | Command / Action |
|---|---|
| Start developing | `npx expo start` → open app on phone |
| See my latest code changes | Press `r` in Metro terminal |
| Install app standalone (no Mac) | `npx expo run:ios --configuration Release --device` |
| Add native packages / full rebuild | `npx expo run:ios --device` |
| Renew expired certificate | `npx expo run:ios --device` |
| Fix "port already in use" | `npx kill-port 8081` |
| Fix everything (nuclear reset) | `npx expo start --clear` |
| Resume with Claude | New chat → *"Life Drawing Timer, ~/life-drawing-timer, continue where we left off"* |

---

*Last updated: 2026-03-28*
