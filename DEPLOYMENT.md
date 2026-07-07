# Deploying to fleetcomanagement.org

This guide connects the Fleetco Management app to **https://fleetcomanagement.org**.

> **Domain on IONOS?** Use the step-by-step guide: **[DEPLOYMENT-IONOS.md](./DEPLOYMENT-IONOS.md)**

## Overview

The app is a full-stack deployment:

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite (builds to `dist/`) |
| API | Express on port 3001 (or `PORT` env var) |
| Database | SQLite in `server/data/` |

In production, one Node process serves both the API and the built frontend.

---

## Step 1 — Domain

You own **fleetcomanagement.org** on IONOS. Skip registration — go to **[DEPLOYMENT-IONOS.md](./DEPLOYMENT-IONOS.md)** for IONOS DNS steps.

For other registrars, confirm you can access DNS settings for the domain.

---

## Step 2 — Choose hosting

Recommended options that support Node.js + persistent storage:

| Provider | Best for | Notes |
|----------|----------|-------|
| **[Railway](https://railway.app)** | Easiest full-stack deploy | Connect GitHub repo, set env vars, auto SSL |
| **[Render](https://render.com)** | Simple web service | Free tier available; add persistent disk for SQLite |
| **VPS (DigitalOcean, Linode, Hetzner)** | Full control | Use included `deploy/nginx.conf` |

---

## Step 3 — Deploy the app

### Option A: Railway (recommended)

1. Push this project to GitHub.
2. Create a new **Railway** project → **Deploy from GitHub repo**.
3. Set **Start Command**: `npm run start:prod`
4. Add environment variables:

   ```
   NODE_ENV=production
   APP_ORIGIN=https://fleetcomanagement.org
   VITE_SITE_URL=https://fleetcomanagement.org
   JWT_SECRET=<generate-a-64-char-random-string>
   ```

5. Add a **Volume** mounted at `/app/server/data` (keeps SQLite across deploys).
6. Railway gives you a URL like `your-app.up.railway.app`.

### Option B: VPS with nginx

```bash
# On your server (Ubuntu)
git clone <your-repo> /var/www/fleetco
cd /var/www/fleetco
npm install
cp .env.production.example .env
# Edit .env with your JWT_SECRET and domain

npm run start:prod
# Or use PM2:
npm install -g pm2
pm2 start npm --name fleetco -- run start
pm2 save && pm2 startup
```

Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/fleetcomanagement.org`, enable it, and reload nginx.

---

## Step 4 — Point DNS to your server

**IONOS users:** see **[DEPLOYMENT-IONOS.md](./DEPLOYMENT-IONOS.md)** for the exact IONOS DNS panel steps.

In your domain registrar's DNS panel for **fleetcomanagement.org**:

### If using Railway / Render (they provide a hostname)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `@` | `your-app.up.railway.app` | 3600 |
| CNAME | `www` | `your-app.up.railway.app` | 3600 |

> Some registrars don't allow CNAME on `@`. Use their **ALIAS/ANAME** record, or point `@` to the platform's IP with an **A record** (check your host's docs).

### If using a VPS (static IP `YOUR.SERVER.IP`)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR.SERVER.IP` | 3600 |
| A | `www` | `YOUR.SERVER.IP` | 3600 |

DNS propagation usually takes 5–60 minutes.

---

## Step 5 — Enable HTTPS (SSL)

### Railway / Render
SSL is automatic once DNS is pointed correctly.

### VPS with nginx
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d fleetcomanagement.org -d www.fleetcomanagement.org
```

Certbot auto-renews and updates nginx for HTTPS.

---

## Step 6 — Verify

After DNS + SSL propagate, check:

- [ ] https://fleetcomanagement.org loads the homepage with the Fleetco logo
- [ ] https://fleetcomanagement.org/login works
- [ ] Login with `admin@fleetco.com` / `admin123` (change this password immediately!)
- [ ] https://fleetcomanagement.org/portal loads after login
- [ ] API health: browser dev tools → Network → `/api/public-settings` returns 200

---

## Email (optional)

To send real emails from `@fleetcomanagement.org`:

1. Add **MX records** at your registrar (Google Workspace, Microsoft 365, or Zoho).
2. Or use **Cloudflare Email Routing** to forward `info@fleetcomanagement.org` to your inbox.

Example MX for Google Workspace:
```
MX  @  ASPMX.L.GOOGLE.COM  Priority 1
```

---

## Security checklist for production

- [ ] Change the default admin password
- [ ] Set a strong `JWT_SECRET` (never commit it)
- [ ] Set `NODE_ENV=production`
- [ ] Back up `server/data/fleet-pulse.db` regularly
- [ ] Restrict server firewall to ports 80, 443, and SSH only

---

## Local development vs production

| | Development | Production |
|---|-------------|------------|
| Frontend | http://localhost:5173 | https://fleetcomanagement.org |
| API | http://localhost:3001 (proxied by Vite) | Same origin (Express serves both) |
| Command | `npm run dev` | `npm run start:prod` |

---

## Need help?

If you tell me which host you're using (Railway, Render, VPS, etc.), I can generate the exact config files for that platform.
