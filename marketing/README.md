# FleetCo Marketing Assets

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
