# Blackspot Visual Generation Adapter — Integration Runbook

## Status
This branch introduces a **reference-first, guarded KIE.ai generation adapter**. It is NOT a completed rendering or live deployment. It generates media assets for later review and Remotion assembly. Generation requires a funded KIE account and a secret API key; the free GitHub source is not a free inference model.

Upstream inspiration: https://github.com/Autom8AI/Open-Higgsfield-AI
- The supplied fork's current `packages/studio/src/kie.js` routes to `https://api.kie.ai`.
- Its README instead describes Muapi API endpoints. **Do not mix** these incompatible auth/request formats.
- The huge model catalog in `packages/studio/src/models.js` is NOT evidence that `kie.js` can route every listed model.
- We deliberately do **not** import the entire Open-Higgsfield Next.js application or vendor its UI.
- The following request contracts were separately confirmed against the KIE model docs:
  - `google/nano-banana-edit`: `input.image_urls` and `prompt`
  - `kling/v2-1-pro`: `input.image_url`, `prompt`, `duration: "5" | "10"`
  - `omnihuman-1-5`: `input.image_url`, `audio_url`, `output_resolution`; audio < 60 seconds (15 seconds or less recommended)
- KIE results are asynchronous; HTTP 200 on creation is not completion.

Verified documentation:
- https://docs.kie.ai/market/google/nano-banana-edit
- https://docs.kie.ai/market/kling/v2-1-pro
- https://docs.kie.ai/market/omnihuman-1-5
- https://docs.kie.ai/

## First use: one character, one shot
1. Have the author/director approve and lock James's character sheet. Store the reference image on your **owned asset storage** behind appropriate access controls. Use signed, time-limited HTTPS URLs only when the generation provider needs to fetch assets. Preserve permanent internal asset IDs.
2. Copy `config/blackspot-visual.example.json` into an episode-specific JSON file outside the public repository. Replace `assets.example.com` with actual approved, reachable URLs. The placeholder is not a working asset.
3. Review the character ID, prompt, wardrobe, time of day, scene ID, camera intention, and canonical reference URLs.
4. Dry-run for zero provider cost:
   ```bash
   node scripts/blackspot-visual.mjs config/blackspot-visual.example.json
   node --test tests/blackspot-visual.test.mjs
   ```
5. Obtain a KIE API key, confirm sufficient credits and commercial rights of the specific model, then put `KIE_API_KEY` in the server environment, **never** in Git or a web client's localStorage:
   ```bash
   export KIE_API_KEY='YOUR_SECRET'
   node scripts/blackspot-visual.mjs /private/shot-003.json --execute --approve-spend --output /private/runs/shot-003.json
   ```
6. Copy the completed media to your owned asset store promptly. KIE's documentation reports generated media retention of 14 days. Update the asset registry with the owned URI, SHA-256, provider, model, generated timestamp, character ID, and the approval/rejection decision.
7. Review face likeness, hair, proportions, clothing, artifacts, props, shot continuity and intended emotion. **Generation output is always unreviewed by default**.
8. After approval, add the asset to the Remotion shot timeline; do not feed an unapproved generation directly to the next shot.

### From image to moving video
When the director approves a generated keyframe, add its HTTPS URL to the locked character's `approvedAssetUrls`. Only then submit:
```json
{
  "characters": {
    "james": {
      "locked": true,
      "approvedAssetUrls": ["https://your-owned-storage.example/approved/shot003-frame.png"]
    }
  },
  "job": {
    "id": "ep01-shot003-motion",
    "kind": "image-to-video",
    "sceneId": "ep01-saturday-doorway",
    "characterId": "james",
    "approved": true,
    "prompt": "James takes a tiny half step backwards, blink, then looks from Cynthia's eyes to the corridor. Subtle realistic motion, slow camera push, no identity changes.",
    "keyframeUrl": "https://your-owned-storage.example/approved/shot003-frame.png",
    "duration": 5
  }
}
```
For dialogue, a separate `lip-sync` job uses an approved portrait URL and a pre-produced TTS audio URL. Break long performances into short, directed takes. Preserve and edit the approved source audio in Remotion to avoid unpredictable generated dialogue.

## Story and continuity rules
- The **Director's Bible** governs character identity, psychology, eye lines, pauses, blocking, and reveal timing; the generation model is only a visual performer.
- Never send the entire episode script as one image-to-video prompt. Compile to short shot briefs with canonical references.
- Keep stable character IDs (e.g., `james`, `cynthia`, `rose`) and separate look variants for each timeline period/wardrobe.
- For multi-person shots, test reference conditioning and compositing: the `characterId` field in this MVP represents one principal character, not multi-person identity validation.
- Avoid model-generated dialogue and background music unless explicitly approved; the shared audio engine should remain the source of truth.
- Use Remotion/FFmpeg for final edit, parallax, transitions, soundscape, captions, and measured export.
- Cut around weak AI acting and prioritize decisive performance beats. Silence and eye contact are often more expressive than camera motion.

## Integration boundary
Current code:
- `packages/visual-generation/kie-adapter.mjs`: validated request compiler and API submit/poll client.
- `scripts/blackspot-visual.mjs`: safety-first CLI + per-job manifest.
- `tests/blackspot-visual.test.mjs`: mock API and contract tests.
- `config/blackspot-visual.example.json`: dry-run sample only.

Not yet implemented:
- Browser UI for directors; official upstream app remains optional for manual exploration.
- Automated upload of local images/audio to KIE-hosted URLs.
- Owned-media artifact downloads and hash verification.
- Persistent job database, crash-resume polling CLI, webhooks, rate limits, cost preflight, and automatic retries.
- Automated face similarity/continuity QA and manual approval dashboard.
- A Remotion Blackspot scene composition and full end-to-end render.
- Live authentication or paid generation testing (requires account credentials).

**Do not claim the full pipeline is running until these are installed, tested, and deployed.**

## Security and production controls
- Never expose provider keys in JavaScript sent to browsers or in git history.
- Do not include recognizable private individuals in training/inference without rights/consent.
- Only stage assets with permitted third-party processing rights; avoid embedding confidential source material in external model prompts.
- Treat output URLs as temporary and potentially sensitive.
- Add provider-spend limits and a cost check before unattended runs.
- Keep distribution default private and separate from asset generation.
- Model terms, commercial-use permissions, and generation pricing change: confirm for the selected provider and model at launch.

## Why not just copy Open-Higgsfield-AI?
It is a **UI and API orchestration frontend**, not a consistency, cinematic acting, storytelling, or Remotion production engine. Our integration borrows its useful model-access pattern, fixes provider-specific request mismatches, and positions the service behind the director and canonical asset registry.
