# RELEASE_HISTORY — TU WorkTime Tracker

> Chronological record of builds and store releases. Newest first.
> Cross-refs: [CURRENT_STATUS.md](./CURRENT_STATUS.md) · [IOS_RELEASE_STATUS.md](./IOS_RELEASE_STATUS.md) · [NEXT_SESSION.md](./NEXT_SESSION.md)

## iOS — Apple App Store / TestFlight

### v1.0.0 — first iOS production build — 2026-06-29
- **Build ID:** `4a02eaf1-a178-490c-84ce-b9db9c15b346`
- **Version / Build number:** `1.0.0` / `1`
- **Profile:** production (EAS, `credentialsSource: remote`, `appVersionSource: remote`)
- **Status:** ✅ FINISHED (built 13:56→14:02 UTC, ~5m46s)
- **Artifact (IPA):** https://expo.dev/artifacts/eas/Nz78gxk4AEUSYHBXnQVUY635U1JO-vdlCnghlhkeWTk.ipa
- **Upload date (TestFlight):** _pending — `eas submit` not yet run_
- **Processing status:** _not uploaded yet_
- **Credentials created this build:** iOS Distribution Certificate + Provisioning Profile (EAS-managed).
- **Notes:** First Apple build of the codebase. Export compliance declared (`ITSAppUsesNonExemptEncryption=false`). App Store Connect record exists (`ascAppId 6785502105`).

## Android — Google Play

### Closed Testing (pre-existing)
- **Track:** Closed Testing (active before this work).
- **Version:** `1.0.0` · **app.json `versionCode`:** `2`.
- **Deployed `versionCode`:** ⚠️ not verifiable locally — confirm in Play Console before the next upload (must be strictly higher).
- **Important note:** the deployed build **predates** the pre-release polish below. Local `main` is ahead; a **new Closed Testing build has not been generated** since.
- **Release notes (pending update build):** localized input placeholders (22 languages); removed obsolete Ads/Free-Premium scaffolding (single paid app).

## Codebase milestones (git `main`)
| Commit | Summary |
|---|---|
| `87c425e` | chore(ios): use remote app version source for EAS builds |
| `89ab565` | chore(ios): declare ITSAppUsesNonExemptEncryption=false |
| `af19f2e` | chore(ios): set App Store Connect submit credentials (Team ID + ascAppId) |
| `10ce161` | chore: remove obsolete Ads / Free-Premium functionality |
| `bfe9c42` | feat(i18n): localize input placeholders across all 22 languages |
| `7f04efd` | chore: add Google Play assets and bump Android versionCode (last pre-session commit) |

## Pending milestones
- iOS: TestFlight upload → processing → internal testing → App Store Review.
- Android: generate new Closed Testing build from current `main` (after confirming `versionCode`).
