# ManuMania – Simple Zero-Code Photography Replacement Guide

This directory holds all public photographic assets for ManuMania.

## How to Replace Any Photo on the Website

1. **Locate the photo you want to replace** in the appropriate subdirectory below.
2. **Replace the file with your new photograph**:
   - Keep the **exact same filename** (e.g. `biryani.jpg`, `flurys.jpg`).
   - Keep the **same file extension** (`.jpg`, `.png`, or `.webp`).
   - Keep the **same folder location**.
3. **Save the file and refresh the browser** (`F5`).
   - The new photograph will appear immediately.
   - **No code editing is required**.
   - **No rebuild or manifest editing is required**.

---

## Directory & File Mapping

### Chapter II: Follow Your Cravings (`public/images/cravings/`)
- `street-food.jpg`: Street Food hero card (Kati rolls, puchka)
- `biryani.jpg`: Dum Biryani hero card (Handi saffron rice)
- `snacks.jpg`: Snacks & Savouries card (Singaras, samosas)
- `meals.jpg`: Meals & Thalis card (Royal Indian thali)
- `sweets.jpg`: Heritage Sweets card (Golden jalebi, mishti)
- `beverages.jpg`: Beverages & Brews card (Earthen kulhad chai)
- `desserts.jpg`: Decadent Desserts card (Molten chocolate lava cake)

### Chapter III: Explore Some Beautiful Menus (`public/images/menu/`)
- `cheese-puffs.jpg`: Nahoum & Sons cheese puff card
- `lemon-tart.jpg`: Nahoum & Sons lemon tart card
- `rum-ball.jpg`: Nahoum & Sons rum ball card
- `macaroons.jpg`: Nahoum & Sons macaroons card
- `pizza-puff.jpg`: Nahoum & Sons pizza puff card
- `radhaballabhi.jpg`: Putiram Sweets radhaballabhi & cholar dal card
- `mishti-doi.jpg`: Putiram Sweets caramelized mishti doi card
- `biryani.jpg`: Plated chicken/mutton biryani fallback
- `thali.jpg`: Indian meal platter fallback
- `rolls.jpg`: Kathi rolls fallback
- `curry.jpg`: Chicken/mutton curry & gravies fallback
- `kebabs.jpg`: Tandoor & skewers fallback
- `dosa.jpg`: South Indian dosa fallback
- `momos.jpg`: Steaming dumplings fallback
- `snacks.jpg`: Evening cutlets & chops fallback
- `sweets.jpg`: Syrupy roshogollas fallback
- `beverages.jpg`: Chilled coolers & juices fallback

### Chapter IV: Top Shops Near You (`public/images/shops/`)
- `arsalan.jpg`: Arsalan (Park Circus)
- `flurys.jpg`: Flurys (Park Street)
- `peter-cat.jpg`: Peter Cat (Park Street)
- `nizams.jpg`: Nizam's (New Market)
- `6-ballygunge-place.jpg`: 6 Ballygunge Place (Ballygunge)
- `kusum-rolls.jpg`: Kusum Rolls (Park Street)
- `mitra-cafe.jpg`: Mitra Cafe (Shobhabazar)
- `paramount.jpg`: Paramount Cold Drinks & Syrups (College Street)
- `nahoum-and-sons.jpg`: Nahoum & Sons (New Market)
- `putiram-sweets.jpg`: Putiram Sweets (College Street)
- `storefront-1.jpg`: General heritage storefront fallback #1
- `storefront-2.jpg`: General evening dining storefront fallback #2

### Chapter V: Find Food Near You (`public/images/locations/`)
- `park-street.jpg`: Park Street District
- `college-street.jpg`: College Street Boi Para
- `new-market.jpg`: New Market / Esplanade
- `shobhabazar.jpg`: Shobhabazar North Kolkata
- `ballygunge.jpg`: Ballygunge South Kolkata
- `park-circus.jpg`: Park Circus 7-Point
- `salt-lake.jpg`: Salt Lake Bidhannagar
- `new-town.jpg`: New Town Rajarhat
- `street-stalls.jpg`: All Neighborhoods Street Stalls

### Chapter VI: Your Next Food Stop (`public/images/next-stop/`)
- `dining-hall.jpg`: Grand amber-lit dining room visual anchor
- `polaroid-street-food.png`: Left floating street food polaroid
- `polaroid-authentic-taste.png`: Right floating authentic taste polaroid
- `polaroids-composition.png`: Full combined polaroid asset

---

## Technical Architecture & Caching

- All replaceable images are served directly from the `public/` directory without build-time compilation or hash-based renaming.
- In development (`vite`) and preview (`vite preview`), server middleware automatically attaches `Cache-Control: no-cache, must-revalidate` and dynamic ETags to `/images/*`.
- On cloud platforms (Vercel, Netlify, Cloudflare), static headers ensure browsers validate files on refresh, instantly reflecting replaced images without cache stickiness.

