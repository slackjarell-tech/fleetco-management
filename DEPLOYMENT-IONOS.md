# Connect fleetcomanagement.org (IONOS) to Fleetco Management

You already own **fleetcomanagement.org** on IONOS. This guide walks you through pointing that domain at the app and going live.

## Current status (DNS configured)

IONOS DNS is **already updated** for Render:

| Type | Host | Value |
|------|------|-------|
| **A** | `@` | `216.24.57.1` |
| **CNAME** | `www` | `fleetco-management.onrender.com` |
| **MX** | `@` | Google mail (unchanged) |

**Next step:** deploy the app on [Render](https://dashboard.render.com) — see **Deploy on Render** below. The site shows 503 until deployment completes.

## Important: IONOS shared hosting won't run this app

The Fleetco portal is a **Node.js** app (Express + SQLite). IONOS standard **Web Hosting** and **Website Builder** plans only support PHP/static sites — they **cannot** run this project.

You have two good options:

| Option | Where the app runs | Where DNS lives |
|--------|-------------------|-----------------|
| **B — Render (matches your DNS)** | [Render.com](https://render.com) — free tier available | IONOS (already configured) |

**Recommended: Option B (Render)** — your IONOS DNS already points here.

---

## Deploy on Render (do this now)

1. Sign in at [dashboard.render.com](https://dashboard.render.com) with **GitHub**
2. Push this project to a GitHub repo
3. **New → Blueprint** → select repo (uses `render.yaml` in this project)
4. After deploy, add custom domains: `fleetcomanagement.org` and `www.fleetcomanagement.org`
5. Render enables HTTPS automatically once DNS verifies

---

## Option A — Railway + IONOS DNS

### Part 1 — Deploy on Railway

1. Push this project to **GitHub** (create a repo and push the code).

2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select your repo.

3. Open the service → **Settings** → **Deploy**:
   - **Start Command:** `npm run start`
   - Railway runs `npm install` automatically; the `railway.json` in this repo runs `npm run build` during build.

4. **Settings → Variables** — add:

   ```
   NODE_ENV=production
   APP_ORIGIN=https://fleetcomanagement.org
   VITE_SITE_URL=https://fleetcomanagement.org
   JWT_SECRET=paste-a-long-random-string-here
   ```

   Generate a secret (PowerShell):
   ```powershell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
   ```

5. **Settings → Volumes** → Add volume:
   - Mount path: `/app/server/data`
   - This keeps your SQLite database across redeploys.

6. **Settings → Networking → Generate Domain** — note the Railway URL (e.g. `fleetco-production.up.railway.app`).

7. **Settings → Networking → Custom Domain** → Add:
   - `fleetcomanagement.org`
   - `www.fleetcomanagement.org`

   Railway shows the DNS records you need (usually a **CNAME** for `www` and either **CNAME** or **A records** for the root `@`).

---

### Part 2 — Configure DNS in IONOS

1. Log in at [my.ionos.com](https://my.ionos.com).

2. Go to **Domains & SSL** → click **fleetcomanagement.org**.

3. Open **DNS** (or **Manage DNS Settings**).

4. **Remove or disable** conflicting records that point the domain elsewhere:
   - Old **A** records for `@` pointing to IONOS parking pages
   - Old **CNAME** for `www` pointing to IONOS website builder
   - You can leave **MX** records if you use IONOS email

5. **Add the records Railway gives you.** Typical setup:

   #### For `www` (always works)

   | Type | Host name | Points to / Value | TTL |
   |------|-----------|-------------------|-----|
   | **CNAME** | `www` | `your-app.up.railway.app` | 1 hour |

   #### For root `@` (fleetcomanagement.org without www)

   IONOS does **not** allow CNAME on the root domain in most cases. Railway will show one of these:

   **If Railway gives A records** (most common for apex):

   | Type | Host name | Points to / Value | TTL |
   |------|-----------|-------------------|-----|
   | **A** | `@` | `216.24.57.x` (use IPs Railway shows) | 1 hour |
   | **A** | `@` | second IP if Railway lists two | 1 hour |

   **If Railway gives a CNAME for `@`** and IONOS blocks it:
   - In IONOS, use **Redirect** instead: **Domains & SSL** → **fleetcomanagement.org** → **Redirect** → redirect `@` to `https://www.fleetcomanagement.org`, **or**
   - Use the A records from Railway's custom domain panel.

6. Click **Save**. IONOS DNS changes usually propagate in **15–60 minutes** (sometimes up to 24 hours).

---

### Part 3 — SSL on Railway

Once DNS propagates, Railway automatically provisions **HTTPS** for both:
- `https://fleetcomanagement.org`
- `https://www.fleetcomanagement.org`

Check status in Railway → **Settings → Networking → Custom Domains** (should show green / verified).

---

### Part 4 — Test the live site

- [ ] https://fleetcomanagement.org — homepage with Fleetco logo
- [ ] https://fleetcomanagement.org/login — login page
- [ ] Sign in: `admin@fleetco.com` / `admin123` → **change password immediately**
- [ ] https://fleetcomanagement.org/portal — dashboard loads

---

## Option B — IONOS VPS (everything on IONOS)

Use this if you prefer to host on IONOS instead of Railway.

### 1. Order IONOS VPS

- [IONOS VPS](https://www.ionos.com/hosting/virtual-private-servers) — Linux, Ubuntu 22.04 recommended.
- Note the **server IP address** from the IONOS control panel.

### 2. Point DNS at the VPS IP

In **IONOS → Domains & SSL → fleetcomanagement.org → DNS**:

| Type | Host name | Value | TTL |
|------|-----------|-------|-----|
| **A** | `@` | `YOUR.VPS.IP.ADDRESS` | 1 hour |
| **A** | `www` | `YOUR.VPS.IP.ADDRESS` | 1 hour |

Remove conflicting A/CNAME records for `@` and `www`.

### 3. Install the app on the VPS

SSH into the server (IONOS panel shows root password):

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx certbot python3-certbot-nginx

# Clone your repo
git clone https://github.com/YOUR_USER/fleet-pulse-command.git /var/www/fleetco
cd /var/www/fleetco
npm install

# Environment
cp .env.production.example .env
nano .env   # set JWT_SECRET and confirm APP_ORIGIN=https://fleetcomanagement.org

# Build and run with PM2
npm run build
sudo npm install -g pm2
pm2 start npm --name fleetco -- run start
pm2 save
pm2 startup
```

### 4. Configure nginx + SSL

```bash
sudo cp /var/www/fleetco/deploy/nginx.conf /etc/nginx/sites-available/fleetcomanagement.org
sudo ln -s /etc/nginx/sites-available/fleetcomanagement.org /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# HTTPS (Let's Encrypt — free)
sudo certbot --nginx -d fleetcomanagement.org -d www.fleetcomanagement.org
```

---

## IONOS email (optional)

If you use **IONOS Mail** for `@fleetcomanagement.org`, **do not delete MX records** when adding A/CNAME records for the website.

To add a mailbox in IONOS:
1. **Email & Office** → create mailbox (e.g. `info@fleetcomanagement.org`)
2. MX records are usually added automatically

---

## Quick reference — IONOS DNS panel labels

IONOS sometimes labels the "Host name" column differently:

| What you need | IONOS "Host name" field |
|---------------|-------------------------|
| Root domain | `@` or leave **blank** |
| www subdomain | `www` |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Site shows IONOS parking page | Remove old A records for `@`; wait for DNS propagation |
| `www` works but root doesn't | Add Railway's A records for `@`, or redirect `@` → `www` in IONOS |
| SSL certificate pending | Wait 30–60 min after DNS is correct; check Railway custom domain status |
| Login works locally but not live | Confirm `APP_ORIGIN=https://fleetcomanagement.org` in Railway/env |
| Data lost after redeploy | Add Railway volume at `/app/server/data` |

---

## Checklist

- [ ] App deployed (Railway or IONOS VPS)
- [ ] `JWT_SECRET` set (not the default)
- [ ] DNS updated in IONOS for `@` and `www`
- [ ] HTTPS working
- [ ] Default admin password changed
- [ ] `server/data/` backed up (Railway volume or VPS)

When Railway is deployed, paste your Railway hostname here if you want help verifying the exact IONOS DNS records to enter.
