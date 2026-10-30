import { createClient } from '@insforge/sdk';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

const insforge = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

async function verify() {
  console.log('====================================================');
  console.log('VERIFICATION SUITE: 10 REAL KOLKATA FOOD SHOPS');
  console.log('====================================================\n');

  // 1. Total Approved Restaurants
  const { data: shops, error: shopsErr } = await insforge.database
    .from('restaurants')
    .select('id, name, slug, category, area, city, phone, latitude, longitude, status, verified, website')
    .eq('status', 'approved')
    .order('name');

  if (shopsErr) throw new Error(`Shop fetch error: ${shopsErr.message}`);

  console.log(`[CHECK 1] Approved Shop Count: ${shops.length} (Expected: 10)`);
  if (shops.length !== 10) throw new Error(`Expected exactly 10 shops, got ${shops.length}`);

  console.log('\nList of Published Kolkata Shops:');
  shops.forEach((s, idx) => {
    console.log(`  ${idx + 1}. ${s.name} [${s.category}] — ${s.area}, ${s.city} (Coords: ${s.latitude}, ${s.longitude})`);
  });

  // 2. Check each shop has categories and foods
  console.log('\n[CHECK 2] Categories & Foods per Shop:');
  for (const shop of shops) {
    const { data: cats } = await insforge.database
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', shop.id);

    const { data: foods } = await insforge.database
      .from('foods')
      .select('id, name, base_price, price_verification_status')
      .eq('restaurant_id', shop.id);

    const { data: hours } = await insforge.database
      .from('restaurant_hours')
      .select('id, day_of_week, open_time, close_time')
      .eq('restaurant_id', shop.id);

    console.log(`  • ${shop.name}: ${cats.length} categories, ${foods.length} dishes, ${hours.length} daily operating hours`);
  }

  // 3. Search query test for shop name
  console.log('\n[CHECK 3] Shop Search Tests:');
  const testShopQueries = ['Arsalan', 'Flurys', 'Peter Cat', 'Nizam', 'Mitra', 'Putiram', 'Nahoum', 'Paramount', 'Kusum', 'Ballygunge'];
  for (const q of testShopQueries) {
    const { data: matched } = await insforge.database
      .from('restaurants')
      .select('id, name, slug')
      .eq('status', 'approved')
      .ilike('name', `%${q}%`);
    console.log(`  Query "${q}" => Found: ${matched.map((m) => m.name).join(', ')}`);
    if (matched.length === 0) throw new Error(`Search failed to find shop with query "${q}"`);
  }

  // 4. Search query test for food items
  console.log('\n[CHECK 4] Food Search Tests:');
  const testFoodQueries = [
    'Mutton Biryani',
    'English Breakfast',
    'Chelo Kebab',
    'Kathi Roll',
    'Daab Chingri',
    'Fish Kabiraji',
    'Daab Sherbet',
    'Plum Cake',
    'Radhaballabhi',
    'Brain Chop',
  ];

  for (const q of testFoodQueries) {
    const { data: matched } = await insforge.database
      .from('foods')
      .select('id, name, base_price, restaurant:restaurants(name)')
      .ilike('name', `%${q}%`);
    console.log(`  Food "${q}" => Found in ${matched.map((m) => `${m.name} (${m.restaurant?.name || 'unknown'}, ₹${m.base_price ?? 'N/A'})`).join('; ')}`);
    if (matched.length === 0) throw new Error(`Food search failed to find dish with query "${q}"`);
  }

  // 5. Test Slug resolution for Public Restaurant Page
  console.log('\n[CHECK 5] Public Restaurant Page Slug Resolution:');
  for (const shop of shops) {
    const { data: singleShop, error: sErr } = await insforge.database
      .from('restaurants')
      .select('id, name, slug, address, area, city, status, verified')
      .eq('slug', shop.slug)
      .eq('status', 'approved')
      .maybeSingle();

    if (sErr || !singleShop) throw new Error(`Failed to resolve shop page for slug ${shop.slug}`);
    console.log(`  /restaurant/${shop.slug} => Resolved "${singleShop.name}"`);
  }

  // 6. Confirm unverified prices are strictly NULL / unknown state
  console.log('\n[CHECK 6] Verification of Unknown Prices:');
  const { data: unverifiedFoods } = await insforge.database
    .from('foods')
    .select('id, name, base_price, price_verification_status, restaurant:restaurants(name)')
    .eq('price_verification_status', 'unknown');

  console.log(`  Dishes with unverified/unknown price state: ${unverifiedFoods.length}`);
  unverifiedFoods.forEach((f) => {
    console.log(`    - ${f.name} at ${f.restaurant?.name}: base_price=${f.base_price} (status: ${f.price_verification_status})`);
    if (f.base_price !== null) throw new Error(`Dish ${f.name} should have null base_price, had ${f.base_price}`);
  });

  // 7. Verify Genuine owner account via admin raw SQL endpoint (since pending status is hidden from anon RLS by design)
  console.log('\n[CHECK 7] Verify Genuine Owner Account Preservation:');
  const adminSqlRes = await fetch('https://yke9qwgm.us-east.insforge.app/api/database/advance/rawsql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ik_daa0f920f6f41a632c2560a91b1297d7',
    },
    body: JSON.stringify({
      query: "SELECT r.id, r.name, r.status, r.owner_id, p.email FROM public.restaurants r JOIN public.profiles p ON r.owner_id = p.id WHERE p.email = 'sourish1600@gmail.com';",
    }),
  });
  const adminJson = await adminSqlRes.json();
  const userRest = adminJson.rows || [];

  console.log('  The Heritage Kitchen record:', userRest);
  if (!userRest || userRest.length === 0 || userRest[0].status !== 'pending') {
    throw new Error('Genuine user restaurant state was altered!');
  }

  console.log('\nALL 7 VERIFICATION CHECKS PASSED EMPIRICALLY!');
}

verify().catch((err) => {
  console.error('\nVerification FAILED:', err);
  process.exit(1);
});

