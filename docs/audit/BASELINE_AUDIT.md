# Phase Zero — Baseline Repository & Pipeline Audit
**Project:** The Lincoln Penny Media Engine (`the-lincoln-penny-pipeline`)  
**Auditor:** Principal Engineer & Technical Director  
**Date:** 2026-11-11  
**Audit Target:** End-to-End Production Pipeline, Remotion Engine, Audio Synthesizers, Editorial Scripts, Distribution Drivers

---

## 1. Executive Summary

This baseline audit evaluates the existing media pipeline codebase. The system possesses strong conceptual foundations (1080x1920 Remotion rendering, dual-speaker podcast composition, multi-channel distribution modules, and Groq-powered queue replenisher), but exhibits architectural fragmentation, hardcoded animation timelines, missing module dependencies in the Git tree, and inconsistent credential management.

This document establishes the verified facts of the current system before architectural refactoring begins.

---

## 2. Investigation of Known Issues

| # | Known Issue Target | Verification Result | Root Cause & Evidence |
|---|---|---|---|
| **1** | `editorial/short_brief_v3.js` & `story_lab.js` reference `./numguard` | **CONFIRMED & REPAIRED** | `numguard.js` was present on VPS (`/opt/faceless/numguard.js`), but was omitted from the original repository commit. Pulled into `editorial/numguard.js`. |
| **2** | Editorial scripts expect `facts/<slug>.json` files | **CONFIRMED & REPAIRED** | 31 verified fact seed JSON files existed on VPS at `/opt/faceless/facts/`, but were missing from Git tree. Pulled into `editorial/facts/`. |
| **3** | `distribution/publish_tiktok.js` references `./blueprint/tiktok_publisher` | **CONFIRMED & REPAIRED** | `tiktok_publisher.js` existed at `/opt/faceless/blueprint/tiktok_publisher.js` on VPS. Pulled into `distribution/tiktok_publisher.js`. |
| **4** | Modules use hardcoded absolute `/opt/faceless` paths | **CONFIRMED DEFECT** | `community_agent.js`, `publish_youtube.js`, `publish_instagram.js`, and audio scripts contain hardcoded `/opt/faceless` strings. |
| **5** | Inconsistent YouTube credential locations/filenames | **CONFIRMED DEFECT** | `publish_youtube.js` and `community_agent.js` expect `youtube_tokens_lincoln.json`, while `analytics.js` expects `youtube_tokens.json`. |
| **6** | YouTube publisher requests public visibility directly | **CONFIRMED DEFECT** | `publish_youtube.js` hardcodes `privacyStatus: 'public'`. Violates safety principle (must default to private/unlisted pending approval). |
| **7** | Podcast composition hardcodes camera timings & emotions | **CONFIRMED DEFECT** | `StickmanPodcastShort.tsx` hardcodes camera cuts (`time < 8.17`, etc.) and emotions (`time >= 14.12 && time < 16.0 ? "shock" : ...`) instead of consuming a Director shot schema. |
| **8** | Characters use frame-based mouth toggling | **CONFIRMED DEFECT** | `isMouthOpen` is calculated via `isSpeaking && Math.sin(frame * 0.7) > 0` (mechanical 4.5-frame square/sine toggle) rather than actual phoneme/viseme articulation. |
| **9** | Podcast character instances disable microphone (`showMic={false}`) | **CONFIRMED DEFECT** | Disabled as a workaround for overlapping photographic background props; characters lack physical prop-aware positioning. |
| **10** | Lack of reproducible Colab GPU worker protocol | **CONFIRMED DEFECT** | No Colab notebook, worker daemon, or authenticated job dispatch protocol existed in the repository. |
| **11** | Lack of unified production orchestrator | **CONFIRMED DEFECT** | No unified CLI entry point (`lincoln audit`, `lincoln render`, `lincoln direct`) existed. |
| **12** | README contains capabilities needing runtime verification | **CONFIRMED DEFECT** | README documented end-to-end features whose dependencies were partially disconnected in code. |

---

## 3. Existing Capabilities (What Works)

1. **Remotion 1080x1920 Vertical Composition Engine:**
   - Full composition catalog (`AirlineHook`, `SonyForensicTeardownShort`, `McDonaldsFoundersShort`, `StickmanPodcastShort`).
   - Clean TypeScript compilation with `@remotion/cli` 4.0.286.
   - Word-level kinetic caption bar with platform-safe margins.
2. **Multi-Speaker Audio Synthesis:**
   - Microsoft Azure Neural TTS (`edge-tts` with `en-US-GuyNeural` & `en-US-ChristopherNeural`): 100% free, unlimited, zero-rate-limit.
   - Gemini 2.5 Flash TTS (`Puck` & `Charon`): Highly expressive, but constrained by Free Tier 10 req/day quota.
   - Local Kokoro ONNX (`am_adam` & `am_michael`): Fast offline CPU/GPU fallback.
   - Faster-Whisper forced alignment generating structured `words.json`.
3. **Editorial & Topic Management:**
   - Master reservoir of 68 vetted corporate secret topics in `stickman_queue.txt`.
   - Groq-powered replenishment agent (`replenish_queue.js`).
   - Strict numerical claim verification module (`numguard.js`).
4. **Community & Performance Intelligence:**
   - Multi-platform community audit (`community_agent.js`) for YouTube Data API and Instagram Graph API.
   - Automated sequel flywheel logic detecting viral view/comment surges.

---

## 4. Confirmed Technical Debt & Security Risks

1. **Hardcoded Environmental Paths:** Scripts fail when cloned on developer workstations or CI/CD without manual environment variable overrides.
2. **Direct-to-Public Publishing Hazard:** Lack of a hard release gate permitting public YouTube uploads without operator sign-off.
3. **Mechanical Character Animation:** The stickman characters are 2D geometric SVGs with simple rotational bobs and sine-wave mouths; they lack articulated limbs, weight shifts, natural gesturing, and eye gaze direction.
4. **Fragmented Execution:** Different stages (script generation, audio synthesis, Remotion rendering, publishing) require running disparate scripts with manual file copying.

---

## 5. Runtime Test Matrix & Validation Results

| Test Category | Command / Action | Result | Notes |
|---|---|---|---|
| **Node Dependencies** | `npm install` in `motion-engine` | **PASS** | 210 packages installed cleanly. |
| **TypeScript Types** | `npx tsc --noEmit` in `motion-engine` | **PASS** | `FONTS.body` aliased in `src/fonts.ts`. Zero compile errors. |
| **Edge Neural TTS** | `python edge_podcast_audio.py` | **PASS** | Generated 47.34s dual-voice master + 111 mapped words. |
| **Whisper Alignment** | `faster-whisper` CPU pass | **PASS** | Sub-50ms word timestamps attributed to speaker IDs. |
| **Fact Seeding** | `numguard.check()` against `facts/*.json` | **PASS** | Module restored and verified with 31 seed files. |
| **YouTube Audit** | `node agents/community_agent.js --growth-audit` | **PASS** | Verified live channel stats (2,912 views, 15 videos). |
| **Remotion Stills** | `npx remotion still StickmanPodcastShort` | **PASS** | Frames 45, 300, 440, 600 verified in 1080x1920. |

---

## 6. Migration Plan & Architectural Strategy

To achieve the Master Implementation Directive without breaking functioning pipelines, the architecture will be restructured incrementally:

1. **Phase 1: Stabilization & Orchestrator CLI (`lincoln`):**
   - Create unified CLI orchestrator with explicit state machine (`IDEA` → `RESEARCHING` → `FACT_VERIFIED` → `SCRIPT_APPROVED` → `AUDIO_READY` → `DIRECTED` → `RENDERED` → `QA_PASSED` → `APPROVED_FOR_PUBLISHING` → `PUBLISHED`).
   - Centralize credential resolution (`config/credentials.js`).
   - Enforce `privacyStatus: 'private'` default for all uploads.
2. **Phase 2: Articulated Character Rig & Acting Engine:**
   - Implement hierarchical 2D skeletal rig (head, neck, torso, shoulders, upper/lower arms, hands, legs, expressive facial features).
   - Reusable performance states (`listening`, `explaining`, `shock`, `smirk`, `lean_forward`, `point`, `interrupt`).
   - Produce a 15-second silent acting demonstration.
3. **Phase 3: Phoneme-Aware Lip-Sync & Audio Synchronization:**
   - Replace sine-wave mouth toggles with multi-viseme speech mapping (closed, open vowel, wide vowel, rounded vowel, dental/labial contacts).
4. **Phase 4: Frame-Addressable AI Director:**
   - Semantic shot timeline compiler producing deterministic camera choreography and reaction cuts.
5. **Phase 5 & 6: Production Episodes & Reusability Proof:**
   - Render Episode 1 (McDonald's $30B Land Monopoly).
   - Render Episode 2 on an entirely new topic using the exact same modular engine.
