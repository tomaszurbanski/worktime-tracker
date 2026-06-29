# CURRENT_STATUS — TU WorkTime Tracker

> Single source of truth for the release state. Updated: **2026-06-29**.
> Companion docs: [IOS_RELEASE_STATUS.md](./IOS_RELEASE_STATUS.md) · [NEXT_SESSION.md](./NEXT_SESSION.md) · [RELEASE_HISTORY.md](./RELEASE_HISTORY.md)

## Overall status
First commercial release in progress. The app is **feature-complete and polished**; remaining work is **store delivery** (iOS TestFlight upload + App Store listing entry; Android Closed Testing update).

- **iOS → TestFlight:** ~90% (build done; only `eas submit` + Apple processing remain)
- **iOS → App Store Review:** ~70% (screenshots + App Store Connect field entry remain)
- **Android → Closed Testing update:** ~85% (new build not yet generated since the polish commits)

## Product facts
- **Type:** single paid app, **€2.99** — no ads, no AdMob, no IAP, no subscriptions, no free/premium split
- **Store name (Apple):** `TU WorkTime Tracker` · **On-device name:** `WorkTime Tracker`
- **Languages:** 22 · **Themes:** light / dark / system

## Platform status
| Area | Status |
|---|---|
| **Android (Google Play)** | Closed Testing track **exists** (pre-existing build). Local `main` is **ahead** of the deployed build by the i18n + ads-removal polish — a new Closed Testing build has **not** been generated yet. |
| **Google Play** | Closed Testing active; deployed `versionCode` **not verifiable locally** (needs Play Console). |
| **iOS build (EAS)** | ✅ First production build **FINISHED** (`4a02eaf1…`, v1.0.0 build 1). IPA produced. |
| **App Store Connect** | App record **created** (`ascAppId 6785502105`). Listing fields **not yet entered**. |
| **TestFlight** | ❌ **Not uploaded yet.** `eas submit` pending (needs interactive Apple auth to create the ASC API Key). |

## Versions & build numbers
- **App version:** `1.0.0`
- **iOS build number:** `1` (EAS-managed — `eas.json` `cli.appVersionSource: "remote"`)
- **Android versionCode:** `2` (in `app.json`; **deployed** value unverified)

## Git
- **Repo:** https://github.com/tomaszurbanski/worktime-tracker
- **Branch:** `main` (release branch) — local == `origin/main`
- **Latest commit:** `87c425e` — *chore(ios): use remote app version source for EAS builds*

## Important IDs & URLs
See the full table in [IOS_RELEASE_STATUS.md](./IOS_RELEASE_STATUS.md#identifiers). Key ones:
- Bundle ID / Android package: `com.turbanski.worktimetracker`
- Apple Team ID: `HJ3G5FK5QQ` · ASC App ID: `6785502105` · Apple ID: `info@tuautomation.de`
- EAS project: `53e8d835-eaf0-4a81-b8f2-eb641c49a6f0` (account `tomaszurbanski`)
- Privacy Policy: https://tuautomation.de/privacy-worktimer.html · Support URL: https://tuautomation.de

## Current blockers
1. **TestFlight upload not done** — requires interactive `eas submit` (creates the App Store Connect API Key via Apple login + 2FA). *Only Apple-auth step left for TestFlight.*
2. **App Store screenshots** — none exist; required for App Store Review (not for TestFlight). Sizes/plan in [NEXT_SESSION.md](./NEXT_SESSION.md).

## Next recommended action
Run the TestFlight upload (uses the existing build — **do not rebuild**):
```bash
eas submit --profile production --platform ios --latest
```
Then complete Apple processing → build appears in TestFlight. Full steps: [NEXT_SESSION.md](./NEXT_SESSION.md).
