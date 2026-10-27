/**
 * Seed Script: Demo Multi-Shop Owners and Realistic Menu Data
 * 
 * Sets up:
 * 1. Owner 1 (Multi-Shop Owner): owner.kolkata@shopmanu.com / OwnerPassword123!
 *    - Shop 1: Aminia Grand Biryani & Kebabs (Salt Lake Sector V)
 *    - Shop 2: Royal Roll Corner & Street Bites (Park Street)
 * 2. Owner 2 (Single-Shop Owner): owner.south@shopmanu.com / OwnerPassword123!
 *    - Shop 3: Dakshin Spice Kitchen (Salt Lake Sector 1)
 */

import { createClient } from '@insforge/sdk';

const BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

const clientAnon = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

async function getOrCreateOwner(name, email, password, phone) {
  console.log(`Checking / registering owner: ${email}...`);
  // Try login first in case user already exists
  const client = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const { data: loginData, error: loginErr } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (!loginErr && loginData?.user) {
    console.log(`✓ Owner ${email} already registered and authenticated.`);
    return { client, user: loginData.user };
  }

  // Register user via serverless function
  const { data: regData, error: regErr } = await clientAnon.functions.invoke('register-user', {
    body: { name, email, password, phone, role: 'owner' },
  });

  if (regErr || !regData?.success) {
    throw new Error(`Failed to register ${email}: ${regErr?.message || JSON.stringify(regData)}`);
  }

  // Sign in with new credentials
  const { data: newLoginData, error: newLoginErr } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (newLoginErr || !newLoginData?.user) {
    throw new Error(`Failed to sign in after registration: ${newLoginErr?.message}`);
  }

  console.log(`✓ Owner ${email} registered and authenticated.`);
  return { client, user: newLoginData.user };
}

async function approveRestaurant(clientAdmin, restaurantId) {
  const { error } = await clientAdmin.database.rpc('admin_update_restaurant_status', {
    p_restaurant_id: restaurantId,
    p_new_status: 'approved',
    p_verified: true,
    p_admin_notes: 'Demo verified establishment',
  });
  if (error) {
    console.warn(`Admin status update warning for ${restaurantId}:`, error.message);
  } else {
    console.log(`  ✓ Approved and verified restaurant ${restaurantId}`);
  }
}

async function seedRestaurant(clientOwner, clientAdmin, ownerUser, config) {
  console.log(`\nSetting up Restaurant: "${config.name}" for Owner ${ownerUser.id}...`);

  // Check if restaurant with this name already exists for this owner
  const { data: existing } = await clientOwner.database
    .from('restaurants')
    .select('id, name')
    .eq('owner_id', ownerUser.id)
    .eq('name', config.name)
    .maybeSingle();

  let restaurantId;
  if (existing?.id) {
    console.log(`  Existing restaurant found with ID: ${existing.id}`);
    restaurantId = existing.id;
  } else {
    const { data: created, error: createErr } = await clientOwner.database
      .from('restaurants')
      .insert([
        {
          owner_id: ownerUser.id,
          name: config.name,
          description: config.description,
          phone: config.phone,
          address: config.address,
          area: config.area,
          city: config.city,
          latitude: config.latitude,
          longitude: config.longitude,
          status: 'pending',
          verified: false,
        },
      ])
      .select()
      .single();

    if (createErr || !created) {
      throw new Error(`Failed to create restaurant ${config.name}: ${createErr?.message}`);
    }
    restaurantId = created.id;
    console.log(`  ✓ Created restaurant with ID: ${restaurantId}`);
  }

  // Approve restaurant via Admin RPC
  await approveRestaurant(clientAdmin, restaurantId);

  // Set up 7-day operating hours
  const hoursData = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    restaurant_id: restaurantId,
    day_of_week: day,
    open_time: config.openTime || '11:00',
    close_time: config.closeTime || '23:00',
    is_closed: false,
  }));

  // Delete old hours and re-insert
  await clientOwner.database.from('restaurant_hours').delete().eq('restaurant_id', restaurantId);
  const { error: hoursErr } = await clientOwner.database.from('restaurant_hours').insert(hoursData);
  if (hoursErr) {
    console.warn(`  Warning inserting hours:`, hoursErr.message);
  } else {
    console.log(`  ✓ Set up 7-day operating schedule`);
  }

  // Seed Categories & Foods
  for (const catConfig of config.categories) {
    // Check or insert category
    let catId;
    const { data: existCat } = await clientOwner.database
      .from('categories')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('name', catConfig.name)
      .maybeSingle();

    if (existCat?.id) {
      catId = existCat.id;
    } else {
      const { data: newCat, error: catErr } = await clientOwner.database
        .from('categories')
        .insert([
          {
            restaurant_id: restaurantId,
            name: catConfig.name,
            sort_order: catConfig.sortOrder || 0,
          },
        ])
        .select()
        .single();
      if (catErr) {
        console.warn(`  Warning category ${catConfig.name}:`, catErr.message);
        continue;
      }
      catId = newCat.id;
    }

    console.log(`  Category: "${catConfig.name}"`);

    for (const foodConfig of catConfig.foods) {
      let foodId;
      const { data: existFood } = await clientOwner.database
        .from('foods')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('name', foodConfig.name)
        .maybeSingle();

      if (existFood?.id) {
        foodId = existFood.id;
      } else {
        const { data: newFood, error: foodErr } = await clientOwner.database
          .from('foods')
          .insert([
            {
              restaurant_id: restaurantId,
              category_id: catId,
              name: foodConfig.name,
              description: foodConfig.description,
              veg_type: foodConfig.vegType,
              status: 'active',
              available: true,
            },
          ])
          .select()
          .single();
        if (foodErr) {
          console.warn(`    Warning food ${foodConfig.name}:`, foodErr.message);
          continue;
        }
        foodId = newFood.id;
      }

      // Variants
      for (const vConfig of foodConfig.variants) {
        const { data: existVar } = await clientOwner.database
          .from('food_variants')
          .select('id')
          .eq('food_id', foodId)
          .eq('name', vConfig.name)
          .maybeSingle();

        if (!existVar?.id) {
          const { error: vErr } = await clientOwner.database.from('food_variants').insert([
            {
              food_id: foodId,
              name: vConfig.name,
              price: vConfig.price,
              available: true,
            },
          ]);
          if (vErr) console.warn(`      Variant error:`, vErr.message);
        }
      }
      console.log(`    ✓ Food: ${foodConfig.name} (${foodConfig.variants.map((v) => `${v.name}: ₹${v.price}`).join(', ')})`);
    }
  }

  return restaurantId;
}

async function main() {
  console.log('================================================================');
  console.log('SEEDING DEMO SHOP OWNERS & AUTHENTIC MENUS');
  console.log('================================================================\n');

  // Authenticate Admin
  const clientAdmin = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const { error: adminAuthErr } = await clientAdmin.auth.signInWithPassword({
    email: 'admin@shopmanu.com',
    password: 'AdminSecret123!',
  });
  if (adminAuthErr) {
    throw new Error(`Admin login failed: ${adminAuthErr.message}`);
  }
  console.log('✓ Admin authenticated successfully.\n');

  // --- DEMO OWNER 1: Multi-shop owner (owns 2 shops) ---
  const owner1 = await getOrCreateOwner(
    'Rahim Uddin (Heritage Foods)',
    'owner.kolkata@shopmanu.com',
    'OwnerPassword123!',
    '+919830112233'
  );

  // Shop 1: Aminia Grand Biryani & Kebabs
  await seedRestaurant(owner1.client, clientAdmin, owner1.user, {
    name: 'Aminia Grand Biryani & Kebabs',
    description: 'Legendary Kolkata Awadhi dum biryani, signature chicken chaap, and melt-in-mouth galouti kebabs prepared with traditional culinary heritage.',
    phone: '+919830112233',
    address: 'Block EP & GP, Sector V, Salt Lake',
    area: 'Salt Lake',
    city: 'Kolkata',
    latitude: 22.5804,
    longitude: 88.4273,
    openTime: '11:30',
    closeTime: '23:30',
    categories: [
      {
        name: 'Biryani & Rice Specialties',
        sortOrder: 1,
        foods: [
          {
            name: 'Kolkata Chicken Dum Biryani',
            description: 'Fragrant long-grain basmati rice slow-cooked on dum with juicy spiced chicken piece, melt-in-mouth Kolkata potato, and boiled egg.',
            vegType: 'non_veg',
            variants: [
              { name: 'Regular Portion', price: 195 },
              { name: 'Special (Double Chicken & Extra Egg)', price: 295 },
            ],
          },
          {
            name: 'Awadhi Mutton Biryani',
            description: 'Tender lamb cuts marinated in saffron and Awadhi spices, layered with fragrant aged rice and pure ghee.',
            vegType: 'non_veg',
            variants: [
              { name: 'Full Portion', price: 340 },
              { name: 'Special (2 Pcs Mutton & Egg)', price: 440 },
            ],
          },
          {
            name: 'Kolkata Royal Egg Biryani',
            description: 'Two boiled eggs and signature spiced whole potato cooked with seasoned saffron rice.',
            vegType: 'non_veg',
            variants: [{ name: 'Regular', price: 155 }],
          },
        ],
      },
      {
        name: 'Mughlai Kebabs & Gravies',
        sortOrder: 2,
        foods: [
          {
            name: 'Chicken Chaap (Kolkata Style)',
            description: 'Slow-braised chicken leg cooked in a rich, nutty poppy seed and cashew gravy with saffron undertones.',
            vegType: 'non_veg',
            variants: [{ name: '1 Big Piece', price: 190 }],
          },
          {
            name: 'Mutton Galouti Kebab with Sheermal',
            description: 'Velvety minced mutton kebabs smoked with cloves, served with hot sweet saffron sheermal roti.',
            vegType: 'non_veg',
            variants: [{ name: '4 Pieces with 1 Sheermal', price: 270 }],
          },
          {
            name: 'Murgh Reshmi Kebab',
            description: 'Boneless chicken cubes marinated in hung curd, cream, and green cardamom, roasted in the clay oven.',
            vegType: 'non_veg',
            variants: [{ name: '6 Pieces', price: 245 }],
          },
        ],
      },
      {
        name: 'Breads & Desserts',
        sortOrder: 3,
        foods: [
          {
            name: 'Tandoori Butter Naan',
            description: 'Clay-oven baked fluffy leavened bread brushed generously with pure butter.',
            vegType: 'veg',
            variants: [{ name: '1 Piece', price: 45 }],
          },
          {
            name: 'Shahi Firni in Earthen Cup',
            description: 'Traditional slow-cooked ground rice pudding flavored with green cardamom, saffron, and slivered pistachios.',
            vegType: 'veg',
            variants: [{ name: '1 Matka Cup', price: 85 }],
          },
        ],
      },
    ],
  });

  // Shop 2: Royal Roll Corner & Street Bites
  await seedRestaurant(owner1.client, clientAdmin, owner1.user, {
    name: 'Royal Roll Corner & Street Bites',
    description: 'Iconic Park Street street food counter famous for flaky paratha kati rolls, pure bhetki fish fry, and Kolkata evening snacks.',
    phone: '+919830556677',
    address: '18 Park Street, Near Free School Street Crossing',
    area: 'Park Street',
    city: 'Kolkata',
    latitude: 22.5512,
    longitude: 88.3524,
    openTime: '12:00',
    closeTime: '23:00',
    categories: [
      {
        name: 'Signature Kati Rolls',
        sortOrder: 1,
        foods: [
          {
            name: 'Double Egg Double Chicken Roll',
            description: 'Crispy pan-fried paratha lined with two fresh eggs and filled with succulent spiced chicken chunks, chopped red onions, and fresh lime juice.',
            vegType: 'non_veg',
            variants: [
              { name: 'Standard Roll', price: 130 },
              { name: 'Jumbo Roll', price: 170 },
            ],
          },
          {
            name: 'Paneer Tikka Kathi Roll',
            description: 'Smoky grilled paneer cubes tossed in chatpata spices and wrapped in golden paratha.',
            vegType: 'veg',
            variants: [{ name: 'Standard Roll', price: 105 }],
          },
          {
            name: 'Mutton Boti Kebab Roll',
            description: 'Spiced tender mutton pieces roasted over charcoal and wrapped with fresh onions and green chillies.',
            vegType: 'non_veg',
            variants: [{ name: 'Standard Roll', price: 165 }],
          },
        ],
      },
      {
        name: 'Snacks & Kolkata Fries',
        sortOrder: 2,
        foods: [
          {
            name: 'Kolkata Bhetki Fish Fry',
            description: 'Fresh fillet of premium sea Bhetki marinated in green herb paste, crumbed and crisp-fried, served with sharp Kasundi mustard.',
            vegType: 'non_veg',
            variants: [{ name: '2 Pieces with Kasundi & Salad', price: 250 }],
          },
          {
            name: 'Crispy Chicken Cutlet',
            description: 'Spiced minced chicken patty coated in biscuit crumbs and golden-fried.',
            vegType: 'non_veg',
            variants: [{ name: '2 Pieces with Kasundi', price: 140 }],
          },
          {
            name: 'Special Masala Puchka Platter',
            description: 'Crispy wholewheat puchkas with spicy mashed potato filling and chilled zesty tamarind water.',
            vegType: 'veg',
            variants: [{ name: '10 Pieces Platter', price: 75 }],
          },
        ],
      },
    ],
  });

  // --- DEMO OWNER 2: Single-shop owner (owns 1 shop) ---
  const owner2 = await getOrCreateOwner(
    'Priya Nair (Dakshin Flavors)',
    'owner.south@shopmanu.com',
    'OwnerPassword123!',
    '+919840223344'
  );

  // Shop 3: Dakshin Spice Kitchen
  await seedRestaurant(owner2.client, clientAdmin, owner2.user, {
    name: 'Dakshin Spice Kitchen',
    description: 'Authentic South Indian breakfast tiffins, crispy ghee roast dosas, and coastal Malabar specialties made from stone-ground fermented batters.',
    phone: '+919840223344',
    address: 'CF Block, Sector 1, Salt Lake (Near Swimming Pool)',
    area: 'Salt Lake',
    city: 'Kolkata',
    latitude: 22.5891,
    longitude: 88.4082,
    openTime: '07:30',
    closeTime: '22:00',
    categories: [
      {
        name: 'Dosas & Breakfast Tiffins',
        sortOrder: 1,
        foods: [
          {
            name: 'Ghee Podi Masala Dosa',
            description: 'Golden-crisp crepe smeared with aromatic spicy gun-powder (podi), pure cow ghee, and stuffed with seasoned potato masala.',
            vegType: 'veg',
            variants: [{ name: '1 Dosa with 3 Chutneys & Sambar', price: 140 }],
          },
          {
            name: 'Mysore Masala Dosa',
            description: 'Crispy dosa coated with spicy red garlic-chilli chutney spread and rich potato filling.',
            vegType: 'veg',
            variants: [{ name: '1 Dosa with Chutneys', price: 150 }],
          },
          {
            name: 'Crispy Medu Vada',
            description: 'Golden fried savory urad dal donuts with crunchy crust and soft fluffy interior.',
            vegType: 'veg',
            variants: [{ name: '2 Pieces with Sambar & Chutney', price: 85 }],
          },
          {
            name: 'Steamed Thatte Idli',
            description: 'Pillowy soft traditional plate-sized idlis served hot with coconut chutney, tomato relish, and drumstick sambar.',
            vegType: 'veg',
            variants: [{ name: '2 Large Idlis', price: 80 }],
          },
        ],
      },
      {
        name: 'Traditional Meals & Curries',
        sortOrder: 2,
        foods: [
          {
            name: 'South Indian Banana Leaf Thali',
            description: 'Complete wholesome meal with fragrant rice, sambar, rasam, kootu, poriyal, appalam, curd, and dessert.',
            vegType: 'veg',
            variants: [
              { name: 'Standard Meal', price: 210 },
              { name: 'Deluxe Special Feast', price: 285 },
            ],
          },
          {
            name: 'Malabar Fish Curry (Kingfish)',
            description: 'Fresh kingfish steaks simmered in a mildly tangy coconut milk, kudampuli, and curry leaf gravy.',
            vegType: 'non_veg',
            variants: [{ name: '2 Pieces Kingfish Portion', price: 295 }],
          },
          {
            name: 'Chettinad Pepper Chicken',
            description: 'Rustic Tamil Nadu style chicken curry intensely spiced with freshly roasted black peppercorns and fennel.',
            vegType: 'non_veg',
            variants: [{ name: 'Regular Portion', price: 245 }],
          },
        ],
      },
      {
        name: 'Beverages & Traditional Sweets',
        sortOrder: 3,
        foods: [
          {
            name: 'Traditional Kumbakonam Degree Coffee',
            description: 'Freshly decocted chicory blend brewed with piping hot frothy cow milk, served in classical brass davara-tumbler.',
            vegType: 'veg',
            variants: [{ name: '1 Davara-Tumbler', price: 50 }],
          },
          {
            name: 'Pure Ghee Mysore Pak',
            description: 'Rich, melt-in-the-mouth gram flour confection loaded with aromatic clarified butter.',
            vegType: 'veg',
            variants: [{ name: '2 Pieces (100g)', price: 70 }],
          },
        ],
      },
    ],
  });

  console.log('\n================================================================');
  console.log('DEMO DATA SEEDED SUCCESSFULLY!');
  console.log('================================================================');
  console.log('\nCredentials for testing:');
  console.log('1. Owner 1 (Multi-Shop Owner - Owns 2 Shops):');
  console.log('   Email:    owner.kolkata@shopmanu.com');
  console.log('   Password: OwnerPassword123!');
  console.log('   Shops:    1) Aminia Grand Biryani & Kebabs (Salt Lake)');
  console.log('             2) Royal Roll Corner & Street Bites (Park Street)');
  console.log('\n2. Owner 2 (Single-Shop Owner - Strict Cross-Tenant Isolation):');
  console.log('   Email:    owner.south@shopmanu.com');
  console.log('   Password: OwnerPassword123!');
  console.log('   Shops:    1) Dakshin Spice Kitchen (Salt Lake)');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
