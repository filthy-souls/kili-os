# KiliOS — Master Operational Context
**Updated:** 2026-10-27, Europe/Zagreb
**Project:** KiliOS (formerly Project Uhuru)
**Repository:** filthy-souls/kili-os (public at last check)
**Branches:** main = production/default; develop = development/testing
**Expedition:** Kilimanjaro, Lemosho route, starts 2026-12-14
**Scope:** training planning, logged progress, physiology and symptom interpretation, activity data integration, KiliOS PWA, software engineering, decision tracking.
**Historical deep reference:** [docs/PROJECT_UHURU_CONTEXT.md](docs/PROJECT_UHURU_CONTEXT.md), 81 KB near-lossless handoff from the maxed-out Project Uhuru conversation through 2026-10-25. Read it for exact tables, test and GitHub snapshots, older decisions, and nuances. This master is an operational synthesis, **not an assertion of 100% verbatim access** to the original chat.

## 0. Usage, update policy and provenance
Read this master at the start of substantial KiliOS work or a new KiliOS chat, then fetch the historical reference and actual source files where the task requires detail. Do not demand that the user repeat documented information. Treat an absent or old claim as unresolved until rechecked. The user wants objective, skeptical answers: challenge unsupported inferences, avoid reflexive agreement, provide measurements, units and confidence distinctions, avoid inflated claims. Do not infer current app functionality solely from old descriptions.

**Critical user decision, 2026-10-27:** Do NOT commit this file for each reply or trivial change. Perform **one detailed baseline consolidation**; thereafter perform a **single daily delta review at 00:00 Europe/Zagreb** when the separate automation is active. During daytime, maintain conversational working context; record truly urgent safety/data-loss decisions when necessary, otherwise roll meaningful changes into the nightly delta. Avoid empty commits. Nightly agent must never pretend to have read inaccessible project conversations.

**Update threshold:** a new measured training benchmark, significant completed/missed training and reason, material symptom/recovery change, training plan revision, meaningful purchase/equipment constraint, substantial product decision, code feature/bug/architecture change, test/deployment outcome, reversed decision or open issue status. Do not log incidental discussion, repetition, or speculative options. For an update: fetch latest file + SHA, compare existing entries, apply only changed content, add dated log note with source and certainty, commit one coherent revision, then re-fetch/verify. Keep reference documents intact; prefer links over copying massive duplicate tables. Record failed/no-op reviews in automation output, not an empty Git commit.

**Privacy:** this is a public repository. Preserve fitness/training operational summaries rather than full raw medical data, private identity/location details, financial data or secrets. Never commit API tokens, Netlify/GitHub sync keys, personal health export archives or raw medical records.

## 1. Evidence and authority
| Domain | Source of truth | Interpretation |
|---|---|---|
| Actual software features | current source on relevant branch | Verify code, deployed version separately |
| Training plan | plan.json | Planned, not automatically completed |
| App progress | data/state.json | Check latest commit and user corrections |
| GPS hiking metrics | Strava activity export | Deduplicate overlapping imports |
| Physiology/recovery | Fitbit/Google Health export | Accuracy and algorithms have limitations |
| RPE, carried weight, symptoms | user's explicit dated reports | Not automatically captured by wearables |
| Historical decisions | docs/PROJECT_UHURU_CONTEXT.md and available chats | Older guidance may be superseded |
| Shoes and equipment | user purchase/try-on statements | Fit judgments override generic rankings |

If data conflicts, compare exact metric definition, acquisition method, timestamp and explicit corrections. Distinguish elapsed vs moving duration, uphill vs whole-activity HR, vest load vs water, recorded vs inferred steps, planned vs completed. Avoid double-counting Samsung/Google/Fitbit/Strava sync records.

## 2. Mission, environment and constraints
- Prepare for Kilimanjaro Lemosho expedition beginning Monday 2026-12-14, with sustainable effort, downhill tolerance, repeated trekking days, carrying useful loads, pacing, recovery and safe altitude practice.
- Training base Zagreb; Sljeme/Medvednica is the practical hiking venue, on **Saturday/Sunday only**. No weekday hiking; weekday fitness uses gym, walking, easy running or indoor conditioning. User prefers not to drive far for routine hikes.
- Daily 8,000-step target, but it is a target rather than reason to push through pain. Approximately two Gym A/B sessions per week. Easy running up to twice per week is an *aspiration conditional on symptoms*, not a mandatory activity.
- Strength goals also include maintaining/gaining upper-body muscle while protecting hiking legs. User does not use/want barbell squats, deadlifts or hip thrusts. Equipment established: 45° leg press, single-leg variants, calf raises on leg press, back extensions, upper-body machines/cables, dumbbells, two kettlebells, curved treadmill. Current gym lacks or may lack leg curl, hip abductor, dedicated calf raise, suitable step box and StairMaster; verify rather than assume.
- Main strengths in October: ability to sustain a multihour trail session and maintain meaningful loaded vertical speed; gaps: better aerobic efficiency at that output, more easy weekday movement, controlled cumulative vertical, progressive downhill adaptation and multi-day durability.
- Prior high-altitude Brahmatal and Dayara Bugyal treks without reported AMS are reassuring history but **not protection against altitude illness at 5,895 m**. Don't use low-altitude SpO2 or wearable VO2 max to predict AMS.
- A soft uphill HR target ~135–150 bpm and 150 bpm 'ceiling' were discussed as pacing tools, not hard medical thresholds; use talk test, terrain and symptoms. Prefer a repeatable 1:45–2:05 ascent at lower HR to a faster, exhausting record.
- Don't automatically cram missed sessions; reduce/shift workload for actual recovery. A real backpack ~5–7 kg can be more specific than a vest; don't escalate to 10–12 kg simply for progression.

## 3. Canonical Sljeme benchmark comparisons
Historical source: [sections 3–7 and V2 sections F–Q](docs/PROJECT_UHURU_CONTEXT.md). Warm-up often includes ~10 min walk from parking slightly above Bikčevićeva trailhead; warm-up is not always captured in GPS recording.

| Date | Route | GPS km | Ascent | Elapsed | Load on ascent | First-climb vertical rate | Uphill HR avg | Notes |
|---|---|---:|---:|---|---|---:|---:|---|
| 2026-10-11 | Bikčevićeva→Puntijarka→return | 12.00 | ~689 m | ~3h12–13m | no added load recorded | ~384 m/h | ~144 bpm | strongest aerobic efficiency baseline, not full summit |
| 2026-10-18 | Bikčevićeva→Puntijarka→Sljeme summit→return | 17.19 | ~826–827 m | ~4h44m | ~7 kg (6 kg vest + 1 L water), ascent | ~385 m/h | ~158 bpm | longest/durability benchmark; max optical HR reported 192, uncertain |
| 2026-10-25 | Bikčevićeva→Puntijarka→return | app canonical 9.64 | ~679 m | ~2h58–59m | ~7 kg, ascent | ~388 m/h | ~156 bpm | source combinations gave distance ~9.6–10.8 km; max HR ~178 |

**Interpretation:** +7 kg did not meaningfully diminish first-climb vertical speed, but the average uphill HR rose ~12–14 bpm compared with Oct 11. Thus primary target is **lower physiological cost at a useful workload**, not faster initial ascent. Oct 18 strongest durability day, Oct 11 best aerobic efficiency, Oct 25 repeatable loaded output. Uphill HR and full-activity average HR must not be mixed. Tracker max HR values from optical sensor warrant caution. Individual values and source reconciliation appear in the historical document.

## 4. Activity data and health/recovery interpretation
Source exports previously processed (historical record, not necessarily currently mounted): Strava archive export_675803772.zip (~27 rows, ~25 canonical activities after deduplication through Oct 25); Google/Fitbit export takeout-20261025T163703Z-1-001.zip (sleep, resting HR, HRV, SpO2, cardio load, readiness, daily steps, continuous HR, exercise summaries, VO2 estimates). Never claim to be able to reopen raw archives without access to the bytes.

- Fitbit steps and distance substantially undercount pole-assisted hikes from 2026-10-18 onward due to restricted arm swing; trust Strava GPS for hike distance/elevation. Fitbit HR/recovery can remain useful but is subject to sensor caveats. Avoid injecting made-up corrected step values.
- Prior October Fitbit average normal daily movement was substantially below 8k, with many ordinary workdays around 3–5k. Step goal aims at low-fatigue consistency rather than intense compensation sessions. Apparent hike-day deficits may be sensor artifacts.
- October resting HR increased versus early-month baseline during a period of unusually high work and personal stress around Oct 18–25; don't attribute the change entirely to training. Fitbit readiness/HRV later rebounded. October averaged roughly 7h19m sleep in deduplicated analysis, recent prior week ~7h53m. Some VO2 outputs (~47.08) were identical across dates and may be stale carried-forward estimate, not genuine trend.
- Wearable 'overtraining' or acute:chronic load classifications are not medical diagnoses; assess RHR, HRV, sleep, load, symptoms and performance together. Physiological measurements are sensitive personal information; keep raw histories in protected sources, not detailed public GitHub dumps.
- Meaningful recorded gym workouts by Oct 25 included Oct 4, 8, 13, 16 and 20 (A/B pattern, see handoff for exact duration and logged categories). No runs Oct 1–25. Nov–Dec training plan includes specific peak/taper structure stored in plan.json, do not replace it with a generic week template.
- Current recurring assessment issue: 2026-10-26 attempted run (around 6:40 min/km, HR above 170 bpm after roughly each 900 m, requiring recovery); user reported bilateral shin pulling/discomfort left greater than right and intermittent prickling shin/above ankle including with foot rotation after stopping during previous Sljeme hike. Did less than usual 500 m brisk-walk warm-up, but insufficient warm-up is hypothesis, not established cause. On Oct 27 no discomfort with limited ordinary walking, but 4–5 km brisk walk tolerance was not yet reported. Do not diagnose shin splints or assume new shoes fix it; ask about current functional symptom status before advising run progression. More concerning recurrent focal bone pain, pain at rest, persistent neurological symptoms or inability to bear weight calls for clinical assessment.

## 5. Training-plan evolution / priorities
Training period in plan.json: Oct 5–Dec 13 (10 weeks: Rebuild Oct 5–18, Build Oct 19–25, Consolidate Oct 26–Nov 1, Build Nov 2–15, Peak Nov 16–29, Taper Nov 30–Dec 13). User wants ~2 strength sessions, easy running only when recovered, weekend Sljeme, realistic 8k steps and adequate sleep. Week 4 Tuesday Gym A and Thursday Gym B on stored plan; actual rescheduling/completion must come from data/state.json. Scheduled easy-run re-entry on Monday Oct 26 does not prove completion; attempted run and symptoms are user-reported. A key peak training aim (not a guaranteed prescription) is one 5–7 h day with ~1000–1300 m total ascent and ~6–7 kg pack plus a gentler following day if recovered, before taper. Avoid promoting missed sessions as completed, loading up a sore shin, or adding weekend mountain travel requirements. Gym A includes chest/lat/row/shoulder and direct overhead triceps; Gym B includes eccentric leg press, unilateral leg press, leg-press calf raises, back extension and upper-body/rope pushdown. Check exact plan before advising.

## 6. Equipment, footwear and purchases (current)
**2026-10-27 decisions:**
- Purchased **Skechers Aero Burst**, €136, for dedicated road running and everyday/long walks; tried against HOKA Clifton 10 in person and found it *significantly more comfortable*, ~€30 cheaper than the local Clifton 10 price. No inference that extra cushioning cures lower-leg pain. Can use for daily walking as well as running; high stack is less desirable on unstable trails or for machine strength work.
- Purchased **Timberland Parker Street Mid**, €108, for daily work/casual use, **planned 15–20k-step city sightseeing days**, cooler weather and occasional light snow. **Explicitly not a Kilimanjaro boot**. OrthoLite footbed, EVA cushioning and relatively flexible design make extended walking plausible but 15–20k comfort has not been tested by user. Not confirmed waterproof; wet slush/ice presents limitations.
- Existing **Adidas Stan Smith** will be repurposed as gym shoes instead of buying Dropset Control (€89 seen in store) / Dropset 4 (~€130 reference). This is reasonable for predominantly machine-based workouts if outsole still grips, heel is secure and platform sufficiently firm. Very little treadmill running intended in gym (~90% of time no treadmill running).
- **Vans UltraRange EXO**: tried and *disliked*. Do not recommend as default. **Vans Old Skool Waterproof Insulated MTE**: keep on wishlist, **not purchased**; possible insulated, waterproof winter city shoe, potentially superior to Parker Street for wet/cold slush but not automatically superior for dry 15–20k-step days.
- Prior casual alternative **Adidas NMD** considered; not purchased.
- Technical footwear for Kilimanjaro/Sljeme is separate and not settled by these purchases. Historical shortlist: LOWA Renegade EVO GTX Mid (Zagreb price previously ~€150), Scarpa Rush TRK GTX, Salomon Quest GTX family. Wants mid GTX, size normally EU 42 with 42.5–43 toe room, secure heel, downhill traction, durable ~4–5 yrs, not unnecessarily bulky. These trekking boots should not be treated as technical crampon-compatible Mont Blanc/Elbrus summit boots.
- Trekking poles adopted on Sljeme from Oct 18; affect wrist step tracking. Weighted vest ~6 kg plus water ~7 kg used for key climbs.

## 7. Software architecture (source-verification checklist)
Netlify static PWA, default/production branch main, develop branch for changes. Key files:
- index.html, styles.css, app.js: UI and client application logic.
- plan.json: structured weeks/days.
- data/state.json: persistent app records on GitHub.
- netlify/functions/uhuru-data.mjs: server-side GitHub state interface.
- netlify.toml: Netlify configuration.
- manifest.json, sw.js: PWA/offline handling.
- playwright.config.mjs and tests/acceptance.spec.mjs: test configuration/suite.
- .github/workflows/develop-acceptance.yml: workflow on develop pushes/dispatch, Node 22, local Python preview, Chromium Playwright and report upload on failure.
- README.md and SETUP.md: project documentation; README contains historical local-only behavior now superseded by Git-backed v4 design in later section.

**Expected feature invariants:** Today / Progress / Plan / More navigation; tomorrow preview; day checklists; training calendar and historical completion/logs; daily step entry and proportional 8k goal progress; optional office stairs; recovery/health check-ins and undo; hike/workout logs; progress bars; reschedule operations (postpone hike to valid weekend, skip, safe global shift, undo); 3-day and 7-day summaries; JSON import/export and merge; responsive phone/desktop layout, light/dark theme; network sync and offline fallback. Inspect actual code and tests before asserting each currently works.

**State architecture:** historical v4 design uses GitHub data/state.json authoritative through Netlify function; localStorage is caching/offline/pending state. Public GET and protected PUT; browser service worker and cache may show stale data even when repository code changed. Do not expose Netlify environment values, PAT or sync key. Data writes must preserve other fields, deal with concurrent edits and avoid duplicate activities. Mocked test pass is NOT proof of live PAT write-through.

**Previously confirmed benchmark, 2026-10-25, not current CI status:** historical snapshot said main/develop aligned at commit 19cd0ebda628d0a83ffbb46cbd0caed266129553. Develop acceptance run 40216506034 reported 94 tests: **87 passed, 7 skipped, 0 failed**. Earlier intermediate runs had 14 and 12 failures before correction. These are historical results only; since then commits may differ and real production must be separately checked. Do not report '94 passed' or assume this workflow is still green.

**Known historical regression classes:** completed Sljeme moved Oct 10→11 not reflected because duplicate findDayPlan; completion percentage phantom history; calendar month/day UI/older date detail; post-deploy stale PWA assets; sync GET unnecessarily requiring key; remote failure fallback; UI checkbox spacing and navigation overlap; incorrect assumptions in tests after actual sensor import; visual device preview, theme and mobile tabs. See historical reference for timeline, fixes, severity, accepted behavior and whether resolved. Re-evaluate against current source, not stale issue descriptions.

**Development quality gate:** changes on develop; inspect dependencies, use relevant tests and preferably actual browser smoke checks, verify exact tested branch and SHA and Actions logs; no removing tests/features merely to pass. No promotion to main without explicit authorization. Differentiate browser-mocked fallback tests from live production verification. Protect application data. Minimize noisy file-by-file commit CI failures.

## 8. Context maintenance workflow / how to hand off
This file is the high-level current operational guide. docs/PROJECT_UHURU_CONTEXT.md is the long-form history and should remain intact. For any new significant change: record event date, objective/user-reported/derived status, source, decision and rationale, effect on training/application, next action and verification state. Keep older values and corrections with provenance rather than silently replacing. Use at most one coherent GitHub update in a nightly delta batch, and none on a no-change day. Nightly review should be scheduled separately at **00:00 Europe/Zagreb**, correct across DST changes. The scheduled agent may access GitHub but may *not* have access to every conversation: acknowledge coverage limitations; do not fabricate today's decisions. If chat is about to max out, user may explicitly request immediate handoff; that is an exception to nightly batching.

## 9. Current outstanding work at baseline
1. Assess actual response of shin/ankle symptoms to brisk ~4–5 km walks and next morning, then decide safe Gym A/B leg load and running re-entry; no confirmed diagnosis.
2. Protect weekend Sljeme consistency, 8k regular movement, adequate recovery and a realistic peak block before taper.
3. Track GPS/HR and duplicate-import issues; don't treat pole-associated low Fitbit steps as no physical work.
4. Inspect source/CI, live sync and data import behavior before engineering changes; issues described historically may be resolved.
5. Maintain shoe choice distinction: Skechers road running/walking; Timberland city walks/light winter; Stan Smith gym; Vans MTE wishlist; technical GTX hiking boot still separate.
6. Preserve exact operational decisions and future progress only when material; collect daily deltas via automation, not per message.

## 10. Consolidation change log
- 2026-10-25: Original extensive project handoff recorded in docs/PROJECT_UHURU_CONTEXT.md.
- 2026-10-26: User reported recurrent shin-region discomfort and intermittent ankle/shin prickling during running attempt, cause uncertain.
- 2026-10-27: Shoes bought/repurposed and winter wishlist clarified; no major training completion confirmed; no claim of 4–5 km walk completed.
- 2026-10-27: User selected nightly delta updates rather than one commit per ChatGPT reply; master context restructured as comprehensive operational synthesis linked to historical evidence.
