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
- **Real pricing** ($299 / $599 / $999 per month — matches live site)
- Contact with **(360) 952-1249** and leadership names

## Demo data

On first server start, the app seeds realistic demo data:
- 4 customers, 12 vehicles, 8 work orders, 5 loads, invoices, fuel logs, and more

**Demo logins** (password `demo123`):
- `manager@fleetco.com` — fleet manager
- `driver1@fleetco.com` — driver

**Executive login:** `admin@fleetco.com` / `admin123`

To re-seed on an existing database (executive only), invoke the `seedDemoData` function from the portal or API.
