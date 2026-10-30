import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.INSFORGE_API_KEY || '';
if (!apiKey) {
  console.error('Error: INSFORGE_API_KEY environment variable is required.');
  process.exit(1);
}
const url = 'https://yke9qwgm.us-east.insforge.app/api/database/advance/rawsql';

async function querySql(query, params = []) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({ query, params }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL Query Failed (${res.status}): ${text}\nQuery was: ${query.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.rows || [];
}

const KOLKATA_SHOPS = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Arsalan',
    slug: 'arsalan-park-circus',
    description: 'Renowned pioneer of legendary Kolkata-style Biryani with subtle Awadhi aromas, tender spiced potato, and succulent charcoal-grilled kebabs since 2002.',
    category: 'Biryani & Mughlai',
    address: '191, Marina Garden Court, Park Street, Park Circus (Near 7-Point Crossing)',
    area: 'Park Circus',
    city: 'Kolkata',
    latitude: 22.5441,
    longitude: 88.3653,
    phone: '+91 9007007942',
    website: 'https://arsalanrestaurants.com/',
    source_url: 'https://arsalanrestaurants.com/',
    last_verified_at: '2026-10-29T10:00:00Z',
    verification_status: 'verified',
    hours: [
      { day: 0, open: '10:30:00', close: '04:00:00', closed: false },
      { day: 1, open: '10:30:00', close: '04:00:00', closed: false },
      { day: 2, open: '10:30:00', close: '04:00:00', closed: false },
      { day: 3, open: '10:30:00', close: '04:00:00', closed: false },
      { day: 4, open: '10:30:00', close: '04:00:00', closed: false },
      { day: 5, open: '10:30:00', close: '04:00:00', closed: false },
      { day: 6, open: '10:30:00', close: '04:00:00', closed: false },
    ],
    categories: [
      {
        id: '11000000-0000-0000-0000-000000000001',
        name: 'Biryani Specials',
        sort_order: 1,
        foods: [
          {
            name: 'Mutton Biryani',
            slug: 'arsalan-mutton-biryani',
            description: 'Fragrant long-grain Basmati rice cooked in dum with tender mutton piece, spiced potato, and boiled egg.',
            veg_type: 'non_veg',
            price: 444,
            price_status: 'verified',
          },
          {
            name: 'Chicken Biryani',
            slug: 'arsalan-chicken-biryani',
            description: 'Classic Kolkata-style dum biryani with marinated chicken piece, soft potato, and aromatic saffron rice.',
            veg_type: 'non_veg',
            price: 444,
            price_status: 'verified',
          },
          {
            name: 'Special Chicken Biryani (2 pcs)',
            slug: 'arsalan-special-chicken-biryani',
            description: 'Grand feast portion with two large chicken pieces, spiced egg, and tender slow-cooked potato.',
            veg_type: 'non_veg',
            price: 761,
            price_status: 'verified',
          },
        ],
      },
      {
        id: '11000000-0000-0000-0000-000000000002',
        name: 'Kebabs & Tandoor',
        sort_order: 2,
        foods: [
          {
            name: 'Chicken Seekh Kebab (6 pcs)',
            slug: 'arsalan-chicken-seekh-kebab',
            description: 'Spiced minced chicken skewers gently roasted over open charcoal (6 pcs).',
            veg_type: 'non_veg',
            price: 449,
            price_status: 'verified',
          },
          {
            name: 'Mutton Boti Kebab',
            slug: 'arsalan-mutton-boti-kebab',
            description: 'Succulent marinated mutton cubes grilled over coals. Current portion price subject to counter verification.',
            veg_type: 'non_veg',
            price: null,
            price_status: 'unknown',
          },
          {
            name: 'Chicken Chatpata',
            slug: 'arsalan-chicken-chatpata',
            description: 'Tangy spiced chicken tossed in special house dry-rub spices. Current portion price subject to counter verification.',
            veg_type: 'non_veg',
            price: null,
            price_status: 'unknown',
          },
        ],
      },
      {
        id: '11000000-0000-0000-0000-000000000003',
        name: 'Desserts',
        sort_order: 3,
        foods: [
          {
            name: 'Firni',
            slug: 'arsalan-firni',
            description: 'Traditional slow-cooked ground rice pudding flavored with saffron, cardamom, and rose water.',
            veg_type: 'veg',
            price: 110,
            price_status: 'verified',
          },
          {
            name: 'Shahi Tukda',
            slug: 'arsalan-shahi-tukda',
            description: 'Royal fried bread soaked in saffron-cardamom rabri and garnished with slivered pistachios.',
            veg_type: 'veg',
            price: 200,
            price_status: 'verified',
          },
        ],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Flurys',
    slug: 'flurys-park-street',
    description: 'Historic European-style tearoom and confectioner established in 1927 on Park Street, celebrated for legendary English breakfasts, pastries, and fine teas.',
    category: 'Cafe & Bakery',
    address: '18A, Park Street',
    area: 'Park Street',
    city: 'Kolkata',
    latitude: 22.5532,
    longitude: 88.3524,
    phone: '+91 9831371927',
    website: 'https://www.flurys.com/',
    source_url: 'https://www.flurys.com/',
    last_verified_at: '2026-10-29T10:00:00Z',
    verification_status: 'verified',
    hours: [
      { day: 0, open: '06:00:00', close: '01:00:00', closed: false },
      { day: 1, open: '06:00:00', close: '01:00:00', closed: false },
      { day: 2, open: '06:00:00', close: '01:00:00', closed: false },
      { day: 3, open: '06:00:00', close: '01:00:00', closed: false },
      { day: 4, open: '06:00:00', close: '01:00:00', closed: false },
      { day: 5, open: '06:00:00', close: '01:00:00', closed: false },
      { day: 6, open: '06:00:00', close: '01:00:00', closed: false },
    ],
    categories: [
      {
        id: '11000000-0000-0000-0000-000000000004',
        name: 'Breakfast & Brunches',
        sort_order: 1,
        foods: [
          {
            name: 'The Legendary Full English Breakfast',
            slug: 'flurys-full-english-breakfast',
            description: 'Crispy bacon, grilled chicken sausages, two fried eggs, grilled tomato, hash browns, sautéed mushrooms, baked beans, and buttered toast.',
            veg_type: 'non_veg',
            price: 980,
            price_status: 'verified',
          },
          {
            name: 'Chicken Mustard Sandwich',
            slug: 'flurys-chicken-mustard-sandwich',
            description: 'Tender pulled chicken tossed in sharp English mustard mayo on freshly baked artisan bread.',
            veg_type: 'non_veg',
            price: 340,
            price_status: 'verified',
          },
        ],
      },
      {
        id: '11000000-0000-0000-0000-000000000005',
        name: 'Heritage Pastries & Cakes',
        sort_order: 2,
        foods: [
          {
            name: 'Rum Ball',
            slug: 'flurys-rum-ball',
            description: 'The timeless rich dark chocolate cake truffle infused with spiced aromatic rum essence.',
            veg_type: 'veg',
            price: 170,
            price_status: 'verified',
          },
          {
            name: 'Red Velvet Pastry',
            slug: 'flurys-red-velvet-pastry',
            description: 'Delicate crimson sponge cake layered with silky vanilla cream cheese frosting.',
            veg_type: 'veg',
            price: 220,
            price_status: 'verified',
          },
        ],
      },
      {
        id: '11000000-0000-0000-0000-000000000006',
        name: 'Artisanal Beverages',
        sort_order: 3,
        foods: [
          {
            name: 'Viennese Coffee',
            slug: 'flurys-viennese-coffee',
            description: 'Freshly extracted rich espresso crowned with a generous swirl of fresh whipped cream.',
            veg_type: 'veg',
            price: 240,
            price_status: 'verified',
          },
          {
            name: 'Heritage Hot Chocolate',
            slug: 'flurys-hot-chocolate',
            description: 'Decadent melted cocoa and warm velvety milk brew.',
            veg_type: 'veg',
            price: 190,
            price_status: 'verified',
          },
        ],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Peter Cat',
    slug: 'peter-cat-park-street',
    description: 'Iconic Park Street destination established in 1975, legendary for its original Chelo Kebab meal, sizzling grills, and timeless heritage dining aesthetic.',
    category: 'Continental & North Indian',
    address: 'Stephen Court Building, 18A, Park Street',
    area: 'Park Street',
    city: 'Kolkata',
    latitude: 22.5534,
    longitude: 88.3526,
    phone: '+91 33 2229 8841',
    website: 'https://www.petercatkolkata.com/',
    source_url: 'https://www.petercatkolkata.com/',
    last_verified_at: '2026-10-29T10:00:00Z',
    verification_status: 'verified',
    hours: [
      { day: 0, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 1, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 2, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 3, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 4, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 5, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 6, open: '11:00:00', close: '23:00:00', closed: false },
    ],
    categories: [
      {
        id: '11000000-0000-0000-0000-000000000007',
        name: 'Legendary Chelo Kebabs',
        sort_order: 1,
        foods: [
          {
            name: 'Original Chelo Kebab Meal',
            slug: 'peter-cat-original-chelo-kebab',
            description: 'Fragrant buttered rice crowned with fresh butter cubes, poached egg, skewers of tender mutton seekh kebab, and grilled chicken kebab.',
            veg_type: 'non_veg',
            price: 550,
            price_status: 'verified',
          },
          {
            name: 'Chicken Marrakech',
            slug: 'peter-cat-chicken-marrakech',
            description: 'Moroccan-spiced skewered chicken cooked to juicy perfection.',
            veg_type: 'non_veg',
            price: 470,
            price_status: 'verified',
          },
        ],
      },
      {
        id: '11000000-0000-0000-0000-000000000008',
        name: 'Continental Specialities',
        sort_order: 2,
        foods: [
          {
            name: 'Chicken Steak Sizzler',
            slug: 'peter-cat-chicken-steak-sizzler',
            description: 'Grilled chicken breast served sizzling with black pepper glaze, French fries, and buttered vegetables.',
            veg_type: 'non_veg',
            price: 520,
            price_status: 'verified',
          },
          {
            name: 'Fish Meuniere',
            slug: 'peter-cat-fish-meuniere',
            description: 'Pan-seared fresh fish fillet dressed with browned lemon-butter and caper jus.',
            veg_type: 'non_veg',
            price: 540,
            price_status: 'verified',
          },
          {
            name: 'Continental Grilled Kebabs',
            slug: 'peter-cat-continental-grilled-kebabs',
            description: 'Assorted seasonal skewered grill preparation. Portion price subject to counter verification.',
            veg_type: 'non_veg',
            price: null,
            price_status: 'unknown',
          },
        ],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: "Nizam's",
    slug: 'nizams-new-market',
    description: 'Historic 1932 culinary landmark in New Market and the internationally recognized birthplace of the iconic Kathi Roll.',
    category: 'Rolls & Mughlai',
    address: '23–24, Hogg Street, New Market Area',
    area: 'New Market',
    city: 'Kolkata',
    latitude: 22.5601,
    longitude: 88.3528,
    phone: '+91 33 2252 3411',
    website: 'https://nizams-restaurant.com/',
    source_url: 'https://nizams-restaurant.com/',
    last_verified_at: '2026-10-29T10:00:00Z',
    verification_status: 'verified',
    hours: [
      { day: 0, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 1, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 2, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 3, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 4, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 5, open: '11:00:00', close: '23:00:00', closed: false },
      { day: 6, open: '11:00:00', close: '23:00:00', closed: false },
    ],
    categories: [
      {
        id: '11000000-0000-0000-0000-000000000009',
        name: 'Historic Kathi Rolls',
        sort_order: 1,
        foods: [
          {
            name: 'Chicken Kathi Roll',
            slug: 'nizams-chicken-kathi-roll',
            description: 'The world-famous original Kathi roll: roasted spiced chicken kebabs wrapped in a crispy paratha with onions and lime.',
            veg_type: 'non_veg',
            price: 120,
            price_status: 'verified',
          },
          {
            name: 'Mutton Kathi Roll',
            slug: 'nizams-mutton-kathi-roll',
            description: 'Charcoal-skewered juicy mutton boti pieces rolled in fresh crisp laccha paratha.',
            veg_type: 'non_veg',
            price: 144,
            price_status: 'verified',
          },
          {
            name: 'Egg Roll',
            slug: 'nizams-egg-roll',
            description: 'Crisp paratha seared with beaten egg and seasoned with sliced green chilies and lemon juice.',
            veg_type: 'non_veg',
            price: 78,
            price_status: 'verified',
          },
          {
            name: 'Double Mutton Roll',
            slug: 'nizams-double-mutton-roll',
            description: 'Generous double portion of charcoal-roasted mutton kebabs. Portion price subject to counter verification.',
            veg_type: 'non_veg',
            price: null,
            price_status: 'unknown',
          },
        ],
      },
      {
        id: '11000000-0000-0000-0000-000000000010',
        name: 'Mughlai Main Course & Sweets',
        sort_order: 2,
        foods: [
          {
            name: 'Murgh Biryani',
            slug: 'nizams-murgh-biryani',
            description: 'Heritage Mughlai chicken biryani layered with fragrant spiced Basmati rice and classic Kolkata potato.',
            veg_type: 'non_veg',
            price: 260,
            price_status: 'verified',
          },
          {
            name: 'Zafrani Firni',
            slug: 'nizams-zafrani-firni',
            description: 'Traditional slow-simmered saffron ground-rice pudding served chilled in an earthenware pot.',
            veg_type: 'veg',
            price: 80,
            price_status: 'verified',
          },
        ],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    name: '6 Ballygunge Place',
    slug: '6-ballygunge-place',
    description: 'Premier heritage Bengali fine-dining restaurant housed in a vintage colonial bungalow, reviving centuries-old Zamindari recipes and royal feasts.',
    category: 'Bengali Cuisine',
    address: '6, Dr. Amiya Bose Sarani Road, Ballygunge Place',
    area: 'Ballygunge',
    city: 'Kolkata',
    latitude: 22.5278,
    longitude: 88.3688,
    phone: '+91 99039 75614',
    website: 'https://6ballygungeplace.in/',
    source_url: 'https://6ballygungeplace.in/',
    last_verified_at: '2026-10-29T10:00:00Z',
    verification_status: 'verified',
    hours: [
      { day: 0, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 1, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 2, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 3, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 4, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 5, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 6, open: '12:00:00', close: '22:30:00', closed: false },
    ],
    categories: [
      {
        id: '11000000-0000-0000-0000-000000000011',
        name: 'Signature Curries & Seafood',
        sort_order: 1,
        foods: [
          {
            name: 'Daab Chingri',
            slug: '6bp-daab-chingri',
            description: 'Fresh river prawns subtly cooked with mustard and young coconut cream, presented inside a tender green coconut shell.',
            veg_type: 'non_veg',
            price: 485,
            price_status: 'verified',
          },
          {
            name: 'Kosha Mangsho (2 pcs)',
            slug: '6bp-kosha-mangsho',
            description: 'Slow-braised rich and dark Kolkata-style mutton curry cooked with aromatic whole spices (2 pcs).',
            veg_type: 'non_veg',
            price: 375,
            price_status: 'verified',
          },
          {
            name: 'Fish Fry with Kasundi',
            slug: '6bp-fish-fry',
            description: 'Crumb-coated fresh Bhetki fish fillet fried golden crisp, served with pungent Bengal mustard relish.',
            veg_type: 'non_veg',
            price: 250,
            price_status: 'verified',
          },
          {
            name: 'Bhetki Paturi',
            slug: '6bp-bhetki-paturi',
            description: 'Tender bhetki marinated in sharp mustard and coconut relish, wrapped in banana leaf and gently steamed.',
            veg_type: 'non_veg',
            price: 245,
            price_status: 'verified',
          },
        ],
      },
      {
        id: '11000000-0000-0000-0000-000000000012',
        name: 'Traditional Bengali Thalis',
        sort_order: 2,
        foods: [
          {
            name: 'Bengali Mutton Thali',
            slug: '6bp-mutton-thali',
            description: 'Grand Bengali feast comprising welcome drink, rice, luchi, dal, vegetable bhaja, Kosha Mangsho, chutney, papad, and sweet.',
            veg_type: 'non_veg',
            price: 575,
            price_status: 'verified',
          },
          {
            name: 'Bengali Veg Thali',
            slug: '6bp-veg-thali',
            description: 'Traditional vegetarian thali with seasonal curries, dal, luchi, fragrant rice, tomato-date chutney, and sandesh.',
            veg_type: 'veg',
            price: 275,
            price_status: 'verified',
          },
        ],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    name: 'Kusum Rolls',
    slug: 'kusum-rolls-park-street',
    description: 'Iconic Park Street takeaway counter renowned across Kolkata for generously stuffed, flaky layered laccha paratha Kathi rolls.',
    category: 'Street Food & Rolls',
    address: 'Shop No. 3A, Ground Floor, Karnani Mansion, 21 Park Street',
    area: 'Park Street',
    city: 'Kolkata',
    latitude: 22.5529,
    longitude: 88.3537,
    phone: null,
    website: null,
    source_url: 'https://www.magicpin.in/',
    last_verified_at: '2026-10-29T10:00:00Z',
    verification_status: 'verified',
    hours: [
      { day: 0, open: '11:30:00', close: '23:30:00', closed: false },
      { day: 1, open: '11:30:00', close: '23:30:00', closed: false },
      { day: 2, open: '11:30:00', close: '23:30:00', closed: false },
      { day: 3, open: '11:30:00', close: '23:30:00', closed: false },
      { day: 4, open: '11:30:00', close: '23:30:00', closed: false },
      { day: 5, open: '11:30:00', close: '23:30:00', closed: false },
      { day: 6, open: '11:30:00', close: '23:30:00', closed: false },
    ],
    categories: [
      {
        id: '11000000-0000-0000-0000-000000000013',
        name: 'Signature Kathi Rolls',
        sort_order: 1,
        foods: [
          {
            name: 'Egg Chicken Roll',
            slug: 'kusum-egg-chicken-roll',
            description: 'The Park Street benchmark: egg-layered crispy laccha paratha loaded with marinated chicken pieces, crunchy onions, and green chilies.',
            veg_type: 'non_veg',
            price: 140,
            price_status: 'verified',
          },
          {
            name: 'Chicken Roll',
            slug: 'kusum-chicken-roll',
            description: 'Juicy spiced chicken pieces rolled in hot fried paratha with lemon and sliced onions.',
            veg_type: 'non_veg',
            price: 120,
            price_status: 'verified',
          },
          {
            name: 'Double Egg Roll',
            slug: 'kusum-double-egg-roll',
            description: 'Double egg glazed paratha rolled with seasoned onions, chaat masala, and fresh lime.',
            veg_type: 'non_veg',
            price: 80,
            price_status: 'verified',
          },
          {
            name: 'Paneer Roll',
            slug: 'kusum-paneer-roll',
            description: 'Soft cottage cheese chunks seasoned in house spices with bell peppers in a flaky paratha.',
            veg_type: 'veg',
            price: 150,
            price_status: 'verified',
          },
        ],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    name: 'Mitra Cafe',
    slug: 'mitra-cafe-shobhabazar',
    description: 'Heritage 1910 North Kolkata cabin-food institution famed for its original Fish Kabiraji with delicate egg netting, Brain Chop, and vintage cutlets.',
    category: 'Bengali Snacks & Cabin Food',
    address: '47, Jatindra Mohan Avenue, Shobhabazar',
    area: 'Shobhabazar',
    city: 'Kolkata',
    latitude: 22.5971,
    longitude: 88.3683,
    phone: '+91 84201 61111',
    website: 'https://mitracafe.co.in/',
    source_url: 'https://mitracafe.co.in/',
    last_verified_at: '2026-10-29T10:00:00Z',
    verification_status: 'verified',
    hours: [
      { day: 0, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 1, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 2, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 3, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 4, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 5, open: '12:00:00', close: '22:30:00', closed: false },
      { day: 6, open: '12:00:00', close: '22:30:00', closed: false },
    ],
    categories: [
      {
        id: '11000000-0000-0000-0000-000000000014',
        name: 'Legendary Kabirajis & Chops',
        sort_order: 1,
        foods: [
          {
            name: 'Fish Kabiraji',
            slug: 'mitra-cafe-fish-kabiraji',
            description: 'Signature pure Kolkata Bhetki fish cutlet encased in an airy, crispy golden web of whisked egg froth.',
            veg_type: 'non_veg',
            price: 190,
            price_status: 'verified',
          },
          {
            name: 'Mutton Kabiraji',
            slug: 'mitra-cafe-mutton-kabiraji',
            description: 'Finely spiced minced mutton patty draped in the signature lacy egg nest.',
            veg_type: 'non_veg',
            price: 200,
            price_status: 'verified',
          },
          {
            name: 'Brain Chop',
            slug: 'mitra-cafe-brain-chop',
            description: 'Rare heritage Bengali delicacy: delicately spiced goat brain croquette fried crisp (daily availability varies).',
            veg_type: 'non_veg',
            price: 110,
            price_status: 'verified',
          },
        ],
      },
      {
        id: '11000000-0000-0000-0000-000000000015',
        name: 'Heritage Cutlets & Fries',
        sort_order: 2,
        foods: [
          {
            name: 'Fish Diamond Fry',
            slug: 'mitra-cafe-fish-diamond-fry',
            description: 'Diamond-cut pure Bhetki fish fillet marinated in Bengali green herbs and crumb-fried golden.',
            veg_type: 'non_veg',
            price: 220,
            price_status: 'verified',
          },
          {
            name: 'Mutton Cutlet',
            slug: 'mitra-cafe-mutton-cutlet',
            description: 'Traditional minced mutton cutlet seasoned with rich whole spices, served with kasundi and sliced onions.',
            veg_type: 'non_veg',
            price: 170,
            price_status: 'verified',
          },
        ],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    name: 'Paramount Cold Drinks & Syrups',
    slug: 'paramount-cold-drinks-college-square',
    description: 'Centenary 1918 heritage sherbet parlour near College Square, celebrated for its legendary Daab Sherbet, Cocoa Malai, and natural fruit syrups.',
    category: 'Beverages & Traditional Sherbets',
    address: '1/1/1D, Bankim Chatterjee Street, College Square',
    area: 'College Street',
    city: 'Kolkata',
    latitude: 22.5746,
    longitude: 88.3638,
    phone: '+91 33 2219 2433',
    website: null,
    source_url: 'https://wikikolkata.com/paramount-sherbets/',
    last_verified_at: '2026-10-29T10:00:00Z',
    verification_status: 'verified',
    hours: [
      { day: 0, open: '12:00:00', close: '22:00:00', closed: false },
      { day: 1, open: '12:00:00', close: '22:00:00', closed: false },
      { day: 2, open: '12:00:00', close: '22:00:00', closed: false },
      { day: 3, open: '12:00:00', close: '22:00:00', closed: false },
      { day: 4, open: '12:00:00', close: '22:00:00', closed: false },
      { day: 5, open: '12:00:00', close: '22:00:00', closed: false },
      { day: 6, open: '12:00:00', close: '22:00:00', closed: false },
    ],
    categories: [
      {
        id: '11000000-0000-0000-0000-000000000016',
        name: 'Heritage Refreshers & Malai Sherbets',
        sort_order: 1,
        foods: [
          {
            name: 'Daab Sherbet (Coconut Sherbet)',
            slug: 'paramount-daab-sherbet',
            description: 'The historic original formula: tender green coconut water, ice, soft coconut flesh, and secret botanical syrup.',
            veg_type: 'veg',
            price: 70,
            price_status: 'verified',
          },
          {
            name: 'Cocoa Malai',
            slug: 'paramount-cocoa-malai',
            description: 'Signature thick chocolate and milk sherbet blended with rich cream, dry fruits, and secret essence.',
            veg_type: 'veg',
            price: 110,
            price_status: 'verified',
          },
          {
            name: 'Kesar Malai',
            slug: 'paramount-kesar-malai',
            description: 'Rich creamy chilled sherbet infused with genuine Kashmiri saffron and crushed dry fruits.',
            veg_type: 'veg',
            price: 100,
            price_status: 'verified',
          },
          {
            name: 'Grape Crush',
            slug: 'paramount-grape-crush',
            description: 'Refreshing sweet and tangy beverage crafted with crushed black grapes and cooling syrup.',
            veg_type: 'veg',
            price: 80,
            price_status: 'verified',
          },
          {
            name: 'Aam Pora Sherbet',
            slug: 'paramount-aam-pora-sherbet',
            description: 'Traditional summer cooler made from roasted raw green mango, roasted cumin, and black salt.',
            veg_type: 'veg',
            price: 60,
            price_status: 'verified',
          },
        ],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    name: 'Nahoum & Sons',
    slug: 'nahoum-and-sons-new-market',
    description: 'Iconic 1902 Jewish confectionery in New Market, renowned for its heritage fruit cakes, flaky cheese puffs, and retro colonial bakes.',
    category: 'Bakery & Confectionery',
    address: 'F20, Bertram Street, Sir Stuart Hogg Market (New Market)',
    area: 'New Market',
    city: 'Kolkata',
    latitude: 22.5599,
    longitude: 88.3525,
    phone: '+91 33 2252 0655',
    website: null,
    source_url: 'https://en.wikipedia.org/wiki/Nahoum_%26_Sons',
    last_verified_at: '2026-10-29T10:00:00Z',
    verification_status: 'verified',
    hours: [
      { day: 0, open: '09:00:00', close: '20:30:00', closed: false },
      { day: 1, open: '09:00:00', close: '20:30:00', closed: false },
      { day: 2, open: '09:00:00', close: '20:30:00', closed: false },
      { day: 3, open: '09:00:00', close: '20:30:00', closed: false },
      { day: 4, open: '09:00:00', close: '20:30:00', closed: false },
      { day: 5, open: '09:00:00', close: '20:30:00', closed: false },
      { day: 6, open: '09:00:00', close: '20:30:00', closed: false },
    ],
    categories: [
      {
        id: '11000000-0000-0000-0000-000000000017',
        name: 'Heritage Cakes & Puffs',
        sort_order: 1,
        foods: [
          {
            name: 'Rich Fruit Plum Cake (400g)',
            slug: 'nahoum-rich-fruit-plum-cake',
            description: 'Legendary dense Christmas fruit cake steeped in candied citrus peels, raisins, and aromatic whole spices.',
            veg_type: 'veg',
            price: 250,
            price_status: 'verified',
          },
          {
            name: 'Cheese Puffs',
            slug: 'nahoum-cheese-puffs',
            description: 'Warm, flaky layers of golden puff pastry filled with savory cheddar cheese melt.',
            veg_type: 'veg',
            price: 50,
            price_status: 'verified',
          },
          {
            name: 'Lemon Tart',
            slug: 'nahoum-lemon-tart',
            description: 'Crisp shortcrust pastry filled with zesty, tangy homemade lemon curd.',
            veg_type: 'veg',
            price: 60,
            price_status: 'verified',
          },
          {
            name: 'Rum Ball',
            slug: 'nahoum-rum-ball',
            description: 'Decadent chocolate cake truffle with rich dark cocoa and aromatic rum essence.',
            veg_type: 'veg',
            price: 50,
            price_status: 'verified',
          },
          {
            name: 'Macaroons',
            slug: 'nahoum-macaroons',
            description: 'Classic chewy-crisp heritage almond and coconut macaroons.',
            veg_type: 'veg',
            price: 70,
            price_status: 'verified',
          },
          {
            name: 'Pizza Puff',
            slug: 'nahoum-pizza-puff',
            description: 'Flaky baked puff pastry stuffed with Italian herb-seasoned vegetable filling. Portion price subject to counter verification.',
            veg_type: 'veg',
            price: null,
            price_status: 'unknown',
          },
        ],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    name: 'Putiram Sweets',
    slug: 'putiram-sweets-college-street',
    description: '160-year-old heritage sweet shop and breakfast institution near College Square, venerated for fluffy Radhaballabhi with Cholar Dal and artisanal mishti.',
    category: 'Sweets & Bengali Breakfast',
    address: '12A, Surya Sen Street, College Street',
    area: 'College Street',
    city: 'Kolkata',
    latitude: 22.5739,
    longitude: 88.3644,
    phone: '+91 33 2219 2362',
    website: null,
    source_url: 'https://district.in/putiram-sweets',
    last_verified_at: '2026-10-29T10:00:00Z',
    verification_status: 'verified',
    hours: [
      { day: 0, open: '07:00:00', close: '21:00:00', closed: false },
      { day: 1, open: '07:00:00', close: '21:00:00', closed: false },
      { day: 2, open: '07:00:00', close: '21:00:00', closed: false },
      { day: 3, open: '07:00:00', close: '21:00:00', closed: false },
      { day: 4, open: '07:00:00', close: '21:00:00', closed: false },
      { day: 5, open: '07:00:00', close: '21:00:00', closed: false },
      { day: 6, open: '07:00:00', close: '21:00:00', closed: false },
    ],
    categories: [
      {
        id: '11000000-0000-0000-0000-000000000018',
        name: 'Morning Breakfast & Savouries',
        sort_order: 1,
        foods: [
          {
            name: 'Radhaballabhi with Cholar Dal',
            slug: 'putiram-radhaballabhi',
            description: 'Soft, puffy deep-fried bread stuffed with spiced urad dal, paired with sweet-and-savory Bengal gram dal.',
            veg_type: 'veg',
            price: 35,
            price_status: 'verified',
          },
          {
            name: 'Khasta Kochuri with Alur Torkari',
            slug: 'putiram-khasta-kochuri',
            description: 'Crispy flaky kachoris served with spiced traditional Bengali potato curry.',
            veg_type: 'veg',
            price: 30,
            price_status: 'verified',
          },
          {
            name: 'Aloo Dum',
            slug: 'putiram-aloo-dum',
            description: 'Slow-simmered rich potato preparation traditionally served during lunch hours. Portion price subject to counter verification.',
            veg_type: 'veg',
            price: null,
            price_status: 'unknown',
          },
        ],
      },
      {
        id: '11000000-0000-0000-0000-000000000019',
        name: 'Heritage Bengali Sweets',
        sort_order: 2,
        foods: [
          {
            name: 'Mishti Doi',
            slug: 'putiram-mishti-doi',
            description: 'Traditional creamy, caramelized Bengali sweet yogurt fermented slowly in an earthen pot.',
            veg_type: 'veg',
            price: 35,
            price_status: 'verified',
          },
          {
            name: 'Rajbhog',
            slug: 'putiram-rajbhog',
            description: 'Large saffron-infused fresh cottage cheese sweet soaked in light sugar syrup.',
            veg_type: 'veg',
            price: 20,
            price_status: 'verified',
          },
          {
            name: 'Cham Cham',
            slug: 'putiram-cham-cham',
            description: 'Traditional oval Bengali sweet garnished with mawa shavings and cardamom syrup.',
            veg_type: 'veg',
            price: 20,
            price_status: 'verified',
          },
        ],
      },
    ],
  },
];

async function runMigration() {
  console.log('=== Step 1: Verify Pre-Migration Backup ===');
  const backupFile = path.resolve('backup', 'database_backup_before_kolkata_shops.json');
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found at ${backupFile}! Aborting migration.`);
  }
  console.log(`Verified backup file exists (${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB).`);

  console.log('\n=== Step 2: Identify and Preserve Genuine Registered User Accounts ===');
  const genuineProfiles = await querySql(`SELECT id, email, role FROM public.profiles WHERE email = 'sourish1600@gmail.com';`);
  console.log('Genuine profile preserved:', genuineProfiles);
  const genuineRestaurants = await querySql(`SELECT id, name, slug, status FROM public.restaurants WHERE owner_id = '8e7b0a55-3ef9-4c33-b8c1-d58e11a22142';`);
  console.log('Genuine restaurant record preserved (The Heritage Kitchen, status=pending):', genuineRestaurants);

  console.log('\n=== Step 3: Remove Old Demo Restaurant Listings from Public Catalog ===');
  // Delete only restaurants that are NOT owned by genuine user 8e7b0a55-3ef9-4c33-b8c1-d58e11a22142
  // And not the new 10 shop IDs
  const deleteResult = await querySql(`
    DELETE FROM public.restaurants 
    WHERE (owner_id IS NULL OR owner_id != '8e7b0a55-3ef9-4c33-b8c1-d58e11a22142')
      AND id NOT IN ('${KOLKATA_SHOPS.map((s) => s.id).join("','")}');
  `);
  console.log('Old demo restaurants safely deleted (cascade removed dependent demo menu items & hours).');

  console.log('\n=== Step 4: Insert the 10 Real Kolkata Food Shops ===');
  for (const shop of KOLKATA_SHOPS) {
    console.log(`Processing Shop: ${shop.name} (${shop.area})...`);

    // 1. Insert Restaurant (or update if already exists)
    await querySql(`
      INSERT INTO public.restaurants (
        id, owner_id, name, slug, description, phone, address, area, city,
        latitude, longitude, status, verified, category, website, source_url,
        last_verified_at, verification_status, created_at, updated_at
      ) VALUES (
        $1, NULL, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, 'approved', true, $11, $12, $13,
        $14, $15, now(), now()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        area = EXCLUDED.area,
        city = EXCLUDED.city,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        status = 'approved',
        verified = true,
        category = EXCLUDED.category,
        website = EXCLUDED.website,
        source_url = EXCLUDED.source_url,
        last_verified_at = EXCLUDED.last_verified_at,
        verification_status = EXCLUDED.verification_status,
        updated_at = now();
    `, [
      shop.id,
      shop.name,
      shop.slug,
      shop.description,
      shop.phone,
      shop.address,
      shop.area,
      shop.city,
      shop.latitude,
      shop.longitude,
      shop.category,
      shop.website,
      shop.source_url,
      shop.last_verified_at,
      shop.verification_status,
    ]);

    // 2. Insert Operating Hours
    await querySql(`DELETE FROM public.restaurant_hours WHERE restaurant_id = $1;`, [shop.id]);
    for (const h of shop.hours) {
      await querySql(`
        INSERT INTO public.restaurant_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
        VALUES ($1, $2, $3, $4, $5);
      `, [shop.id, h.day, h.open, h.close, h.closed]);
    }

    // 3. Clean up existing categories for this shop to avoid duplication
    await querySql(`DELETE FROM public.categories WHERE restaurant_id = $1;`, [shop.id]);

    // 4. Insert Categories & Foods
    for (const cat of shop.categories) {
      await querySql(`
        INSERT INTO public.categories (id, restaurant_id, name, sort_order)
        VALUES ($1, $2, $3, $4);
      `, [cat.id, shop.id, cat.name, cat.sort_order]);

      for (const food of cat.foods) {
        const foodRes = await querySql(`
          INSERT INTO public.foods (
            restaurant_id, category_id, name, slug, description, veg_type,
            available, status, base_price, currency, price_verification_status,
            source_url, last_verified_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            true, 'active', $7, 'INR', $8,
            $9, $10
          )
          RETURNING id;
        `, [
          shop.id,
          cat.id,
          food.name,
          food.slug,
          food.description,
          food.veg_type,
          food.price,
          food.price_status,
          shop.source_url,
          shop.last_verified_at,
        ]);

        const foodId = foodRes[0]?.id;

        // If price is verified, insert standard Regular variant
        if (food.price !== null && foodId) {
          await querySql(`
            INSERT INTO public.food_variants (food_id, name, price, available)
            VALUES ($1, 'Regular', $2, true);
          `, [foodId, food.price]);
        }
      }
    }
  }

  console.log('\n=== Step 5: Post-Migration Catalog Validation ===');
  const approvedShops = await querySql(`
    SELECT id, name, slug, category, area, city, status, verified, phone, website,
           latitude, longitude, verification_status
    FROM public.restaurants
    WHERE status = 'approved'
    ORDER BY name;
  `);

  console.log(`Total Approved Shops in Public Catalog: ${approvedShops.length}`);
  console.table(approvedShops);

  const totalCategories = await querySql(`
    SELECT count(*) FROM public.categories c
    JOIN public.restaurants r ON r.id = c.restaurant_id
    WHERE r.status = 'approved';
  `);
  console.log(`Total Categories for Approved Shops: ${totalCategories[0].count}`);

  const totalFoods = await querySql(`
    SELECT count(*) as total_foods,
           count(CASE WHEN base_price IS NOT NULL THEN 1 END) as verified_price_foods,
           count(CASE WHEN base_price IS NULL THEN 1 END) as unverified_price_foods
    FROM public.foods f
    JOIN public.restaurants r ON r.id = f.restaurant_id
    WHERE r.status = 'approved';
  `);
  console.log('Total Foods Breakdown in Approved Catalog:', totalFoods[0]);

  const totalVariants = await querySql(`
    SELECT count(*) FROM public.food_variants v
    JOIN public.foods f ON f.id = v.food_id
    JOIN public.restaurants r ON r.id = f.restaurant_id
    WHERE r.status = 'approved';
  `);
  console.log(`Total Food Variants in Approved Catalog: ${totalVariants[0].count}`);

  const preservedUser = await querySql(`
    SELECT r.id, r.name, r.status, p.email 
    FROM public.restaurants r 
    JOIN public.profiles p ON r.owner_id = p.id
    WHERE p.email = 'sourish1600@gmail.com';
  `);
  console.log('Confirmed genuine user shop preservation:', preservedUser);

  console.log('\n=== Migration Completed Successfully! ===');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

