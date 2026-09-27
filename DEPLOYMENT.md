# Production Deployment Guide: ShopManu

This document outlines the end-to-end production deployment process for the ShopManu food discovery platform.

---

## 1. Prerequisites
- **Node.js**: Version 18.x, 20.x, or 22.x LTS (tested on Node.js v24 LTS).
- **Package Manager**: `npm` (v9+).
- **Backend**: Managed InsForge PostgreSQL BaaS instance with PostGIS extension.
- **Third-Party APIs**: Google Cloud Platform account with **Maps JavaScript API** enabled.
- **Hosting Platform**: Vercel (or InsForge Web Hosting / Cloudflare Pages / AWS Amplify).

---

## 2. Repository & Build Setup
Clone the repository and install locked dependencies:
```bash
git clone <repository_url>
cd Shop_Manu
npm ci
```

Verify type definitions and production compilation:
```bash
npm run lint       # Type checking via tsc --noEmit
npm run build      # Production bundle compilation via Vite
```

---

## 3. Environment Variables
Configure the following environment variables in your deployment environment (e.g. Vercel Project Settings > Environment Variables).

| Variable Name | Environment | Required | Description |
| :--- | :--- | :--- | :--- |
| `VITE_INSFORGE_URL` | Production & Preview | **Yes** | Your InsForge Backend API Base URL (e.g. `https://yke9qwgm.us-east.insforge.app`). |
| `VITE_INSFORGE_ANON_KEY` | Production & Preview | **Yes** | InsForge client anonymous public API key. |
| `VITE_GOOGLE_MAPS_API_KEY` | Production & Preview | Optional | Google Maps JavaScript API browser key. If empty, platform runs gracefully in fallback mode (physical addresses, coordinate saving, and directions links remain fully active). |

> [!IMPORTANT]
> Never commit `.env` or production credentials into git. `.gitignore` is configured to exclude `.env` and `.env.*`. Always refer to `.env.example` for variable names.

---

## 4. Google Maps Setup & Key Hardening
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Maps JavaScript API** for your project.
3. Under **Credentials**, create an API Key and restrict it:
   - **Application Restrictions**: Set to **Websites (HTTP referrers)** and add your production domain(s) (e.g. `https://shopmanu.com/*`, `https://*.vercel.app/*`).
   - **API Restrictions**: Restrict the key specifically to **Maps JavaScript API**.

---

## 5. InsForge Backend & Database Setup
1. **PostGIS Extension**: Ensure PostGIS is activated on your InsForge PostgreSQL instance (`CREATE EXTENSION IF NOT EXISTS postgis;`).
2. **Schema & Triggers**:
   - `restaurants` (with status check, verified boolean, coordinates, foreign key to auth.users).
   - `categories`, `foods`, `food_variants`, `price_history`, `restaurant_hours`, `restaurant_reports`, `audit_logs`.
   - Ensure `trg_protect_restaurant_status` trigger is active to prevent unauthorized restaurant self-approval by listing owners.
   - Ensure `admin_update_restaurant_status`, `admin_update_report_status`, and `get_admin_metrics` RPC functions enforce `is_admin()`.
3. **Storage Bucket**: Ensure the `restaurant-media` public bucket is created for food and storefront images.
4. **Serverless Function**: Ensure the `register-user` edge function is deployed to process new user registrations with server-side validation and role verification.

---

## 6. Deployment Steps (Vercel)
1. Link your repository in the Vercel dashboard.
2. Select **Vite** framework preset.
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
4. Add the environment variables specified in Section 3.
5. Deploy. `vercel.json` will automatically configure:
   - SPA route rewrites to `/index.html`
   - Static caching for `robots.txt` and `sitemap.xml`
   - Production security headers (`CSP`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

---

## 7. Domain Setup & HTTPS
1. In Vercel, assign your custom domain: `shopmanu.com` and `www.shopmanu.com`.
2. Configure DNS A / CNAME records as directed by your registrar.
3. Verify automatic SSL/TLS certificate issuance.

---

## 8. Post-Deployment Verification Checklist
Run through this live production checklist immediately following deployment:
- [ ] **Homepage**: Loads with status 200, displays approved restaurants, and renders header/footer.
- [ ] **HTTPS & Headers**: Valid SSL certificate, response headers contain `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Content-Security-Policy`.
- [ ] **Search**: Food search, restaurant search, and locality pills execute without errors.
- [ ] **Near Me**: Location permission request prompts, calculates authentic distance, and sorts nearest first.
- [ ] **Restaurant Detail**: Navigating to `/restaurant/:slug` displays real menu categories, portion prices, and operating hours.
- [ ] **Directions & Contact**: "Get Directions" opens Google Maps with correct coordinates; "Call" opens `tel:` link.
- [ ] **Authentication**: Customer and Owner registration and login flows work smoothly.
- [ ] **Owner Portal**: Owner can create a restaurant (defaults to pending), add categories, add dishes, update prices, and view price history.
- [ ] **Admin Portal**: Admin can log in, inspect metrics, approve/suspend restaurants, and triage reports.
- [ ] **Image Upload**: Uploading dish/restaurant images to `restaurant-media` bucket succeeds.
- [ ] **SEO & Indexing**:
  - `https://shopmanu.com/robots.txt` returns valid directives.
  - `https://shopmanu.com/sitemap.xml` returns approved restaurant slugs only.
  - Private routes (`/owner`, `/admin`, `/login`, `/register`) emit `noindex, nofollow`.
- [ ] **Console & Telemetry**: Zero unhandled JavaScript errors in the browser console.

---

## 9. Rollback & Disaster Recovery
- **Instant Rollback**: If an issue is identified in production, open the Vercel Deployments dashboard, select the previous stable deployment, and click **Promote to Production** for immediate zero-downtime rollback.
- **Database Backups**: InsForge maintains automated point-in-time PostgreSQL backups accessible via the InsForge administrative console.
