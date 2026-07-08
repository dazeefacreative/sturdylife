# Deploying Sturdy Life to Namecheap (cPanel)

Target layout:
- **Frontend** (static build) → `sturdylifer.com`, served from `public_html`
- **Backend** (Node/Express via Passenger) → `api.sturdylifer.com`
- **Database** → cPanel MySQL

Do these in order — later steps depend on earlier ones.

---

## 1. Point the domain at Namecheap hosting

Skip this if `sturdylifer.com` was already registered through Namecheap and the hosting was bought under the same account (it's usually pre-wired).

- cPanel home page → top right shows your **Shared IP**.
- In Namecheap **Domain List → Manage → Nameservers**, set to Namecheap's default (`Namecheap BasicDNS`) if not already, and add/confirm:
  - `A` record: `@` → shared IP
  - `A` record: `www` → shared IP
- DNS propagation can take a few hours. You can proceed with the steps below in the meantime.

## 2. Create the `api` subdomain

cPanel → **Domains** → **Create A New Domain**:
- Domain: `api.sturdylifer.com`
- Uncheck "Share document root" — give it its own folder, e.g. `/home/<user>/api.sturdylifer.com`

## 3. Database

cPanel → **MySQL® Database Wizard**:
1. Create database, suffix `sturdy_life` → full name will be `<cpaneluser>_sturdy_life`.
2. Create a user with a strong password → full name `<cpaneluser>_<something>`.
3. Add user to database with **ALL PRIVILEGES**.

Import the schema — cPanel → **phpMyAdmin**:
1. Select the new database in the left sidebar.
2. **Import** tab → choose `backend/schema.sql` from this repo → Go.
   (The `CREATE DATABASE`/`USE` lines are already commented out in that file — cPanel DB users can't run those, and you've already selected the DB.)

**If there's existing production data in Railway's MySQL** to bring over:
```bash
# from your machine, needs a mysql client (e.g. XAMPP's bin, or `brew install mysql-client`)
mysqldump -h <railway-host> -P <railway-port> -u <user> -p<password> --no-create-db --skip-add-drop-table railway > sturdy_life_data.sql
```
Then import `sturdy_life_data.sql` the same way via phpMyAdmin, after the schema import. If the store hasn't taken real orders yet, skip this — the schema import alone is enough.

## 4. Backend — Node.js App (Passenger)

cPanel → **Setup Node.js App** → **Create Application**:
- Node.js version: latest available 18.x or 20.x
- Application mode: **Production**
- Application root: `api.sturdylifer.com` (or a separate folder like `sturdylife-api`, doesn't have to match the subdomain's docroot)
- Application URL: `api.sturdylifer.com`
- Application startup file: `server.js`
- Click **Create**

Get the code onto the server. Easiest path since the repo is on GitHub (`dazeefacreative/sturdylife`):
- cPanel → **Git™ Version Control** → **Create**:
  - Clone URL: `https://github.com/dazeefacreative/sturdylife.git`
  - Repository path: same folder you set as the Node app's application root
- After cloning, cPanel's file structure will have `backend/` and `frontend/` at the repo root — but the Node.js App was pointed at the app root itself, not `backend/`. **Set the Node app's "Application root" to `<repo-folder>/backend`** (edit the app in Setup Node.js App and update the path), so Passenger runs `backend/server.js` directly.

Back in **Setup Node.js App**, open the app and:
- **Environment variables** — add every key from `backend/.env.example`, filled in with real production values (DB creds from step 3, JWT secret — generate a long random string, Paystack **live** secret key, SMTP creds, etc). Do **not** upload a `.env` file — cPanel injects these directly into `process.env`, which is what `server.js`/`dotenv` already expects.
- Click **Run NPM Install** (installs `node_modules` fresh on the server's architecture — required for native deps like `sharp` and `bcryptjs`, don't copy `node_modules` from your machine).
- Click **Restart**.

Check `backend/uploads/` exists and is writable inside the app root (it's where product/hero images land — persists across restarts since it's just a folder on disk, but back it up periodically).

Sanity check: visit `https://api.sturdylifer.com/api/health` → should return `{"status":"ok","env":"production"}`.

## 5. Frontend — static build

Build locally (or in a GitHub Action) with the production API URL baked in:
```bash
cd frontend
pnpm install
pnpm build          # reads frontend/.env.local → VITE_API_URL=https://api.sturdylifer.com/api
```
This produces `frontend/dist/`, including the `.htaccess` (SPA rewrite + asset caching) copied in from `frontend/public/`.

Upload the **contents** of `dist/` (not the folder itself) into `public_html` on the server — cPanel **File Manager** → upload a zip of `dist/*` → extract into `public_html`, or use an FTP client pointed at the account.

Sanity check: visit `https://sturdylifer.com` → site loads, and browser devtools Network tab shows API calls going to `api.sturdylifer.com`.

## 6. SSL

cPanel → **SSL/TLS Status** → select both `sturdylifer.com` and `api.sturdylifer.com` → **Run AutoSSL**. Free Let's Encrypt certs, auto-renewing.

## 7. Paystack dashboard

Paystack dashboard → Settings → API Keys & Webhooks:
- Switch to **live** keys once ready to accept real payments (set `PAYSTACK_SECRET_KEY` in the Node app's env vars).
- Webhook URL → `https://api.sturdylifer.com/api/payment/webhook`

## 8. Email

If using Namecheap Private Email instead of Gmail: cPanel → **Email Accounts** → create e.g. `orders@sturdylifer.com`, then set `SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` in the Node app's env vars (`SMTP_HOST=mail.sturdylifer.com` is already the default in `.env.example`).

## 9. Smoke test checklist

- [ ] `https://api.sturdylifer.com/api/health` returns ok
- [ ] Homepage loads at `https://sturdylifer.com`, images/video load
- [ ] Register + login work
- [ ] Add to cart → checkout → Paystack test card `4084084084084081` completes → order shows as paid
- [ ] Order receipt + admin alert emails arrive
- [ ] `/admin` dashboard loads, product/image upload works (writes to `backend/uploads`)
- [ ] Deep-link refresh (e.g. reload on `/shop/hoodies`) doesn't 404 — confirms `.htaccess` rewrite is active

## 10. Decommission Railway + Netlify

Once everything above checks out for a few days:
- Netlify → delete the site (or just stop auto-deploys from the GitHub repo).
- Railway → delete the project/database.
- Double check nothing external still references `*.up.railway.app` or `*.netlify.app` (Paystack webhook, any saved bookmarks, docs).
