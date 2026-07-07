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

## Try on mobile browser (no app store yet)

1. Open **https://fleetcomanagement.org/login?app=driver**
2. Sign in as a driver (e.g. `driver1@fleetco.com` / `demo123`)
3. You get the mobile driver UI at `/driver`

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
- **Description:** Fleet management for drivers — clock in, share live location, scan barcodes, complete routes, HOS, and inspections. Syncs with FleetCo Management portal.

### Permissions (required for review)

| Permission | Why |
|------------|-----|
| Location (always while clocked in) | Live fleet map for dispatch |
| Camera | POD photos, inspections, clock-in verification |
| Cellular data | Works on the road without Wi‑Fi |

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
