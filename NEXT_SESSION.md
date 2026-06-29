# NEXT_SESSION — TU WorkTime Tracker (handover)

> Read THIS file first when resuming. It tells you where we stopped, what NOT to redo, and the exact next steps.
> Updated: **2026-06-29**. Cross-refs: [CURRENT_STATUS.md](./CURRENT_STATUS.md) · [IOS_RELEASE_STATUS.md](./IOS_RELEASE_STATUS.md) · [RELEASE_HISTORY.md](./RELEASE_HISTORY.md)

## Where we stopped
The **first iOS production build succeeded** (`4a02eaf1…`, v1.0.0 build 1, FINISHED). We stopped **right before uploading it to TestFlight** — the upload needs an interactive Apple login (2FA) to create the App Store Connect API Key, which can't run in the automation shell.

## ⛔ Do NOT repeat (already done & verified)
- **Do NOT rebuild.** A finished iOS build exists (`4a02eaf1…`). Use `--latest` when submitting.
- **Do NOT regenerate credentials.** The iOS **Distribution Certificate** and **Provisioning Profile** were created during the build (EAS-managed, remote).
- **Do NOT re-edit `eas.json` / `app.json` for IDs.** Team ID, ascAppId, bundle ID, export-compliance flag, and `appVersionSource: remote` are all set and committed.
- **Do NOT re-run the i18n / Ads-removal cleanup.** Committed (`bfe9c42`, `10ce161`) and pushed.
- **Do NOT hunt for old screenshots.** None exist anywhere (verified); the only store images are Google-Play-only (`store-assets/`).

## ✅ Already verified
- TypeScript passes (`tsc --noEmit`, strict). Repo clean, `main == origin/main`.
- 22-language i18n parity (176 keys each). No ads SDK / no network / analytics in code → App Privacy = **Data Not Collected**.
- iOS build config valid; build produced a real IPA.

## ▶️ Exactly what to do next (in order)

### 1. Upload to TestFlight (one Apple 2FA — only remaining auth gate)
```bash
cd C:\Users\t_urb\Projects\worktime-tracker
eas submit --profile production --platform ios --latest
```
- Choose to let EAS **create/manage the App Store Connect API Key** (automatic option).
- Apple ID `info@tuautomation.de` → password → **2FA code**.
- EAS uploads the existing IPA. After this, future submits are headless (key stored on EAS).

### 2. Apple processing (~5–15 min, no action)
- App Store Connect → **TU WorkTime Tracker** → **TestFlight** tab → iOS builds → status goes *Processing → Ready to Test*.
- No export-compliance prompt (declared `ITSAppUsesNonExemptEncryption=false`).
- **Internal testing needs no Apple review** → installable immediately once processed. **= BUILD AVAILABLE IN TESTFLIGHT.**

### 3. App Store listing (for App Store Review — after TestFlight)
Enter in App Store Connect (all copy is drafted in [IOS_RELEASE_STATUS.md](./IOS_RELEASE_STATUS.md#app-store-listing-copy-drafted--ready-to-paste)):
- Subtitle, promo text, keywords, description, "What's New".
- **App Privacy** → "No, we do not collect data" → **Data Not Collected**.
- **Age rating** → all None → **4+**.
- **Category** Productivity · **Price** €2.99 · **Territories** all.
- **Support URL** `https://tuautomation.de` · **Privacy Policy** `https://tuautomation.de/privacy-worktimer.html`.
- Attach build **1** to version **1.0.0**.

### 4. Screenshots (only blocker left for Review)
- Required: **1290×2796** (6.7") or **1320×2868** (6.9"), portrait, 1–10 images. No iPad.
- **Windows has no iOS Simulator** → fastest no-Mac routes: capture on a physical iPhone via TestFlight, OR composite at exact resolution in a design tool.
- Suggested 5 screens: Home timer (active) → Add Trip → History → Statistics (chart) → Settings (GPS/work location).

### 5. Submit for Apple Review
- Only after metadata + screenshots + build attached. **Wait for explicit approval before clicking Submit.**

## Expected Apple status when you return
- If you have **not** yet run step 1: build exists on EAS, nothing in TestFlight.
- If step 1 was run: build should be **Ready to Test** in TestFlight; App Store version `1.0.0` still **"Prepare for Submission"** (needs metadata + screenshots).

## Commands you may need
```bash
# Check latest iOS build status
eas build:list --platform ios --limit 3

# Inspect a specific build
eas build:view 4a02eaf1-a178-490c-84ce-b9db9c15b346

# Upload existing build to TestFlight (no rebuild)
eas submit --profile production --platform ios --latest

# Who am I logged in as (EAS)
eas whoami

# Type-check before any future change
npx tsc --noEmit
```

## Important locations
- **Repo:** https://github.com/tomaszurbanski/worktime-tracker (branch `main`)
- **EAS project / builds:** https://expo.dev/accounts/tomaszurbanski/projects/worktime-tracker/builds
- **This build:** https://expo.dev/accounts/tomaszurbanski/projects/worktime-tracker/builds/4a02eaf1-a178-490c-84ce-b9db9c15b346
- **App Store Connect:** https://appstoreconnect.apple.com (app `TU WorkTime Tracker`, ascAppId `6785502105`)
- **Local project:** `C:\Users\t_urb\Projects\worktime-tracker`

## Release workflow (one line)
build (done) → **eas submit (next)** → Apple processing → TestFlight → ASC metadata + screenshots → Submit for Apple Review.
