# FleetCo Driver — Mobile App (iOS & Android)

The **FleetCo Driver** app uses the same backend as [fleetcomanagement.org](https://fleetcomanagement.org). Everything drivers capture in the app — GPS, photos, barcode scans, HOS, routes — appears instantly in the customer web portal.

## Driver app features

| Feature | App | Web portal (customers see) |
|---------|-----|--------------------------|
| Live GPS while clocked in | Time Clock | Fleet Map, Route Dashboard |
| Camera photos (POD, clock-in) | Time Clock, Inspections, Route | Same records + uploads |
| Barcode / QR scan | Scan tab | **Finance → Driver Scans** |
| Delivery route & POD | Route tab | Route Dashboard, PD Command |
| Loads, HOS, Fuel, Messages | More menu | Same modules |

## Test on your PC (phone-sized window)

Fastest way to exercise the driver UI without a physical phone or Play Store install:

```powershell
npm run driver:preview
```

On first login, drivers see an **Allow Camera & Location** screen (same as the native app). Both permissions are required before the ELD dashcam and fleet GPS features activate.

Then sign in: **driver1@fleetco.com** / **demo123**, press **F12** → device toolbar → **iPhone 14 Pro**.

Seed drivers only (dev server already running):

```bash
npm run seed:local-drivers
```

### Full native Android app on PC (emulator)

For Capacitor camera/GPS/permissions (closer to the real Play Store app):

```powershell
npm run driver:android-emulator   # one-time: SDK + Pixel 7 AVD (~2 GB download)
emulator -avd FleetCo_Phone         # start emulator, wait for home screen
npm run dev:server                  # local API on :3001 (separate terminal)
npm run driver:android-debug        # builds debug APK + installs on emulator
```

The debug build uses `.env.mobile.local` with `VITE_API_BASE=http://10.0.2.2:3001` so the emulator reaches your PC’s API.

## Try on mobile browser (no app store yet)

1. Open **https://fleetcomanagement.org/login?app=driver**
2. Sign in with any demo driver below (password **`demo123`** for all)
3. You get the mobile driver UI at `/driver`

### Demo driver logins (for testers)

| # | Name | Email | Password | Driver # | Login URL |
|---|------|-------|----------|----------|-----------|
| 1 | Demo Driver 1 | driver1@fleetco.com | demo123 | DRV-90001 | https://fleetcomanagement.org/login?app=driver |
| 2 | Demo Driver 2 | driver2@fleetco.com | demo123 | DRV-90002 | https://fleetcomanagement.org/login?app=driver |
| 3 | Demo Driver 3 | driver3@fleetco.com | demo123 | DRV-90003 | https://fleetcomanagement.org/login?app=driver |
| 4 | Demo Driver 4 | driver4@fleetco.com | demo123 | DRV-90004 | https://fleetcomanagement.org/login?app=driver |
| 5 | Demo Driver 5 | driver5@fleetco.com | demo123 | DRV-90005 | https://fleetcomanagement.org/login?app=driver |

All demo drivers are linked to the **Lone Star Freight LLC** demo customer when demo data is seeded.

**Production:** run `node scripts/seed-demo-drivers.mjs` (owner login required) to create or refresh these accounts on https://fleetcomanagement.org.

## Build for App Store & Google Play

### Prerequisites

- Node.js 18+
- **Android:** Android Studio + SDK
- **iOS:** Mac with Xcode (for Apple App Store)
- Apple Developer account ($99/yr) and Google Play Console ($25 one-time)

### Commands

```bash
npm install
npm run build:mobile    # builds with VITE_API_BASE=https://fleetcomanagement.org
npx cap add android     # first time only
npx cap add ios         # first time only (Mac)
npm run cap:sync        # copy web build into native projects
npm run cap:open:android
npm run cap:open:ios
```

### Store listing

- **App name:** FleetCo Driver
- **Bundle ID:** `org.fleetcomanagement.driver`
- **Category:** Business / Productivity
- **Short description (Play Store, 80 chars):** Clock in, share live GPS, complete routes & scans. Syncs to FleetCo portal.
- **Full description:** Copy-paste ready text in [scripts/play-store-listing.txt](scripts/play-store-listing.txt) and [marketing/play-store-listing.txt](marketing/play-store-listing.txt).
- **App access (Play Console):** See [scripts/play-console-app-access.txt](scripts/play-console-app-access.txt) for copy-paste reviewer instructions and credentials.

### Permissions (required for review)

| Permission | Why |
|------------|-----|
| Location (always while clocked in) | Live fleet map for dispatch |
| Camera | POD photos, inspections, clock-in verification |
| Cellular data | Works on the road without Wi‑Fi |

## Google Play Review Credentials

**Two different logins — do not mix them up:**

| Purpose | Account | Password | Where to use |
|---------|---------|----------|--------------|
| **Play Console sign-in** (developer) | `jarell.slack@fleetcomanagement.org` | *(your Google password)* | [Google Play Console](https://play.google.com/console) only |
| **In-app / reviewer test** (executive portal) | `admin@fleetco.com` | `admin123` | https://fleetcomanagement.org/login |
| **In-app / reviewer test** (driver app) | `driver1@fleetco.com` | `demo123` | https://fleetcomanagement.org/login?app=driver or in-app webview |

- **Play Console** uses your Google account (`jarell.slack@fleetcomanagement.org`) — this is *not* an in-app login.
- **Google Play reviewers** use the in-app credentials above. They never use the Play Console Google account inside the app.
- For **App access** (Policy → App content → App access), paste the copy-ready text from [`scripts/play-console-app-access.txt`](scripts/play-console-app-access.txt).

### Reviewer walkthrough

1. Install **FleetCo Driver** from the Play review track.
2. Open the app — the sign-in screen loads via webview.
3. Sign in with **driver1@fleetco.com** / **demo123** (driver features: Time Clock, Route, Scan, HOS).
4. Optionally open **https://fleetcomanagement.org/login** in a browser with **admin@fleetco.com** / **admin123** to view the executive portal (Fleet Map, Route Dashboard, Driver Scans).

Demo driver accounts are seeded in production via `node scripts/seed-demo-drivers.mjs`. Do **not** change the admin password for review — reviewers rely on the documented demo credentials.

## Architecture

```
┌─────────────────────┐     HTTPS      ┌──────────────────────────┐
│  FleetCo Driver App │ ──────────────►│  fleetcomanagement.org   │
│  (iOS / Android)    │   same API     │  Express + shared DB     │
└─────────────────────┘                └───────────┬──────────────┘
                                                   │
┌─────────────────────┐                            │
│  Customer Web Portal│ ◄──────────────────────────┘
│  (owner / dispatch) │   DriverLocation, BarcodeScan,
└─────────────────────┘   Loads, Messages, etc.
```

## Customer portal — view driver data

- **Fleet Map** — live driver GPS
- **Route Dashboard** — delivery progress
- **Driver Scans** — barcode scan history with GPS
- **Time Clock** (admin) — shift records
- **Messages** — driver dispatch chat

All data uses the same `DriverLocation`, `BarcodeScan`, `TimeClockEntry`, and other entities — no separate database.
