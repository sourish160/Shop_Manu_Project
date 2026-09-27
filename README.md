# Shop Manu: Production Food Discovery Platform

A full-stack, authentic restaurant and food discovery platform built with React, Vite, Tailwind CSS (3.4), PostGIS, and InsForge BaaS.

---

## Architecture Overview

```
                      [ Client Web Application ]
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
    [ Backend / Database ]                    [ Visualization / Navigation ]
          (InsForge)                                (Google Maps Platform)
              │                                         │
 ┌────────────┴────────────┐               ┌────────────┴────────────┐
 │ • Authentication (JWT)  │               │ • Maps JavaScript API   │
 │ • PostgreSQL + PostGIS  │               │ • Interactive Markers   │
 │ • Row Level Security    │               │ • Draggable Pin Picker  │
 │ • Spatial GiST Indexes  │               │ • Universal Directions  │
 │ • Edge Serverless RPCs  │               │ • Info Windows          │
 └─────────────────────────┘               └─────────────────────────┘
```

---

## Phase 6: Google Maps Platform Integration

Google Maps is integrated as the **visualization and navigation layer** for the platform:
1. **Owner Location Picker**: Allows restaurant owners to select, adjust, drag, and fine-tune their establishment pin on an interactive map during creation and profile edits.
2. **Customer Restaurant Map**: Displays the verified restaurant location with an interactive marker and address details on `/restaurant/:slug`.
3. **Universal Get Directions Action**: Deep-links to Google Maps navigation with exact coordinates, functioning seamlessly on desktop browsers, Android, and iOS devices.
4. **Call Restaurant Action**: Provides a direct, secure `tel:` telephone link for customer communication without leaking private owner credentials.

> **CRITICAL ARCHITECTURAL GUARANTEE**: Google Maps does **NOT** replace backend geographic search. All spatial filtering, radius calculations (1 km, 3 km, 5 km, 10 km), and nearest-first sorting continue to execute inside PostgreSQL using PostGIS (`ST_DWithin`, `ST_Distance`). Google Maps is never queried per search result, preventing unnecessary latency and API billing costs.

---

## Google Maps Platform Setup

### 1. Required Google Cloud APIs

Only **one** core Google Cloud API is required for this integration:
- **Maps JavaScript API** (Required): Enables interactive map rendering, marker dragging, info windows, and owner location picker.

*(Optional: Geocoding API may be enabled if reverse address lookup is desired in addition to locality snapping.)*

### 2. Required Environment Variables

Create a `.env.local` file in the project root based on `.env.example`:

```env
# InsForge BaaS Backend
VITE_INSFORGE_URL=https://yke9qwgm.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215

# Google Maps Platform (Phase 6)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. API Key Restrictions (Security Best Practice)

Always restrict your client-side Google Maps API key in the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials):
1. **Application Restrictions**: Select **Websites (HTTP referrers)**:
   - For local development: `http://localhost:5173/*`
   - For production: `https://yourdomain.com/*`
2. **API Restrictions**: Restrict the key to call **Maps JavaScript API** only.
3. **Billing**: Ensure a valid billing account is linked to your Google Cloud project.

---

## Graceful Fallback Behavior (No Broken Pages)

The platform is designed to handle all realistic failure states cleanly without breaking:

| Failure State | System Behavior |
| :--- | :--- |
| **API Key Missing / Empty** | Map container renders a clean, neutral fallback notification. Coordinates, physical address, operating hours, and universal directions links remain 100% active. Owners can enter validated numeric coordinates directly or use authentic locality presets. |
| **Authentication Failure (`gm_authFailure`)** | Global hook captures the event and displays: *"Google Maps authentication failed. Please verify API key permissions and billing."* Page does not crash. |
| **Network Timeout / Script Failure** | 15-second timeout safety triggers a retryable fallback view with direct navigation links. |
| **Missing Restaurant Coordinates** | Displays: *"Location coordinates not specified"*. Physical address and operating hours are shown normally; directions button is disabled. |
| **Invalid Coordinates** | Server-side check constraint `chk_restaurant_coordinates` on `public.restaurants` rejects coordinates outside `[-90, 90]` and `[-180, 180]`. |

---

## Location Data Model

All geographic data is stored in the `public.restaurants` table:

```sql
-- Restaurant Coordinates
latitude numeric CHECK (latitude BETWEEN -90.0 AND 90.0),
longitude numeric CHECK (longitude BETWEEN -180.0 AND 180.0)

-- Spatial Index (accelerates ST_DWithin and ST_Distance)
CREATE INDEX idx_restaurants_spatial_geog ON public.restaurants USING gist (
  (ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)::geography)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

---

## Security & Privacy Protections

1. **Owner Isolation (RLS)**: Row Level Security policy `restaurants_update_owner` enforces that only the authenticated restaurant owner (`owner_id = auth.uid()`) can alter their restaurant coordinates. Owner A cannot modify Owner B's location.
2. **Server-Side Validation**: Database constraints reject out-of-range latitude and longitude values before write commitment.
3. **Customer Privacy**: Customer coordinates are strictly transient (stored in temporary `sessionStorage` only). Exact customer locations are never saved to the database or exposed to restaurant owners.
4. **Data Isolation**: Public restaurant endpoints and PostGIS RPC functions strictly omit owner emails, user IDs, and private administrative data.

---

## Local Development & Testing

### Development Server
```bash
npm install
npm run dev
```

### Type Checking & Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

### Automated Test Suites
```bash
# Phase 7 Admin Panel, Verification, Reports & Menu Freshness (41 tests)
node tests/phase7_admin_test.mjs

# Phase 6 Google Maps & Security Test Suite (29 tests)
node tests/phase6_google_maps_test.mjs

# Phase 5 PostGIS Location & Near Me Test Suite (22 tests)
npx tsx tests/phase5_location_test.mjs
```

---

## Phase 7: Admin Panel, Restaurant Verification, Reports & Menu Freshness

### 1. Role & Authorization Model
- **Roles**: `customer`, `owner`, `admin`.
- **Server-Side Enforcement**: Role definitions reside in `public.profiles`. The registration serverless function (`register-user`) only permits registering `customer` or `owner`. Elevation to `admin` cannot be performed via client parameters, local storage, or headers.
- **SQL Authorization**: `public.is_admin()` evaluates whether the caller's authenticated profile holds `role = 'admin'`. Row Level Security (RLS) policies (`profiles_select_admin`, `restaurants_select_admin`, `restaurants_update_admin`, `reports_select_admin`, `reports_update_admin`, `audit_logs_select_admin`) strictly isolate admin tables and columns.
- **Client Route Protection**: `<ProtectedRoute requiredRole="admin">` verifies active session role and renders a clean 403 Access Restricted view for unauthorized accounts.

### 2. Restaurant Verification Lifecycle & Status Rules
- **States**: `pending`, `approved`, `rejected`, `suspended`.
- **Creation Default**: All newly created restaurants default to `status = 'pending'` and `verified = false`.
- **Status Immutability Trigger**: `public.protect_restaurant_status()` ensures non-admin users cannot alter `status`, `verified`, or `owner_id`. Any unauthorized direct updates are automatically discarded and restored to previous values.
- **State Transitions**: Handled by `public.admin_update_restaurant_status()`:
  - `pending` -> `approved` or `rejected`
  - `approved` -> `suspended`
  - `suspended` -> `approved` (restored)
  - `rejected` -> `approved` (reconsidered)
  - Invalid transitions (e.g. `approved` -> `pending`) are rejected by server-side validation.
- **Verification Flag**: The `verified` badge is only displayed when `verified = true` in the database, backed by administrative confirmation.

### 3. Public Visibility Rules
- **Strict Filtering**: Public restaurant queries (`/restaurant/:slug`), public search (`/search`), food search, and PostGIS Near Me geographic search (`get_nearby_restaurants`, `get_nearby_foods`) enforce `status = 'approved'`.
- **Direct URL Security**: Direct URL access via slug enforces `.eq('status', 'approved')`. If an unapproved or suspended slug is accessed, the frontend displays a 404 Not Found state without leaking owner data.

### 4. User Reporting Workflow
- **Public Submission**: Customers submit reports for restaurants or specific menu items (`restaurant_reports` table).
- **Report Types**: `wrong_price`, `food_unavailable`, `incorrect_info`, `restaurant_closed`, `incorrect_location`, `other`.
- **Moderation Workflow**: Admin reviews reports in `/admin/reports` with statuses `pending`, `investigating`, `resolved`, `dismissed`.
- **Resolution Notes**: Internal resolution notes (`resolution_notes`) are stored securely and only accessible to administrators.

### 5. Menu & Price Freshness Mechanism
- **Configurable Thresholds** (`src/utils/freshness.ts`):
  - **Fresh**: 0 to 30 days (`freshDays: 30`)
  - **Review Recommended**: 31 to 60 days (`reviewRecommendedDays: 60`)
  - **Stale**: > 60 days
- **Owner Dashboard Health**: Operational overview shows exact database-backed counts of Fresh, Review Recommended, Stale, and Unavailable dishes with zero synthetic metrics.
- **Owner Review & Refresh**: In `/owner/menu`, owners can filter items needing review, edit prices (triggering automatic price history entries), and use the "Confirm Fresh" button to confirm their menu is up-to-date.
- **Customer Freshness Context**: Public dish cards show honest dates calculated from database timestamps (`Price updated [actual date]`).

### 6. Audit Logging
- **Ledger**: The `public.audit_logs` table records actor ID, entity type, entity ID, action name, old data, new data, and timestamp.
- **Tracked Actions**:
  - `restaurant_approved`, `restaurant_rejected`, `restaurant_suspended`, `restaurant_restored`
  - `report_status_investigating`, `report_status_resolved`, `report_status_dismissed`
  - Food variant price changes (`variant_price_changed`)
- **Access Control**: Administrative audit logs are protected by RLS and cannot be read by regular customers or owners.

---

## Phase 8: Production UI Refinement, Responsive UX & Accessibility

### 1. Design System & Typography Tokens
- **Restrained Commercial Aesthetic**: Tailored Slate and Emerald palette with zero purple gradients, zero glassmorphism, zero floating blobs, and zero decorative emojis.
- **Structured Typography**: Consistent hierarchy for titles, section headings, variant prices, and metadata.
- **Accessible Focus Indicators**: High-contrast, visible `:focus-visible` styling on all interactive controls (links, buttons, inputs, selects).
- **Mobile Touch Targets**: Minimum 44px touch targets on mobile interactions (`touch-target`).
- **Reduced Motion Support**: Automatic animation suppression for users with `prefers-reduced-motion: reduce`.

### 2. Navigation, Footer & Branding
- **Responsive Navbar**: Accessible mobile drawer for viewports under 768px with ARIA attributes (`aria-expanded`), clean touch targets, and clear role badges (`Owner`, `Admin`).
- **Commercial Footer**: Clean directory navigation, authentic legal links, and platform copyright.
- **Favicon & Metadata**: Custom SVG brand favicon (`favicon.svg`) and unified page titles across public, owner, and administrative views.

### 3. Legal Transparency & Policy Pages
- **Privacy Policy (`/privacy`)**: Details in-session coordinate handling (exact customer coordinates are strictly transient and never saved to database profiles).
- **Terms of Service (`/terms`)**: Realistic platform terms with menu price freshness disclaimers, owner accuracy requirements, and moderation guidelines.

### 4. Form Accessibility & Modal Viewport Containment
- **Explicit Label Associations**: All input fields have explicit `id` and `htmlFor` label bindings across Login, Register, New Restaurant, and Edit Restaurant pages.
- **Screen-Reader Labels**: Accessible `.sr-only` labels on icon buttons, filter controls, and dialog titles.
- **Modal Containment**: Dialogs feature `role="dialog"`, `aria-modal="true"`, `max-h-[90vh] overflow-y-auto`, and `Escape` key close listeners to prevent overflow on mobile screens (320px–430px).

### 5. Strict Zero-Fake-Content Assurance
- **No Simulated Ratings**: Zero artificial star ratings or fake customer review counts.
- **No Inflated Metrics**: No hardcoded popularity numbers, customer counts, or testimonial quotes.
- **Pure Database Truth**: All displayed data (names, portion prices, operating hours, distances, freshness dates) originates directly from verified PostgreSQL records.

---

## Phase 9: SEO, Legal, Production Security and Data Protection

### 1. SEO Foundation & Dynamic Metadata
- **Custom SEO Hook (`src/hooks/useSEO.ts`)**: Dynamically sets page titles, meta descriptions, canonical URLs, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`), Twitter cards, and Schema.org JSON-LD scripts on route change.
- **Authentic Restaurant Metadata (`/restaurant/:slug`)**: Metadata dynamically constructed from real database records (restaurant name, localized neighborhood/city, authentic description). Strictly avoids superlative marketing claims ("best restaurant", "top rated") unless backed by verified data.
- **Language & Viewport**: Clean HTML5 semantic structure with `lang="en"`.

### 2. Valid Schema.org Structured Data
- **Structured Data Utility (`src/utils/schemaGenerator.ts`)**: Generates valid `Restaurant` and `LocalBusiness` JSON-LD schemas.
- **Authentic Properties Only**: Includes `PostalAddress`, `GeoCoordinates`, and `OpeningHoursSpecification` (mapped across 0–6 days of week, omitting closed days).
- **Zero Fabrication**: Excludes `aggregateRating`, `reviewCount`, and `priceRange` unless supported by genuine database records.

### 3. Crawling & Indexability Rules
- **Robots Configuration (`public/robots.txt`)**: 
  - Allows public indexable surfaces: `/`, `/restaurant/`, `/search`, `/privacy`, `/terms`.
  - Strictly disallows private surfaces: `/owner/`, `/admin/`, `/login`, `/register`, `/api/`.
  - Directs search engines to `https://shopmanu.com/sitemap.xml`.
- **Private Route Protection**: All private owner and admin pages dynamically emit `<meta name="robots" content="noindex, nofollow">` to prevent accidental indexing.

### 4. Dynamic XML Sitemap
- **Approved Restaurants Only (`public/sitemap.xml` & `scripts/generate-sitemap.mjs`)**: Queries the InsForge database strictly for `status = 'approved'` restaurants.
- **Exclusion of Non-Public Data**: Pending, rejected, and suspended restaurants, as well as admin and owner routes, are strictly excluded from sitemaps.

### 5. Production Security Headers & Vite Configuration
- **Content-Security-Policy (CSP)**: Configured in `vite.config.ts` allowing essential resources for InsForge (`https://*.insforge.app`, `wss://*.insforge.app`) and Google Maps Platform (`https://maps.googleapis.com`, `https://maps.gstatic.com`), while blocking unauthorized script execution and frame injection.
- **Clickjacking Protection**: `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
- **MIME Sniffing Protection**: `X-Content-Type-Options: nosniff`.
- **Referrer Policy**: `Referrer-Policy: strict-origin-when-cross-origin`.
- **Permissions Policy**: `camera=(), microphone=(), payment=(), geolocation=(self)`.

### 6. Open Redirect Protection
- **Safe Redirection Filter**: Implemented `isSafeInternalRedirect` in login and navigation flows, verifying paths start with a single `/` and rejecting protocol-relative targets (`//evil.com`), backslash bypass targets (`/\evil.com` - CVE-2025-68470), external URLs (`https://`), and javascript schemes.

### 7. Storage Security & Image Uploads
- **Pre-Upload Validation (`src/lib/insforge.ts`)**: `uploadMediaImage` enforces authenticated sessions, verifies MIME types against allowed image formats (`image/jpeg`, `image/png`, `image/webp`), enforces a 5 MB maximum size limit, and sanitizes filenames against directory traversal attacks.

### 8. Customer Privacy & Data Minimization
- **In-Session Customer Coordinates**: Exact customer coordinates obtained via geolocation are stored strictly in `sessionStorage` (`shop_manu_customer_location`) for Near Me distance calculation. Coordinates are never saved in database profiles, never logged, and never exposed to restaurant owners.
- **No Third-Party Tracking**: Zero advertising trackers, session replay scripts, or invasive analytics.

### 9. Legal Disclosures & Transparency
- **Privacy Policy (`/privacy`)**: Comprehensive disclosure detailing account data, owner listings, in-session location handling, storage security, third-party infrastructure (InsForge, Google Maps), user rights, and contact details with clear placeholders for legal entity review.
- **Terms of Service (`/terms`)**: Platform directory rules, owner accuracy responsibilities, reporting and moderation procedures, and honest menu freshness and price change disclaimers stating that prices and availability are subject to change.

### 10. Automated Phase 9 Test Suite
- **Comprehensive Verification (`tests/phase9_security_seo_test.mjs`)**: 80 automated unit, integration, and security checks covering redirect safety, Schema.org integrity, robots.txt crawlability, sitemap validity, coordinate boundary validation, RLS privilege escalation defenses, and production header configurations.

---

## Phase 10: Production Readiness & Architecture Report

### A. Product Overview
ShopManu is a production-grade food and restaurant discovery directory built to provide transparent, verified portion pricing, authentic operating hours, and location-based discovery without artificial reviews, inflated metrics, or simulated star ratings.

### B. Architecture
- **Frontend Core**: React 18, TypeScript 5, Vite 6, Tailwind CSS 3.4, React Router 6.
- **Backend Architecture**: InsForge Backend-as-a-Service (PostgreSQL 15+ with PostGIS, Row Level Security, RPC functions, and Deno edge serverless functions).
- **Client Integration**: `@insforge/sdk` for authentication, relational queries, real-time events, and cloud storage uploads.
- **Third-Party Services**: Google Maps Platform (Maps JavaScript API) for location selection and turn-by-turn routing.

### C. InsForge Backend
- **PostgreSQL Database**: Relational PostgreSQL database with PostGIS geospatial indexing.
- **Authentication**: JWT-based email/password authentication with user profiles, role enforcement, and auto-verification through edge functions.
- **Storage**: Object storage bucket `restaurant-media` with authenticated upload policies and MIME type enforcement.
- **Serverless Functions**: `register-user` edge function enforcing strict role assignment (`customer` or `owner` only) and server-side validation.

### D. Authentication and Authorization
- **Roles**: `customer`, `owner`, `admin`.
- **Role Isolation**:
  - Unauthenticated visitors can view approved restaurants, public menus, and search results.
  - Customers can submit reports and view public data; blocked from modifying restaurants or accessing admin portals.
  - Owners can manage only their own restaurant, categories, dishes, prices, and operating hours. Cannot approve themselves or access admin endpoints.
  - Admins can moderate restaurant approvals, suspensions, verifications, view audit logs, and triage reports.
- **Enforcement**: Handled via PostgreSQL Row-Level Security (RLS) policies and `SECURITY DEFINER` RPC functions with `is_admin()` checks.

### E. Database Structure
- `profiles`: User profile data (`id`, `name`, `email`, `phone`, `role`, timestamps).
- `restaurants`: Establishment listings with geographic coordinates, verified badge, and status (`pending`, `approved`, `rejected`, `suspended`).
- `categories`: Menu category groupings per restaurant with `sort_order`.
- `foods`: Dishes with dietary flags (`veg`, `non_veg`), availability boolean, and status (`active`, `archived`).
- `food_variants`: Portions and sizes with explicit numeric prices.
- `price_history`: Immutable price audit records with `old_price`, `new_price`, `changed_by`, and `changed_at`.
- `restaurant_hours`: Day-of-week operating schedules with opening/closing times and `is_closed` flags.
- `restaurant_reports`: Community reports with moderation statuses (`pending`, `investigating`, `resolved`, `dismissed`).
- `audit_logs`: Administrative and entity modification event trail.

### F. Restaurant Management
- Multi-step establishment creation and modification.
- Geographic coordinates picker with Google Maps integration and manual coordinate entry.
- Immediate transition to `pending` status upon owner creation or editing.

### G. Menu Management
- Category ordering and dish creation.
- Veg / Non-Veg diet classification.
- Multi-variant pricing (e.g. Half, Full, Regular, Large).
- Instant availability toggling without deleting records.
- Soft-delete / archiving preserving historical data.

### H. Price History
- Trigger-driven automated recording in `price_history` on every price modification.
- Complete audit trail capturing previous price, new price, authenticated owner ID, and timestamp.
- Preserves full price revision history without overwriting.

### I. Search System
- Multi-faceted search: food search, restaurant search, and location search.
- Filters: Veg/Non-Veg, Availability, Price range, Open Now.
- Pure database queries with zero simulated results.

### J. Near Me Geographic Search
- True PostGIS spatial calculation (`ST_DWithin`, `ST_DistanceSphere`).
- Dynamic radius filtering (1 km, 5 km, 10 km, 25 km).
- Authentic distance formatting (`< 50 m`, `0.7 km`, `4.8 km`). Zero simulated distances.

### K. Google Maps Integration
- Interactive location selection for restaurant owners.
- Customer restaurant pin view with directions links.
- Graceful non-blocking fallback when Google Maps API key is unconfigured.

### L. Admin Moderation
- Real-time administrative metrics (`get_admin_metrics`).
- Approval, rejection, suspension, and restoration workflows.
- Audited RPC functions preventing unauthorized execution.

### M. Reports System
- Community reporting on prices, availability, incorrect hours, or locations.
- Administrative triage queue with status tracking and internal resolution notes.

### N. Menu Freshness
- Freshness thresholds: `< 30 days` (Fresh), `30–60 days` (Review Recommended), `> 60 days` (Stale).
- Distinct separation of freshness from availability.

### O. SEO Foundation
- Dynamic meta tags, Open Graph, and Twitter cards via `useSEO`.
- Real Schema.org `Restaurant` and `LocalBusiness` JSON-LD structured data.
- Strict exclusion of non-approved restaurants from `sitemap.xml`.
- `robots.txt` disallowing private administrative and owner pages.

### P. Security
- Production security headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`).
- Open redirect defense (`isSafeInternalRedirect` blocking protocol-relative and backslash injection).
- RLS cross-tenant isolation and role tampering prevention (`trg_protect_restaurant_status`).
- Zero secret exposure in code, bundles, or `.env.example`.

### Q. Privacy and Legal
- Transparent Privacy Policy (`/privacy`) and Terms of Service (`/terms`).
- Ephemeral customer location handling (`sessionStorage` only, never stored in DB profiles).
- Zero third-party ad tracking or session recording scripts.

### R. Testing
- **304 automated tests** across 9 comprehensive test suites (Phases 1 through 10) passing with 0 failures.
- Complete end-to-end customer, owner, and admin journey validation.

### S. Deployment
- Fully configured for Vercel and SPA static hosting via `vercel.json`.
- Complete deployment documentation in `DEPLOYMENT.md`.

### T. Known Limitations
- Real-time GPS location accuracy depends on user device hardware and browser permissions.
- Google Maps Street View and Satellite imagery require an active Google Maps API key.

### U. Production Blockers
- **None**: All automated tests, type checks, lint checks, build checks, and security validations have passed. Zero critical or high blockers exist.
