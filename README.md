# Dayflow — Productivity & Sleep Web App

A responsive React + TypeScript starter app for tasks, planning, notes, focus sessions, ambient sound mixing, and personal customization.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

Create a production build:

```bash
npm run build
npm run preview
```

## Included features

- Animated logo intro with skip option
- Live clock, date, and time-aware greeting
- Task list with completion, priority, filtering, search, and deletion
- Weekly planner and selected-day task view
- Notes / idea studio with tags and local saving
- Focus timer
- Sleep Studio with multiple independent sound layers, volume sliders, mix presets, master volume, timer, and fade-out
- Dark/light theme, accent colors, compact mode, greeting and motion preferences
- Dashboard visibility preferences
- Keyboard shortcuts: `N` creates a task; `Ctrl/Cmd + K` opens the command palette
- JSON export/import backup
- Responsive desktop and mobile layouts

## Data and audio notes

This starter stores tasks, notes, preferences, and presets in the current browser using local storage. It does not include login, cloud sync, or a remote database. Export a JSON backup before clearing browser storage.

The initial sound layers are generated synthetic noise textures using the Web Audio API. They demonstrate real playback, layering, per-layer gain, master volume, and timer fade behavior; they are not licensed field recordings. For a production release, replace or supplement them with high-quality audio you have permission to distribute.

Browser audio typically requires a user gesture to start. Background playback and screen-lock behavior vary by browser and device, so test those behaviors on target phones before promising uninterrupted playback.

## Suggested next steps

1. Add automated tests for task operations and backup import validation.
2. Add account authentication and database-backed sync if multi-device use is needed.
3. Add true calendar integration and browser notifications only after permission flows are designed.
4. Add accessibility checks and test with keyboard navigation, reduced motion, and mobile screen readers.
5. Replace generated noise with licensed recordings and tune each sound layer's loop points and fade behavior.
