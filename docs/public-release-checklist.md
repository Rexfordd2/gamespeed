# Public Release Checklist

## Pre-Deploy Checklist

- [ ] `npm install` completed with lockfile in sync.
- [ ] Environment variables set in Vercel:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] (optional) `VITE_APP_ENV=production`
  - [ ] (optional) `VITE_LANDING_EXPERIMENT_VARIANT` (`A`, `B`, or `C`) if forcing a variant
- [ ] Supabase auth redirect URLs include the production domain and local dev URL.
- [ ] Placeholder social proof/testimonial content reviewed in `src/content/credibilityContent.ts`.
- [ ] SEO metadata reviewed in `index.html` (title, description, OG, Twitter, favicon).
- [ ] Quality gates pass locally:
  - [ ] `npm run lint`
  - [ ] `npm run typecheck`
  - [ ] `npm run test`
  - [ ] `npm run build`

## Post-Deploy Checklist

- [ ] Homepage loads with title: `GameSpeed | Reaction Training for Athletes and Gamers`.
- [ ] Meta description matches launch copy and social card renders correctly in link previews.
- [ ] Landing hero shows:
  - [ ] primary CTA `Run the 60-Second Test`
  - [ ] secondary CTA `Watch Demo`
  - [ ] athlete/gamer toggle
- [ ] First-run flow works end-to-end: persona -> goal -> test -> results.
- [ ] Results screen shows score, percentile, recommended next mode, and signup prompt after value.
- [ ] Analytics events fire for:
  - [ ] `hero_cta_click`
  - [ ] `persona_selected`
  - [ ] `test_start`
  - [ ] `test_completion`
  - [ ] `results_view`
  - [ ] `signup_prompt_shown`
- [ ] Supabase-backed auth prompt still works (if env vars are configured).

## Rollback Steps

1. In Vercel, identify the last known good production deployment.
2. Promote/redeploy that deployment (or redeploy the last stable commit from main).
3. If rollback requires code-level revert, revert the release commit(s) and redeploy.
4. Re-verify:
   - homepage title/metadata
   - core game round start/completion
   - auth prompt behavior
5. Post an incident note with root cause and follow-up fix plan before next deploy attempt.
