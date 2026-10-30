# FleetCo Marketing Assets

## Named initiative: **PhonePulse**

**Codename:** `PhonePulse` (smartphone-first telematics — strategy, demo deck, site positioning; implementation roadmap inside the deck)

When you want this shipped to git, say something like: **“Push PhonePulse”** or **“Commit and push the PhonePulse pack.”**

| Item | Path |
|------|------|
| Demo deck (80+ slides; dual iPhone/Android camera review + AI distraction) | `marketing/FleetCo-Smartphone-Telematics-Demo.pptx`, `public/marketing/` copy |
| Generator | `npm run marketing:telematics` → `scripts/generate-smartphone-telematics-deck.js` |
| Blank-slide audit | `scripts/audit-pptx-content.mjs` |
| Gallery download | `TELEMATICS_DECK_DOWNLOAD` in `src/lib/brand.js`, card on Marketing Gallery |

*Does not include unbuilt product work (geofence engine, Safety AI on live stream, BLE OBD) — those are documented in the deck as roadmap.*

## Client PowerPoint

Generate the client-facing deck:

```bash
npm install
npm run marketing:deck
```

Output: **`FleetCo-Client-Presentation.pptx`** (8 slides) — also copied to `public/marketing/` for download from the Marketing Gallery.

Topics covered:
- Cover & value proposition
- Problem / solution
- Site Commander & Revan AI
- ROI metrics
- Customer segments
- **Real pricing** (Starter $299 / Growth $599 · Enterprise custom quote)
- Contact with **(360) 952-1249** and leadership names

## Demo data

On first server start, the app seeds realistic demo data:
- 4 customers, 12 vehicles, 8 work orders, 5 loads, invoices, fuel logs, and more

**Demo logins** (password `demo123`):
- `manager@fleetco.com` — fleet manager
- `driver1@fleetco.com` … `driver5@fleetco.com` — drivers (DRV-90001 … DRV-90005)

**Executive login:** `admin@fleetco.com` / `admin123`

To re-seed on an existing database (owner/executive), invoke the `seedDemoData` function from the portal or API. For driver accounts only: `node scripts/seed-demo-drivers.mjs`.
