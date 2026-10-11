# Project Uhuru v4 — one-time setup

1. Link this GitHub repository to your existing Netlify site. Production branch: `main`; build command: blank; publish directory: `.`.
2. Create a fine-grained GitHub personal access token restricted to this repository with **Contents: Read and write**. Never commit it.
3. In Netlify environment variables add:
   - `GITHUB_TOKEN` = fine-grained token
   - `GITHUB_OWNER` = `filthy-souls`
   - `GITHUB_REPO` = `kili-os`
   - `GITHUB_BRANCH` = `main`
   - `UHURU_SYNC_KEY` = a long private password you invent
4. Redeploy Netlify after setting the variables.
5. Open the PWA -> Dashboard -> GitHub sync. Enter the same `UHURU_SYNC_KEY` once and tap **Connect / save key**.

## What is already seeded
- Oct 5: back + legs / 45° leg press variations
- Oct 7: back + legs
- Oct 8: updated Gym B
- Oct 4–10: ~6,000 steps/day
- office stairs not completed during that period
- Oct 10 Sljeme moved to Oct 11
- Oct 11 Sljeme not marked complete yet

## Sync behavior
GitHub `data/state.json` is authoritative. The phone uses localStorage only as an offline cache. On open the app pulls GitHub. Saves are committed back to GitHub after a short debounce. Offline changes stay pending and push when connectivity returns.
