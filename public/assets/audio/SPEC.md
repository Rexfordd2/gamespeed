# GameSpeed Audio Spec Pack (v1 + next cues)

Use this spec to produce a cohesive, repeat-safe audio pack for a jungle/rainforest athletic-tech reaction trainer.

## Creative direction

- Tone: focused, immersive, clean, modern, motivating
- Avoid: cartoonish motifs, novelty comedy FX, harsh highs, fatiguing transient spikes
- Repeat-play target: sounds must remain clear after long sessions without irritation

## Output format baseline

- Delivery: `mp3`, 44.1 kHz or 48 kHz, 16-bit or 24-bit source pre-encode
- Master peak: keep true peak below `-1.0 dBTP`
- Noise floor: clean tails, no audible clicks at start/end
- SFX tails: natural short decay, no abrupt truncation

## Asset specs

### 1) `rainforest-loop.mp3` (v1 required)

- Purpose: continuous background bed during active gameplay
- Emotional intent: calm concentration + athletic readiness
- Sound character: modern rainforest texture (air, distant life, soft movement), lightly shaped and controlled; no obvious melody
- Recommended duration: 75-120s seamless loop
- Mix/loudness notes: integrated around `-30 to -26 LUFS`; gently low-passed top end if needed to stay behind SFX
- Presence: subtle
- Loop requirements: seamless start/end; no rhythmic pop at loop point
- Avoid: loud animal calls, sharp chirps, tonal hooks, dramatic rises

### 2) `target-hit.mp3` (v1 required)

- Purpose: confirms successful target action
- Emotional intent: precise, rewarding, energetic
- Sound character: tight transient click/tap with short tonal support; clean and confident
- Recommended duration: 60-140 ms
- Mix/loudness notes: short-term around `-18 to -15 LUFS`; clear attack, controlled top-end
- Presence: medium
- Loop requirements: none
- Avoid: metallic pain spikes, toy-like boings, long tails

### 3) `target-miss.mp3` (v1 required)

- Purpose: indicates missed/expired target
- Emotional intent: corrective but non-punishing
- Sound character: soft downward tick/thud, slightly darker than hit
- Recommended duration: 90-180 ms
- Mix/loudness notes: short-term around `-22 to -18 LUFS`; quieter than hit
- Presence: subtle to medium
- Loop requirements: none
- Avoid: harsh buzzers, alarm tones, overly negative "failure" branding

### 4) `round-complete.mp3` (v1 required)

- Purpose: end-of-round confirmation cue
- Emotional intent: accomplishment and closure
- Sound character: short modern stinger (2-3 tonal layers max), clean finish
- Recommended duration: 220-420 ms
- Mix/loudness notes: short-term around `-17 to -14 LUFS`; avoid masking UI voice/text moments
- Presence: prominent
- Loop requirements: none
- Avoid: long fanfares, cinematic boom tails, arcade jingle clichés

### 5) `round-start.mp3` (future)

- Purpose: marks round entry / go signal
- Emotional intent: readiness and forward momentum
- Sound character: concise "launch" ping/pulse
- Recommended duration: 120-260 ms
- Mix/loudness notes: short-term around `-18 to -15 LUFS`
- Presence: medium to prominent
- Loop requirements: none
- Avoid: spoken count-ins baked into file, long risers

### 6) `pause.mp3` (future)

- Purpose: confirms game pause
- Emotional intent: controlled freeze, no stress
- Sound character: soft downstep blip/chime
- Recommended duration: 100-220 ms
- Mix/loudness notes: short-term around `-23 to -19 LUFS`
- Presence: subtle
- Loop requirements: none
- Avoid: error-like tones or dramatic stop effects

### 7) `resume.mp3` (future)

- Purpose: confirms resume action
- Emotional intent: re-engage focus
- Sound character: short upward cue complementary to pause
- Recommended duration: 100-220 ms
- Mix/loudness notes: short-term around `-22 to -18 LUFS`
- Presence: subtle to medium
- Loop requirements: none
- Avoid: sounds identical to `round-start`

### 8) `swipe-whoosh.mp3` (future)

- Purpose: directional/kinetic reinforcement for Swipe Strike
- Emotional intent: speed and motion clarity
- Sound character: tight whoosh with mild broadband body
- Recommended duration: 90-190 ms
- Mix/loudness notes: short-term around `-21 to -17 LUFS`; keep transients smooth
- Presence: medium
- Loop requirements: none
- Avoid: exaggerated anime swooshes, wide stereo phase issues

### 9) `hold-lock.mp3` (future)

- Purpose: confirms successful hold acquisition in Hold Track
- Emotional intent: stable control
- Sound character: soft magnetic lock/click with minimal tail
- Recommended duration: 120-260 ms
- Mix/loudness notes: short-term around `-21 to -17 LUFS`
- Presence: medium
- Loop requirements: none
- Avoid: heavy mechanical clanks, long sustaining tones

### 10) `sequence-cue.mp3` (future)

- Purpose: step cue in Sequence Memory playback/input
- Emotional intent: precise timing anchor
- Sound character: neutral percussive tick with slight pitch identity
- Recommended duration: 70-150 ms
- Mix/loudness notes: short-term around `-22 to -18 LUFS`; keep consistent across repetitions
- Presence: medium
- Loop requirements: none
- Avoid: tonal clutter that obscures order recognition

### 11) `countdown-tick.mp3` (future)

- Purpose: pacing/anticipation timing cue for drills
- Emotional intent: urgency without anxiety
- Sound character: crisp metronomic tick (optionally with softer low layer)
- Recommended duration: 50-110 ms
- Mix/loudness notes: short-term around `-23 to -19 LUFS`; final "go" should be separate file and slightly louder
- Presence: subtle to medium
- Loop requirements: none
- Avoid: piercing clicks, fatigue-causing high-frequency emphasis

## Recommended folder structure

```text
public/assets/audio/
  music/
    rainforest-loop.mp3
  effects/
    target-hit.mp3
    target-miss.mp3
    round-complete.mp3
    round-start.mp3
    pause.mp3
    resume.mp3
    swipe-whoosh.mp3
    hold-lock.mp3
    sequence-cue.mp3
    countdown-tick.mp3
```

## Naming convention rules

- Use lowercase kebab-case only
- Use intent-first names, not source/plugin names
- Keep one canonical cue per file (no bundled variants)
- Prefix optional alternates with suffix versioning only when needed:
  - `target-hit-v2.mp3`, `countdown-tick-soft.mp3`
- For mode-specific additions, keep mode prefix:
  - `swipe-*`, `hold-*`, `sequence-*`, `training-*`, `ui-*`

## Mix consistency rules (whole pack)

- `music` must stay behind all cues at all times
- `hit` should read louder/more present than `miss`
- No SFX should exceed `-1.0 dBTP`
- Keep spectral balance smooth around 2-5 kHz to prevent fatigue
- Match perceived loudness by role, not by identical LUFS value
- Test with rapid repetition (30-60 seconds) for annoyance and masking
