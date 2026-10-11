# Project Uhuru

## What is included
- Preloaded Oct 3–4 re-entry weekend
- Full Oct 5 → Dec 14 Kilimanjaro training plan
- Daily checklists
- Progress dashboard with daily/weekly/plan completion rings
- Training calendar with completion status and workout-log markers
- Kili benchmark progress bars
- Daily recovery / pain / morning weight check-in
- Optional end-of-day Health metrics: calories burned, steps, resting HR
- Workout and hike logging
- 3-day summary generator
- Sunday / 7-day summary generator
- Share / copy summary to ChatGPT
- Safety and pain rules
- Local-only storage
- JSON export/import backup
- Offline PWA support

## Run locally on a computer
From this folder:

    python3 -m http.server 8080

Then open:
    http://localhost:8080

## Phone use
For reliable iPhone/Android installation, serve the folder over HTTPS (for example via a simple static host on your own private account) and use Add to Home Screen.
If you open it only over your local LAN, browser/PWA installation behavior varies by phone/browser.

## Updating later
Before replacing the app files:
1. Open Summary.
2. Export data.
3. Replace/update the app.
4. Import the backup if needed.

The app intentionally does not automatically talk to a ChatGPT conversation. Use Share/Copy to send the generated summary to this chat.

## Schedule controls
- Shift entire schedule +1 day: moves all future sessions, including long hikes and taper, one day later.
- Move today → tomorrow & skip tomorrow: shows tomorrow's session first and warns clearly if it is a training day.
- Skip today: discards today's session and resumes the normal schedule tomorrow.
- Tomorrow preview is always shown under Today's plan.
- Undo last schedule change is available.

## Locked hiking rule
- All actual hiking is Sljeme only.
- Hiking is allowed only on Saturday or Sunday.
- No weekday hike, even a short one.
- Weekday conditioning uses gym, stairs, step-ups, curved treadmill, running or ordinary walking.
- Global schedule shifts do not move a hike onto a weekday.
- Taper week is deliberately reduced.

## v3.4 Gym B update
Gym B now matches the available equipment:
- 45° leg press
- single-leg 45° leg press
- calf raises on 45° leg press
- back extensions
- upper-body machines/cables
Removed step-ups, controlled step-downs and leg curls.

## v3.5 configurable goals
- Daily 8k steps is now a numeric goal, not a checkbox.
- Enter actual steps from Google Health.
- Step completion feeds proportionally into daily/weekly/plan completion metrics.
- Daily step goal is editable in-app under Goals & preferences.
- Goal changes are stored locally and do not require redeploying the PWA.

## v3.6 GitHub/Netlify workflow
- Repo is static; no build command required.
- Netlify publish directory: repository root (`.`).
- App shell now uses network-first service worker behavior and versioned assets.
- `plan.json` is fetched with `no-store` to reduce stale-plan bugs after deploys.
- Personal progress remains in browser localStorage and is not committed to GitHub.
- `Merge progress` imports a JSON progress patch without replacing unrelated local data.

## v4.0 Git-backed database
GitHub is authoritative (`data/state.json`). The PWA reads/writes through `netlify/functions/uhuru-data.mjs`; localStorage is only an offline cache. Fixed duplicate `findDayPlan()` that bypassed rescheduling, including the Oct 10 -> Oct 11 Sljeme case.
