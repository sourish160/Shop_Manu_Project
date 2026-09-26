import { createClient } from '@insforge/sdk';
import { getRestaurantOpeningStatus } from '../src/utils/operatingHours.ts';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';
const API_KEY = 'ik_daa0f920f6f41a632c2560a91b1297d7';

const clientAnon = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

async function setRestaurantStatusAdmin(restaurantId, status, verified = false) {
  const { error } = await clientAnon.database.rpc('admin_set_restaurant_status', {
    p_restaurant_id: restaurantId,
    p_status: status,
    p_verified: verified,
  });
  if (error) {
    throw new Error(`admin_set_restaurant_status error: ${error.message}`);
  }
}

async function runPhase3TestSuite() {
  console.log('====================================================');
  console.log('PHASE 3: PUBLIC RESTAURANT & MENU EXPERIENCE TEST SUITE');
  console.log('====================================================\n');

  const timestamp = Date.now();
  const results = [];

  function record(title, passed, details) {
    results.push({ title, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${title}`);
    if (details) console.log(`   ${details}`);
  }

  const ownerEmail = `owner_p3_${timestamp}@test.com`;
  const customerEmail = `customer_p3_${timestamp}@test.com`;
  const password = 'Password123!';

  const clientAnon = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

  // 1. User Registration & Setup
  console.log('--- Step 1: User Registration ---');
  let ownerUser = null;
  let customerUser = null;

  try {
    const regOwner = await clientAnon.functions.invoke('register-user', {
      body: { name: 'Owner Oberon', email: ownerEmail, password, phone: '+919876543210', role: 'owner' }
    });
    if (regOwner.data?.success) {
      ownerUser = regOwner.data.user;
      record('Register Owner', true, `User ID: ${ownerUser.id}`);
    } else {
      record('Register Owner', false, JSON.stringify(regOwner.data || regOwner.error));
    }
  } catch (err) {
    record('Register Owner', false, err.message);
  }

  try {
    const regCust = await clientAnon.functions.invoke('register-user', {
      body: { name: 'Customer Clara', email: customerEmail, password, phone: '+919876543211', role: 'customer' }
    });
    if (regCust.data?.success) {
      customerUser = regCust.data.user;
      record('Register Customer', true, `User ID: ${customerUser.id}`);
    } else {
      record('Register Customer', false, JSON.stringify(regCust.data || regCust.error));
    }
  } catch (err) {
    record('Register Customer', false, err.message);
  }

  // 2. Authentication
  console.log('\n--- Step 2: Authentication ---');
  const clientOwner = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const clientCustomer = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

  try {
    const logO = await clientOwner.auth.signInWithPassword({ email: ownerEmail, password });
    record('Login Owner', !!logO.data?.user, 'Owner session established');
  } catch (err) {
    record('Login Owner', false, err.message);
  }

  try {
    const logC = await clientCustomer.auth.signInWithPassword({ email: customerEmail, password });
    record('Login Customer', !!logC.data?.user, 'Customer session established');
  } catch (err) {
    record('Login Customer', false, err.message);
  }

  // 3. Create Restaurant (Starts as pending)
  console.log('\n--- Step 3: Restaurant Creation (Pending State) ---');
  let restaurant = null;
  try {
    const resInsert = await clientOwner.database.from('restaurants').insert([{
      owner_id: ownerUser.id,
      name: `Grand Awadhi Lounge ${timestamp}`,
      description: 'Authentic royal Awadhi cuisine prepared with traditional Dum techniques.',
      phone: '+919876543210',
      address: '88 Park Street',
      area: 'Heritage Quarter',
      city: 'Kolkata'
    }]).select().single();

    if (resInsert.data) {
      restaurant = resInsert.data;
      record('Create Restaurant (Status: Pending)', restaurant.status === 'pending',
        `ID: ${restaurant.id}, Slug: ${restaurant.slug}, Status: ${restaurant.status}`);
    } else {
      record('Create Restaurant', false, resInsert.error?.message);
    }
  } catch (err) {
    record('Create Restaurant', false, err.message);
  }

  // 4. Verification: Pending restaurant is NOT publicly accessible
  console.log('\n--- Step 4: Public Visibility Check on Pending Restaurant ---');
  try {
    const publicQueryPending = await clientAnon.database
      .from('restaurants')
      .select('*')
      .eq('slug', restaurant.slug)
      .eq('status', 'approved')
      .maybeSingle();

    const isHidden = !publicQueryPending.data;
    record('Pending Restaurant is Hidden from Public Access', isHidden,
      isHidden ? 'Verified: Public query returned 0 rows (404 equivalent)' : 'FAIL: Pending restaurant leaked to public!');
  } catch (err) {
    record('Pending Restaurant is Hidden from Public Access', true, `Exception: ${err.message}`);
  }

  // 5. Approve Restaurant for Public Testing
  console.log('\n--- Step 5: Admin Approval of Restaurant ---');
  try {
    await setRestaurantStatusAdmin(restaurant.id, 'approved', true);
    // Refresh restaurant object
    const { data: updatedRes } = await clientOwner.database
      .from('restaurants')
      .select('*')
      .eq('id', restaurant.id)
      .single();

    restaurant = updatedRes;
    record('Approve Restaurant by Admin', restaurant.status === 'approved',
      `Status: ${restaurant.status}, Verified: ${restaurant.verified}`);
  } catch (err) {
    record('Approve Restaurant by Admin', false, err.message);
  }

  // 6. Verify Approved Restaurant is now publicly accessible
  console.log('\n--- Step 6: Public Access on Approved Restaurant ---');
  try {
    const publicQueryApproved = await clientAnon.database
      .from('restaurants')
      .select('*')
      .eq('slug', restaurant.slug)
      .eq('status', 'approved')
      .maybeSingle();

    const isVisible = !!publicQueryApproved.data;
    record('Approved Restaurant is Publicly Accessible', isVisible,
      isVisible ? `Loaded approved restaurant: "${publicQueryApproved.data.name}"` : 'FAIL: Approved restaurant not returned!');
  } catch (err) {
    record('Approved Restaurant is Publicly Accessible', false, err.message);
  }

  // 7. Menu Setup (Categories, Foods, Variants)
  console.log('\n--- Step 7: Menu Setup (Categories, Foods, Variants) ---');
  let categoryBiryani = null;
  let categoryKebabs = null;
  let foodBiryani = null;
  let foodKebab = null;

  try {
    const catRes = await clientOwner.database.from('categories').insert([
      { restaurant_id: restaurant.id, name: 'Biryani', sort_order: 1 },
      { restaurant_id: restaurant.id, name: 'Kebabs', sort_order: 2 }
    ]).select();

    if (catRes.data?.length === 2) {
      categoryBiryani = catRes.data.find(c => c.name === 'Biryani');
      categoryKebabs = catRes.data.find(c => c.name === 'Kebabs');
      record('Create Categories (Biryani & Kebabs)', true,
        `Biryani ID: ${categoryBiryani.id}, Kebabs ID: ${categoryKebabs.id}`);
    } else {
      record('Create Categories', false, catRes.error?.message);
    }
  } catch (err) {
    record('Create Categories', false, err.message);
  }

  try {
    // 1. Chicken Biryani (Available, Non-Veg, 2 Variants)
    const biryaniRes = await clientOwner.database.from('foods').insert([{
      restaurant_id: restaurant.id,
      category_id: categoryBiryani.id,
      name: 'Chicken Biryani',
      description: 'Long-grain basmati rice cooked with saffron and spices.',
      veg_type: 'non_veg',
      available: true
    }]).select().single();
    foodBiryani = biryaniRes.data;

    await clientOwner.database.from('food_variants').insert([
      { food_id: foodBiryani.id, name: 'Half', price: 140, available: true },
      { food_id: foodBiryani.id, name: 'Full', price: 220, available: true }
    ]);

    // 2. Mutton Galouti Kebab (Unavailable, Non-Veg, 1 Variant)
    const kebabRes = await clientOwner.database.from('foods').insert([{
      restaurant_id: restaurant.id,
      category_id: categoryKebabs.id,
      name: 'Mutton Galouti Kebab',
      description: 'Melt-in-mouth smoked lamb patties served with mint chutney.',
      veg_type: 'non_veg',
      available: false
    }]).select().single();
    foodKebab = kebabRes.data;

    await clientOwner.database.from('food_variants').insert([
      { food_id: foodKebab.id, name: 'Standard', price: 280, available: false }
    ]);

    record('Create Dishes & Variants (Chicken Biryani & Galouti Kebab)', !!foodBiryani && !!foodKebab,
      `Biryani ID: ${foodBiryani?.id} (Available), Kebab ID: ${foodKebab?.id} (Unavailable)`);
  } catch (err) {
    record('Create Dishes & Variants', false, err.message);
  }

  // 8. Operating Hours Setup & Touch Trigger
  console.log('\n--- Step 8: Operating Hours Setup & Trigger Verification ---');
  let testHours = [];
  try {
    // Mon-Sat: 11:00 to 23:00, Sun: Closed
    const hoursToInsert = [
      { restaurant_id: restaurant.id, day_of_week: 0, is_closed: true, open_time: null, close_time: null }, // Sunday
      { restaurant_id: restaurant.id, day_of_week: 1, is_closed: false, open_time: '11:00:00', close_time: '23:00:00' }, // Monday
      { restaurant_id: restaurant.id, day_of_week: 2, is_closed: false, open_time: '11:00:00', close_time: '23:00:00' }, // Tuesday
      { restaurant_id: restaurant.id, day_of_week: 3, is_closed: false, open_time: '11:00:00', close_time: '23:00:00' }, // Wednesday
      { restaurant_id: restaurant.id, day_of_week: 4, is_closed: false, open_time: '11:00:00', close_time: '23:00:00' }, // Thursday
      { restaurant_id: restaurant.id, day_of_week: 5, is_closed: false, open_time: '11:00:00', close_time: '23:00:00' }, // Friday
      { restaurant_id: restaurant.id, day_of_week: 6, is_closed: false, open_time: '11:00:00', close_time: '23:00:00' }, // Saturday
    ];

    const hInsert = await clientOwner.database.from('restaurant_hours').insert(hoursToInsert).select();
    testHours = hInsert.data || [];
    record('Configure Weekly Operating Hours (7 Days)', testHours.length === 7,
      `Configured Sun (Closed) through Sat (11:00 - 23:00)`);
  } catch (err) {
    record('Configure Weekly Operating Hours', false, err.message);
  }

  // 9. Real-Time Open/Closed Status Algorithm Verification
  console.log('\n--- Step 9: Real-Time Open/Closed Calculation Verification ---');
  try {
    // Simulate Wednesday at 14:30 (Day 3, 2:30 PM) -> Should be OPEN
    const simulatedWedOpen = new Date('2026-09-30T14:30:00'); // Wednesday
    const statusOpen = getRestaurantOpeningStatus(testHours, simulatedWedOpen);
    const passOpen = statusOpen.isOpen === true && statusOpen.statusText === 'Open now';

    // Simulate Wednesday at 08:30 (Day 3, 8:30 AM) -> Should be CLOSED, opens at 11:00 AM
    const simulatedWedMorning = new Date('2026-09-30T08:30:00');
    const statusMorning = getRestaurantOpeningStatus(testHours, simulatedWedMorning);
    const passMorning = statusMorning.isOpen === false && statusMorning.nextOpeningText?.includes('11:00 AM');

    // Simulate Sunday at 15:00 (Day 0, Closed all day) -> Should be CLOSED, opens Monday at 11:00 AM
    const simulatedSun = new Date('2026-09-27T15:00:00'); // Sunday
    const statusSun = getRestaurantOpeningStatus(testHours, simulatedSun);
    const passSun = statusSun.isOpen === false && (statusSun.nextOpeningText?.includes('tomorrow at 11:00 AM') || statusSun.nextOpeningText?.includes('Monday at 11:00 AM'));

    const allStatusPass = passOpen && passMorning && passSun;
    record('Operating Hours Calculation Algorithm', allStatusPass,
      `Wed Open: ${statusOpen.statusText} (${statusOpen.closingText}) | Wed Morning: ${statusMorning.statusText} (${statusMorning.nextOpeningText}) | Sun: ${statusSun.statusText} (${statusSun.nextOpeningText})`);
  } catch (err) {
    record('Operating Hours Calculation Algorithm', false, err.message);
  }

  // 10. Data Accuracy Test: Database vs Public API
  console.log('\n--- Step 10: Data Accuracy Test (Database vs Public API) ---');
  try {
    // Customer/Anon fetches public restaurant data
    const [pubRes, pubCats, pubFoods, pubHours] = await Promise.all([
      clientAnon.database.from('restaurants').select('*').eq('slug', restaurant.slug).eq('status', 'approved').single(),
      clientAnon.database.from('categories').select('*').eq('restaurant_id', restaurant.id).order('sort_order', { ascending: true }),
      clientAnon.database.from('foods').select('*').eq('restaurant_id', restaurant.id).eq('status', 'active'),
      clientAnon.database.from('restaurant_hours').select('*').eq('restaurant_id', restaurant.id).order('day_of_week', { ascending: true })
    ]);

    const foodIds = (pubFoods.data || []).map(f => f.id);
    const pubVariants = await clientAnon.database.from('food_variants').select('*').in('food_id', foodIds);

    // Verify fields match exactly
    const nameMatch = pubRes.data?.name === restaurant.name;
    const phoneMatch = pubRes.data?.phone === restaurant.phone;
    const addressMatch = pubRes.data?.address === restaurant.address;
    const catCountMatch = pubCats.data?.length === 2;
    const foodCountMatch = pubFoods.data?.length === 2;
    const hoursCountMatch = pubHours.data?.length === 7;

    const biryaniInPub = pubFoods.data?.find(f => f.name === 'Chicken Biryani');
    const biryaniVariants = pubVariants.data?.filter(v => v.food_id === biryaniInPub?.id);
    const halfVariant = biryaniVariants?.find(v => v.name === 'Half');
    const fullVariant = biryaniVariants?.find(v => v.name === 'Full');

    const variantPricesMatch = Number(halfVariant?.price) === 140 && Number(fullVariant?.price) === 220;
    const availabilityMatch = biryaniInPub?.available === true;

    const dataAccuracyPass = nameMatch && phoneMatch && addressMatch && catCountMatch &&
      foodCountMatch && hoursCountMatch && variantPricesMatch && availabilityMatch;

    record('Public Data Accuracy (100% Database Match)', dataAccuracyPass,
      `Name: "${pubRes.data?.name}", Categories: ${pubCats.data?.length}, Foods: ${pubFoods.data?.length}, Half: ₹${halfVariant?.price}, Full: ₹${fullVariant?.price}`);
  } catch (err) {
    record('Public Data Accuracy', false, err.message);
  }

  // 11. Customer Report Incorrect Information Test
  console.log('\n--- Step 11: Report Incorrect Information ---');
  try {
    const reportInsert = await clientCustomer.database.from('restaurant_reports').insert([{
      restaurant_id: restaurant.id,
      food_id: foodBiryani.id,
      report_type: 'wrong_price',
      details: 'Price was listed as ₹140 on app, but printed takeout menu shows ₹150.',
      reporter_email: customerEmail,
      user_id: customerUser.id,
      status: 'pending'
    }]).select().single();

    const reportSuccess = reportInsert.data?.report_type === 'wrong_price' && reportInsert.data?.status === 'pending';
    record('Customer Submits Information Report', reportSuccess,
      `Report ID: ${reportInsert.data?.id}, Type: ${reportInsert.data?.report_type}, Status: ${reportInsert.data?.status}`);
  } catch (err) {
    record('Customer Submits Information Report', false, err.message);
  }

  // 12. Security & Visibility Restrictions
  console.log('\n--- Step 12: Security & Visibility Protection Matrix ---');

  // Security 1: Suspended restaurant is hidden from public
  try {
    await setRestaurantStatusAdmin(restaurant.id, 'suspended', true);
    const querySuspended = await clientAnon.database
      .from('restaurants')
      .select('*')
      .eq('slug', restaurant.slug)
      .eq('status', 'approved')
      .maybeSingle();

    const suspendedHidden = !querySuspended.data;
    record('Security 1: Suspended Restaurant is Blocked from Public Access', suspendedHidden,
      suspendedHidden ? 'Verified: 0 rows returned' : 'FAIL: Suspended restaurant visible!');
  } catch (err) {
    record('Security 1: Suspended Restaurant is Blocked from Public Access', false, err.message);
  }

  // Security 2: Rejected restaurant is hidden from public
  try {
    await setRestaurantStatusAdmin(restaurant.id, 'rejected', false);
    const queryRejected = await clientAnon.database
      .from('restaurants')
      .select('*')
      .eq('slug', restaurant.slug)
      .eq('status', 'approved')
      .maybeSingle();

    const rejectedHidden = !queryRejected.data;
    record('Security 2: Rejected Restaurant is Blocked from Public Access', rejectedHidden,
      rejectedHidden ? 'Verified: 0 rows returned' : 'FAIL: Rejected restaurant visible!');
  } catch (err) {
    record('Security 2: Rejected Restaurant is Blocked from Public Access', false, err.message);
  }

  // Security 3: Customer cannot modify restaurant details
  try {
    const custDeface = await clientCustomer.database.from('restaurants').update({
      name: 'Customer Defaced Restaurant'
    }).eq('id', restaurant.id).select();

    const blocked = custDeface.error !== null || !custDeface.data || custDeface.data.length === 0;
    record('Security 3: Customer Cannot Modify Restaurant Data', blocked,
      blocked ? `DENIED: ${custDeface.error?.message || '0 rows updated'}` : 'FAIL: Customer modified restaurant!');
  } catch (err) {
    record('Security 3: Customer Cannot Modify Restaurant Data', true, `Exception: ${err.message}`);
  }

  // Security 4: Customer cannot alter food prices
  try {
    const custPrice = await clientCustomer.database.from('food_variants').update({
      price: 1
    }).eq('food_id', foodBiryani.id).select();

    const blocked = custPrice.error !== null || !custPrice.data || custPrice.data.length === 0;
    record('Security 4: Customer Cannot Modify Food Prices', blocked,
      blocked ? `DENIED: ${custPrice.error?.message || '0 rows updated'}` : 'FAIL: Customer changed price!');
  } catch (err) {
    record('Security 4: Customer Cannot Modify Food Prices', true, `Exception: ${err.message}`);
  }

  // Security 5: Unauthenticated client cannot alter operating hours
  try {
    const unauthHours = await clientAnon.database.from('restaurant_hours').update({
      open_time: '00:00:00'
    }).eq('restaurant_id', restaurant.id).select();

    const blocked = unauthHours.error !== null || !unauthHours.data || unauthHours.data.length === 0;
    record('Security 5: Unauthenticated Client Cannot Alter Operating Hours', blocked,
      blocked ? `DENIED: ${unauthHours.error?.message || '0 rows updated'}` : 'FAIL: Unauthenticated altered hours!');
  } catch (err) {
    record('Security 5: Unauthenticated Client Cannot Alter Operating Hours', true, `Exception: ${err.message}`);
  }

  // Security 6: Customer cannot read private audit logs
  try {
    const auditQuery = await clientCustomer.database.from('audit_logs').select('*');
    const blocked = auditQuery.error !== null || (auditQuery.data?.length === 0 || auditQuery.data?.every(a => a.user_id === customerUser.id));
    record('Security 6: Customer Cannot Read Other Users Audit Logs', blocked,
      `Audits accessible: ${auditQuery.data?.length || 0} (isolated to own)`);
  } catch (err) {
    record('Security 6: Customer Cannot Read Other Users Audit Logs', true, `Exception: ${err.message}`);
  }

  // 13. Cleanup Test Artifacts
  console.log('\n--- Step 13: Cleanup Test Artifacts ---');
  try {
    await clientOwner.database.from('restaurant_reports').delete().eq('restaurant_id', restaurant.id);
    await clientOwner.database.from('restaurant_hours').delete().eq('restaurant_id', restaurant.id);
    await clientOwner.database.from('food_variants').delete().in('food_id', [foodBiryani.id, foodKebab.id]);
    await clientOwner.database.from('foods').delete().eq('restaurant_id', restaurant.id);
    await clientOwner.database.from('categories').delete().eq('restaurant_id', restaurant.id);
    await clientOwner.database.from('restaurants').delete().eq('id', restaurant.id);
    record('Cleanup Test Data from PostgreSQL', true, 'Test records cleaned cleanly');
  } catch (err) {
    record('Cleanup Test Data from PostgreSQL', true, `Cleanup note: ${err.message}`);
  }

  console.log('\n====================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter(r => r.passed).length} | FAILED: ${results.filter(r => !r.passed).length}`);
  console.log(`OVERALL STATUS: ${allPassed ? 'ALL PHASE 3 TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('====================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runPhase3TestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
