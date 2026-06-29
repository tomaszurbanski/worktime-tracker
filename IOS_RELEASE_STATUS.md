# IOS_RELEASE_STATUS — TU WorkTime Tracker

> Everything completed for the iOS release, plus what remains. Updated: **2026-06-29**.
> See also: [CURRENT_STATUS.md](./CURRENT_STATUS.md) · [NEXT_SESSION.md](./NEXT_SESSION.md) · [RELEASE_HISTORY.md](./RELEASE_HISTORY.md)

## Identifiers
| Item | Value |
|---|---|
| Store app name (Apple) | `TU WorkTime Tracker` |
| On-device app name | `WorkTime Tracker` (`app.json` → `expo.name`) |
| Bundle Identifier | `com.turbanski.worktimetracker` |
| Apple Team ID | `HJ3G5FK5QQ` |
| App Store Connect App ID (`ascAppId`) | `6785502105` |
| Apple ID (submit account) | `info@tuautomation.de` |
| EAS project ID | `53e8d835-eaf0-4a81-b8f2-eb641c49a6f0` |
| EAS account / owner | `tomaszurbanski` (signed in as `t_urbanski@outlook.com`) |
| Privacy Policy URL | https://tuautomation.de/privacy-worktimer.html |
| Support URL | https://tuautomation.de |
| App version / iOS build number | `1.0.0` / `1` |

## ✅ Completed (this session)
- **Apple Developer** — account active/approved; Team ID `HJ3G5FK5QQ` confirmed.
- **App Store Connect app record** — created for the bundle ID; `ascAppId 6785502105`.
- **EAS configuration** (`eas.json`):
  - `submit.production.ios` = `appleId info@tuautomation.de`, `ascAppId 6785502105`, `appleTeamId HJ3G5FK5QQ` (no TODO placeholders left).
  - `build.production.ios` = `credentialsSource: remote`; `cli.appVersionSource: remote`; `autoIncrement: true`.
- **App config** (`app.json`):
  - `ios.bundleIdentifier`, `ios.buildNumber: "1"`, `supportsTablet: false`.
  - `ios.infoPlist.NSLocationWhenInUseUsageDescription` (location usage string).
  - `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` (export compliance — no per-build prompt).
- **iOS Distribution Certificate** — ✅ created during the build (EAS-managed, remote).
- **Provisioning Profile** — ✅ created during the build (EAS-managed) for `com.turbanski.worktimetracker`.
- **Successful production build** — see table below.
- **Pre-release polish** committed: i18n placeholder localization (22 langs) + removal of obsolete Ads/Free-Premium scaffolding.

### Build record
| Field | Value |
|---|---|
| Build ID | `4a02eaf1-a178-490c-84ce-b9db9c15b346` |
| Status | **FINISHED** ✅ |
| Platform / Profile | iOS / production |
| Version / Build number | `1.0.0` / `1` |
| Started → Completed (UTC) | 2026-06-29 13:56:20 → 14:02:07 (~5 min 46 s) |
| Build page | https://expo.dev/accounts/tomaszurbanski/projects/worktime-tracker/builds/4a02eaf1-a178-490c-84ce-b9db9c15b346 |
| IPA artifact | https://expo.dev/artifacts/eas/Nz78gxk4AEUSYHBXnQVUY635U1JO-vdlCnghlhkeWTk.ipa |

## ⏳ In progress / not done
- **App Store Connect API Key** — ❌ not created yet. `eas submit` stopped here because key setup requires interactive mode (Apple login + 2FA). Creating it once makes future submits headless.
- **TestFlight upload** — ❌ not done. Command staged: `eas submit --profile production --platform ios --latest`.
- **Apple processing** — pending upload.

## Remaining App Store tasks (after TestFlight)
- [ ] Create **screenshots** — `1290×2796` (6.7") or `1320×2868` (6.9"), 1–10 portrait images (no iPad — `supportsTablet:false`).
- [ ] Enter listing copy in App Store Connect (drafted below).
- [ ] Complete **App Privacy** questionnaire → **Data Not Collected** (code-verified: no network/analytics/SDKs).
- [ ] Complete **Age rating** → answers all "None" → **4+**.
- [ ] Set **Category** = Productivity; **Price** = €2.99; **Territories** = all (or chosen).
- [ ] Confirm **Export compliance** (already declared in binary → no docs needed).
- [ ] Attach build `1` to the `1.0.0` App Store version.
- [ ] Submit for Apple Review.

## App Store listing copy (drafted — ready to paste)
- **Subtitle (≤30):** `Work hours, trips & reports`
- **Promotional text (≤170):** `Track your work hours with a single hold. GPS can auto-start when you reach work. Log business trips and export clean PDF & CSV timesheets in seconds.`
- **Keywords (≤100):** `timesheet,time tracker,hours,attendance,work log,gps,business trip,mileage,pdf,csv,clock in`
- **Description:**
```
TU WorkTime Tracker is a fast, private way to record your working hours and turn them into clean, shareable reports — built for employees, freelancers, field technicians and anyone who needs an accurate record of time on the job.

Start and stop your workday with a single press-and-hold, or let GPS do it for you: set your workplace once and the app can automatically begin and end a session as you arrive and leave. Heading out on a business trip? Log the destination, purpose, date, distance and notes, and keep trip time separate from regular work. You can also track your commute as its own category.

Everything is summarised for you — daily, weekly, monthly or a custom range — with total time, number of work days and daily averages, plus a clear daily chart. When it's time to report, export a professional PDF timesheet or a CSV file in seconds, including your name and company, ready to send to your employer, client or accountant.

KEY FEATURES
• One-hold start/stop for instant time tracking
• Optional GPS auto mode — sessions begin and end at your workplace
• Business trips with destination, purpose, distance and notes
• Separate commute tracking
• History with a daily breakdown
• Statistics: totals, work days, daily average and a daily chart
• PDF and CSV export with employee and company details
• Optional daily start reminder
• 22 languages, with light, dark and system themes

PRIVATE BY DESIGN
• Works fully offline — no account, no sign-up
• Your data stays on your device; nothing is uploaded
• No ads, no tracking, no in-app purchases

A single one-time purchase. No subscriptions.

Questions or feedback? Contact info@tuautomation.de
```
- **Release notes / "What's New" (v1.0.0):**
```
First release of TU WorkTime Tracker.

• Track work hours by press-and-hold or automatic GPS
• Log business trips and commutes separately
• Daily, weekly, monthly and custom statistics
• Export professional PDF and CSV timesheets
• 22 languages, with light and dark themes
```
