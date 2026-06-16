# WorkTime Tracker — Release Checklist (EAS / Stores)

Status: **v1.0.0, preparing first EAS test build.** No monetization (AdMob/IAP),
no Google Calendar, no widgets in this release — intentionally out of scope.

## Versioning (current — OK for first build)

| Field | File | Value |
|-------|------|-------|
| App version | `package.json`, `app.json` | `1.0.0` |
| iOS `buildNumber` | `app.json` → `ios` | `1` |
| Android `versionCode` | `app.json` → `android` | `1` |

`eas.json` production has `"autoIncrement": true`, so EAS bumps the build number
automatically on each production build.

## Data still required — fill before `eas submit`

These are placeholders in `eas.json` (`submit.production`). The build itself does
**not** need them; they are required only for **submission** to the stores.

### 🍎 Apple — App Store Connect
- [ ] **`TODO_APPLE_TEAM_ID`** — Apple Developer Team ID (10 chars, e.g. `A1B2C3D4E5`).
      Find at https://developer.apple.com/account → Membership.
- [ ] **`TODO_ASC_APP_ID`** — App Store Connect app ID (numeric `adamId`).
      Created when you register the app bundle `com.turbanski.worktimetracker`
      at https://appstoreconnect.apple.com → Apps → (+).
- [ ] Apple Developer Program membership active ($99/yr) for `info@tuautomation.de`.
- [ ] App record created in App Store Connect (name, primary language, bundle ID,
      SKU, category, privacy policy URL).

### 🤖 Google — Play Console
- [ ] **`google-service-account.json`** — service-account key with *Release Manager*
      permission, placed in repo root (already git-ignored). Create at
      Play Console → Setup → API access → Service accounts.
- [ ] Google Play Developer account ($25 one-time).
- [ ] App created in Play Console with package `com.turbanski.worktimetracker`.
- [ ] Internal/closed testing track set up (first build target).

## Store listing assets needed (both platforms)
- [ ] App icon 1024×1024 (have `assets/icon.png` — verify size).
- [ ] Screenshots (iPhone 6.7"/6.5", iPad N/A — `supportsTablet:false`; Android phone).
- [ ] Short + full description (PL/EN/DE at least). Draft in `app.json.description`.
- [ ] Privacy policy URL — **live**: https://tuautomation.de/privacy-worktimer.html ✅
- [ ] Data-safety / privacy questionnaire (location usage = work-session detection).
- [ ] Age rating / content questionnaire.

## Known notes (not blocking the build)
- Privacy URL + contact email are unified across the repo:
  `https://tuautomation.de/privacy-worktimer.html` and `info@tuautomation.de`
  (in-app link, `docs/privacy.html`, contact row). The earlier GitHub Pages
  privacy URL, the old Gmail contact address, and the mistyped Apple ID have all
  been removed.
- No ESLint config in repo → no lint step.

## Build & submit commands (run only after confirmation)

```bash
# one-time
npm install -g eas-cli
eas login

# first TEST build (internal)
eas build --profile preview --platform android    # APK, easiest to sideload
eas build --profile preview --platform ios        # internal distribution

# production builds (store-ready)
eas build --profile production --platform android  # AAB
eas build --profile production --platform ios

# submit (needs the TODO_* values + google-service-account.json filled in)
eas submit --profile production --platform ios
eas submit --profile production --platform android
```
