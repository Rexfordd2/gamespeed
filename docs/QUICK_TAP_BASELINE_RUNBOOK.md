# Quick Tap baseline and retest

Quick Tap is the baseline mode. It already times each hit from the moment the cue appears. Reaction Benchmark keeps its own fixed protocol and composite score; this runbook does not use that composite as the athlete baseline.

Use the same phone, the same browser, and the same screen orientation for the first round and the retest. A different device, browser, or viewport is labeled potentially noncomparable. The app does not add a hardware latency correction.

These numbers are in-app tap latency and hit rate. They do not show neural conduction, on-field reaction speed, football IQ, recruiting potential, or a lab reaction time.

## Before the athlete starts

1. Open the GameSpeed web app on the phone that will be used for every retest.
2. Choose **Quick Tap**. Leave the other modes for later practice.
3. Read the on-screen task: one target, tap it before it vanishes. Taps faster than 100 ms are ignored. Leaving the tab pauses the round and discards the cue that was showing.
4. Sign in only if this build has a configured Supabase account for that athlete. Without a session, the round can still be saved on the phone. Without Supabase configuration, nothing is sent to `user_rounds`.

## First baseline

1. Play the full round.
2. Read the result: median tap latency, accuracy, hits, misses, accidental taps, backgrounded cues, and cues still on screen at the end.
3. Tap **Save this round**. That stores it in this browser under the Quick Tap local history. The same `client_round_id` is used if cloud sync is retried.
4. If sync fails, tap **Retry cloud sync**. A duplicate `client_round_id` is ignored.
5. If you do not want the round stored, tap **Don't save**. The result stays on screen only.
6. Optional: tap **Copy round summary**. That text is a manual export. Athlete Houze identity pairing is not connected.

## Retest

1. Return to this phone and browser. Refresh the app if you left it.
2. Open stats, or start Quick Tap again, and confirm the saved baseline is still listed with its median tap latency.
3. Play another full Quick Tap round and save it.
4. Read the same-device comparison: shorter or longer median tap latency, and the accuracy difference, against the previous saved Quick Tap round.
5. If the device or browser record does not match, treat the two rounds as potentially noncomparable.

## When something is missing

| Situation | What the athlete should see |
|---|---|
| No account session | Saved on this device only |
| Cloud sync not configured | Saved on this device only; nothing sent |
| Sync failed or offline | Local round kept; retry uses the same `client_round_id` |
| Duplicate submit | One local round; cloud unique key `(user_id, client_round_id)` |
| No earlier round | First baseline; no comparison yet |
| No valid taps | No median tap latency |
| Tab backgrounded | Round pauses; that cue is excluded |
| Accidental tap | Target stays; the tap is not a hit and not a time |
