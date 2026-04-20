# Conversion Instrumentation Guide

This app now emits conversion events for the landing page and first-run flow and stores them in browser local storage under `gamespeed_conversion_events_v1`.

## Tracked Events

- `hero_cta_click`
- `persona_selected` (athlete vs gamer)
- `first_test_start`
- `first_test_completion`
- `results_view`
- `signup_after_first_session`
- `share_score_click`
- `return_visit`
- `streak_start`
- `landing_experiment_exposure`

Each event includes:

- `experimentVariant`: `A`, `B`, or `C`
- `deviceType`: `mobile`, `tablet`, or `desktop`
- `environment`: from `VITE_APP_ENV`, falling back to Vite mode (`development`, `production`, etc.)
- route, host, timestamp, and event-specific payload

## Experiment Configuration

Landing experiment assignments are defined in `src/config/landingExperiment.ts`:

- **Variant A**: athlete-first framing (`single-focus`, athlete shown first)
- **Variant B**: gamer-first framing (`single-focus`, gamer shown first)
- **Variant C**: split hero with both visible (`split`)

Control assignment with:

- `VITE_LANDING_EXPERIMENT_VARIANT=A|B|C` to force a variant in an environment
- unset variable to use deterministic auto-bucketing persisted per browser

## Where to Read Metrics

### 1) Browser debug API (fastest for local validation)

Open DevTools Console:

```js
window.__gamespeedAnalytics.read()
```

Aggregations:

```js
window.__gamespeedAnalytics.summaryBy('name')
window.__gamespeedAnalytics.summaryBy('deviceType')
window.__gamespeedAnalytics.summaryBy('environment')
window.__gamespeedAnalytics.summaryBy('experimentVariant')
```

Reset local event store:

```js
window.__gamespeedAnalytics.clear()
```

### 2) GTM/GA style pipelines

If Google Tag Manager is installed, events are also pushed to `window.dataLayer` with `event` set to the conversion event name and full payload attached.

## Comparing Outcomes by Device and Environment

Use conversion rates by segment, not just raw counts.

1. Pick a funnel definition per outcome:
   - Landing conversion: `hero_cta_click -> first_test_start -> first_test_completion`
   - Results activation: `first_test_completion -> results_view -> share_score_click`
   - Monetization/signup proxy: `first_test_completion -> signup_after_first_session`
2. Group by:
   - `experimentVariant`
   - `deviceType`
   - `environment`
3. Calculate per-group rates:
   - `start_rate = first_test_start / hero_cta_click`
   - `completion_rate = first_test_completion / first_test_start`
   - `signup_rate = signup_after_first_session / first_test_completion`
   - `share_rate = share_score_click / results_view`
4. Compare A/B/C within each device and environment before selecting a winner.

Recommended reporting slices:

- Production mobile vs production desktop
- Development vs production parity checks
- Variant A vs B vs C inside the same environment
