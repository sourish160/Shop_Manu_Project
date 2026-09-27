import { createClient } from '@insforge/sdk';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

const clientAnon = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

async function seed() {
  console.log('--- Seeding Development Restaurants with Geographic Coordinates ---');

  const ownerEmail = `dev_owner_p5@test.com`;
  const password = 'Password123!';

  // Register owner if not existing
  let ownerUser = null;
  const regRes = await clientAnon.functions.invoke('register-user', {
    body: { name: 'Dev Owner Kolkata', email: ownerEmail, password, phone: '+919876500005', role: 'owner' }
  });
  if (regRes.data?.user) {
    ownerUser = regRes.data.user;
  } else {
    const logRes = await clientAnon.auth.signInWithPassword({ email: ownerEmail, password });
    ownerUser = logRes.data?.user;
  }

  if (!ownerUser) {
    throw new Error('Failed to obtain owner user');
  }

  const clientOwner = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  await clientOwner.auth.signInWithPassword({ email: ownerEmail, password });

  // Clean up any old development restaurants
  const oldRes = await clientOwner.database.from('restaurants').select('id').like('name', '%[Development]%');
  if (oldRes.data && oldRes.data.length > 0) {
    const ids = oldRes.data.map(r => r.id);
    await clientOwner.database.from('restaurant_hours').delete().in('restaurant_id', ids);
    await clientOwner.database.from('restaurants').delete().in('id', ids);
  }

  // 1. Restaurant 1: "Aminia Restaurant [Development]" in Salt Lake, Kolkata
  // Genuine Coordinates: 22.5804° N, 88.4272° E
  const { data: res1Data, error: res1Err } = await clientOwner.database.from('restaurants').insert([{
    owner_id: ownerUser.id,
    name: 'Aminia Restaurant [Development]',
    description: 'Heritage Awadhi and Kolkata-style biryanis, aromatic kebabs and rich curries since 1929.',
    phone: '+919876500011',
    address: 'Block EP, Sector V, Salt Lake City',
    area: 'Salt Lake',
    city: 'Kolkata',
    latitude: 22.5804,
    longitude: 88.4272,
  }]).select();

  if (res1Err) throw new Error(res1Err.message);
  const r1 = res1Data[0];

  await clientAnon.database.rpc('admin_set_restaurant_status', {
    p_restaurant_id: r1.id,
    p_status: 'approved',
    p_verified: true,
  });

  const hours1 = [0, 1, 2, 3, 4, 5, 6].map(day => ({
    restaurant_id: r1.id,
    day_of_week: day,
    open_time: '10:00:00',
    close_time: '23:30:00',
    is_closed: false,
  }));
  await clientOwner.database.from('restaurant_hours').insert(hours1);

  const { data: catData } = await clientOwner.database.from('categories').insert([
    { restaurant_id: r1.id, name: 'Biryani Specials', sort_order: 1 },
    { restaurant_id: r1.id, name: 'Tandoor & Kebabs', sort_order: 2 },
    { restaurant_id: r1.id, name: 'Vegetarian Specialties', sort_order: 3 },
  ]).select();

  const cBiryani = catData.find(c => c.name === 'Biryani Specials');
  const cKebab = catData.find(c => c.name === 'Tandoor & Kebabs');
  const cVeg = catData.find(c => c.name === 'Vegetarian Specialties');

  // Food 1: Chicken Biryani
  const { data: f1 } = await clientOwner.database.from('foods').insert([{
    restaurant_id: r1.id,
    category_id: cBiryani.id,
    name: 'Chicken Biryani',
    description: 'Authentic Kolkata-style chicken biryani with spiced potato and boiled egg.',
    veg_type: 'non_veg',
    available: true,
    status: 'active',
  }]).select();

  await clientOwner.database.from('food_variants').insert([
    { food_id: f1[0].id, name: 'Half', price: 160.00, available: true },
    { food_id: f1[0].id, name: 'Full', price: 260.00, available: true },
  ]);

  // Food 2: Mutton Biryani
  const { data: f2 } = await clientOwner.database.from('foods').insert([{
    restaurant_id: r1.id,
    category_id: cBiryani.id,
    name: 'Mutton Biryani',
    description: 'Slow-cooked succulent mutton with fragrant basmati and rich saffron essence.',
    veg_type: 'non_veg',
    available: true,
    status: 'active',
  }]).select();

  await clientOwner.database.from('food_variants').insert([
    { food_id: f2[0].id, name: 'Full', price: 320.00, available: true },
    { food_id: f2[0].id, name: 'Special Double Mutton', price: 460.00, available: true },
  ]);

  // Food 3: Chicken Reshmi Kebab
  const { data: f3 } = await clientOwner.database.from('foods').insert([{
    restaurant_id: r1.id,
    category_id: cKebab.id,
    name: 'Chicken Reshmi Kebab',
    description: 'Velvety minced chicken marinated in cream, cashew paste, and gentle spices.',
    veg_type: 'non_veg',
    available: true,
    status: 'active',
  }]).select();

  await clientOwner.database.from('food_variants').insert([
    { food_id: f3[0].id, name: '6 Pieces', price: 210.00, available: true },
  ]);

  // Food 4: Paneer Butter Masala
  const { data: f4 } = await clientOwner.database.from('foods').insert([{
    restaurant_id: r1.id,
    category_id: cVeg.id,
    name: 'Paneer Butter Masala',
    description: 'Fresh cottage cheese cubes simmered in a mildly spiced buttery tomato gravy.',
    veg_type: 'veg',
    available: true,
    status: 'active',
  }]).select();

  await clientOwner.database.from('food_variants').insert([
    { food_id: f4[0].id, name: 'Standard Bowl', price: 180.00, available: true },
  ]);

  // 2. Restaurant 2: "Kolkata Kitchen [Development]" in New Town, Kolkata
  // Genuine Coordinates: 22.5935° N, 88.4716° E (~4.79 km from Salt Lake Sector V)
  const { data: res2Data } = await clientOwner.database.from('restaurants').insert([{
    owner_id: ownerUser.id,
    name: 'Kolkata Kitchen [Development]',
    description: 'Casual neighborhood bistro specializing in Bengali rolls, quick meal boxes, and beverages.',
    phone: '+919876500012',
    address: 'Action Area 1, New Town',
    area: 'New Town',
    city: 'Kolkata',
    latitude: 22.5935,
    longitude: 88.4716,
  }]).select();

  const r2 = res2Data[0];
  await clientAnon.database.rpc('admin_set_restaurant_status', {
    p_restaurant_id: r2.id,
    p_status: 'approved',
    p_verified: true,
  });

  const hours2 = [0, 1, 2, 3, 4, 5, 6].map(day => ({
    restaurant_id: r2.id,
    day_of_week: day,
    open_time: '11:00:00',
    close_time: '22:00:00',
    is_closed: false,
  }));
  await clientOwner.database.from('restaurant_hours').insert(hours2);

  const { data: cat2Data } = await clientOwner.database.from('categories').insert([
    { restaurant_id: r2.id, name: 'Kolkata Kathi Rolls', sort_order: 1 },
    { restaurant_id: r2.id, name: 'Rice Bowls', sort_order: 2 },
  ]).select();

  const cRoll = cat2Data.find(c => c.name === 'Kolkata Kathi Rolls');
  const cBowl = cat2Data.find(c => c.name === 'Rice Bowls');

  // Food 5: Egg Chicken Roll
  const { data: f5 } = await clientOwner.database.from('foods').insert([{
    restaurant_id: r2.id,
    category_id: cRoll.id,
    name: 'Egg Chicken Roll',
    description: 'Flaky layered paratha lined with fried egg and juicy spiced chicken cubes.',
    veg_type: 'non_veg',
    available: true,
    status: 'active',
  }]).select();

  await clientOwner.database.from('food_variants').insert([
    { food_id: f5[0].id, name: 'Single Egg Single Chicken', price: 95.00, available: true },
    { food_id: f5[0].id, name: 'Double Egg Double Chicken', price: 140.00, available: true },
  ]);

  // Food 6: Kolkata Chicken Biryani Box
  const { data: f6 } = await clientOwner.database.from('foods').insert([{
    restaurant_id: r2.id,
    category_id: cBowl.id,
    name: 'Chicken Biryani Box',
    description: 'Compact lunch box portion with chicken, egg, potato, and raita.',
    veg_type: 'non_veg',
    available: true,
    status: 'active',
  }]).select();

  await clientOwner.database.from('food_variants').insert([
    { food_id: f6[0].id, name: 'Regular Box', price: 190.00, available: true },
  ]);

  // Food 7: Paneer Roll (Veg)
  const { data: f7 } = await clientOwner.database.from('foods').insert([{
    restaurant_id: r2.id,
    category_id: cRoll.id,
    name: 'Paneer Kathi Roll',
    description: 'Crisp paratha rolled with seasoned paneer, onions, and tangy green chutney.',
    veg_type: 'veg',
    available: true,
    status: 'active',
  }]).select();

  await clientOwner.database.from('food_variants').insert([
    { food_id: f7[0].id, name: 'Single Roll', price: 80.00, available: true },
  ]);

  // 3. Restaurant 3: "Park Street Biryani House [Development]" in Park Street, Kolkata
  // Genuine Coordinates: 22.5516° N, 88.3524° E (~8.33 km from Salt Lake Sector V)
  const { data: res3Data } = await clientOwner.database.from('restaurants').insert([{
    owner_id: ownerUser.id,
    name: 'Park Street Biryani House [Development]',
    description: 'Colonial ambiance with authentic Dum Biryani, Galauti Kebabs, and Firni.',
    phone: '+919876500013',
    address: 'Park Street, Near Park Mansions',
    area: 'Park Street',
    city: 'Kolkata',
    latitude: 22.5516,
    longitude: 88.3524,
  }]).select();

  const r3 = res3Data[0];
  await clientAnon.database.rpc('admin_set_restaurant_status', {
    p_restaurant_id: r3.id,
    p_status: 'approved',
    p_verified: true,
  });

  const hours3 = [0, 1, 2, 3, 4, 5, 6].map(day => ({
    restaurant_id: r3.id,
    day_of_week: day,
    open_time: '12:00:00',
    close_time: '23:00:00',
    is_closed: false,
  }));
  await clientOwner.database.from('restaurant_hours').insert(hours3);

  const { data: cat3Data } = await clientOwner.database.from('categories').insert([
    { restaurant_id: r3.id, name: 'Royal Awadhi Dum', sort_order: 1 },
  ]).select();

  const { data: f8 } = await clientOwner.database.from('foods').insert([{
    restaurant_id: r3.id,
    category_id: cat3Data[0].id,
    name: 'Awadhi Shahi Biryani',
    description: 'Slow-cooked royal biryani with fragrant saffron and cardamom.',
    veg_type: 'non_veg',
    available: true,
    status: 'active',
  }]).select();

  await clientOwner.database.from('food_variants').insert([
    { food_id: f8[0].id, name: 'Royal Serving', price: 290.00, available: true },
  ]);

  console.log('Seeding completed successfully with real coordinates!');
  console.log(`- Restaurant 1: ${r1.name} (Salt Lake, 22.5804, 88.4272)`);
  console.log(`- Restaurant 2: ${r2.name} (New Town, 22.5935, 88.4716)`);
  console.log(`- Restaurant 3: ${r3.name} (Park Street, 22.5516, 88.3524)`);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
