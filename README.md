<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Hearth

Hearth is a smart home assistant that helps you manage your daily life. It provides a calendar, weather forecasts, recipes, games, and a voice assistant to help you with your daily tasks.

## Product Direction: TV-First, Voice-First, Touch-Ready

If Hearth is meant to live on a flat-screen TV, the UX should be optimized for **distance, low precision input, and hands-free control**.

### Design Principles

- **Voice-first navigation:** Every key action should be available by natural-language command.
- **Touch-safe fallback:** Any voice flow should also be completable with large touch targets.
- **10-foot UI readability:** Prioritize large typography, high contrast, and simple layouts.
- **Always-recoverable interaction:** Users should be able to say “go back”, “cancel”, or “help” from any screen.

### What to Build Next (Priority Roadmap)

1. **Unified Voice Command Router**
   - Add a central intent map for global commands like “open calendar”, “add note”, “next recipe”, and “turn off lights”.
   - Route commands to app modules consistently instead of per-component voice handling.

2. **Global Interaction Contract**
   - Standardize commands: `open`, `close`, `back`, `confirm`, `cancel`, `scroll`, `select <item>`.
   - Mirror each command with visible on-screen hints and tappable controls.

3. **TV Interaction Mode**
   - Add a dedicated layout mode for large displays with:
     - Minimum 48–64px touch targets
     - Focus outlines for keyboard/remote navigation
     - Reduced on-screen density and larger default text

4. **Voice Confirmation for Risky Actions**
   - Require confirmation for destructive/important actions (delete, send, schedule, unlock).
   - Use a short verbal confirmation pattern: “Do you want me to send this message to Alex?”

5. **Accessibility + Reliability Layer**
   - Add transcript and subtitle-style feedback for recognized speech.
   - Add timeout/retry handling and explicit “I didn’t catch that” recoveries.
   - Ensure all controls have accessible labels and deterministic focus order.

### Definition of Done for “Fully Interactable by Voice + Touch”

For each feature, verify:

- The feature can be launched, used, and exited with voice only.
- The same full workflow can be completed with touch only.
- Every step has clear state feedback (spoken and visual).
- Error states are recoverable without restarting the app.

### Suggested Metrics

- Task completion rate (voice-only, touch-only)
- Average time-to-task for common flows
- Voice fallback rate (how often users switch to touch)
- Misrecognition rate and recovery success rate
- 7-day retention in living-room usage windows

## Getting Started

**Prerequisites:** Node.js

### 1. Installation

First, install the project dependencies:

```bash
npm install
```

### 2. Environment Variables

Next, you'll need to set up your environment variables. Copy the `.env.example` file to a new file named `.env`:

```bash
cp .env.example .env
```

Now, you have two options:

#### Development (with Mock Data)

To run the application in development mode with mock data, simply set the following variable in your `.env` file:

```
VITE_USE_FAKE_DATA=true
```

This will allow you to run the application without needing to provide any real API keys.

#### Production (with Real Data)

To run the application with real data, you'll need to provide your Google Client ID and Gemini API Key.

1.  **Comment out or remove** the `VITE_USE_FAKE_DATA` variable in your `.env` file.
2.  **Provide your Google Client ID and Gemini API Key** in the `.env` file:

```
VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
SERPAPI_KEY="YOUR_SERPAPI_KEY"
SPOONACULAR_API_KEY="YOUR_SPOONACULAR_API_KEY"
```

You can obtain a Google Client ID from the [Google Cloud Console](https://console.cloud.google.com/) and a Gemini API Key from [Google AI Studio](https://makersuite.google.com/).

### 3. Run the App

Once you've configured your environment variables, you can run the application:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Persistent household data

Hearth stores household data through `/api/state` in `data/hearth-state.json`. Groceries, notes, family calendar events, meal plans, saved recipes, the household location, daily briefing status, AI chat history, and generated storyboard pages therefore survive hard refreshes and are shared by every browser using the same Hearth server.

The data file is intentionally ignored by Git. Back up `data/hearth-state.json` if you move Hearth to another machine. Google access tokens and disposable third-party API caches remain browser-local and are not written to the shared file.

## Voice command examples

The floating microphone accepts app-wide commands as well as general questions. Tap once to record, say one command, then tap **Stop**.

- “Open groceries” / “Open the meal planner” / “Go home”
- “Add strawberries to the grocery list” / “Check off milk” / “Rename apples to green apples”
- “Add a note saying call the plumber” / “Update the note about plumber to call the plumber Monday”
- “Schedule dentist on Tuesday at 3 PM” / “Remove dentist from the calendar on Tuesday”
- “Set tacos for dinner on Friday” / “Clear dinner for Friday”
- “Find recipes for quick vegetarian lunches”
- “Play 2048” / “Start a story about a pirate cat”

Gemini interprets every request conversationally, choosing either an app action or a genuine question. Ordinary questions open in the assistant response modal; commands are not dependent on rigid keywords or exact phrasing.
