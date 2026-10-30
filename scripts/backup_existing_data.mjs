import fs from 'node:fs';
import path from 'node:path';

const apiKey = process.env.INSFORGE_API_KEY || '';
if (!apiKey) {
  console.error('Error: INSFORGE_API_KEY environment variable is required.');
  process.exit(1);
}
const url = 'https://yke9qwgm.us-east.insforge.app/api/database/advance/rawsql';

async function querySql(query) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL Query Failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.rows || [];
}

async function runBackup() {
  console.log('--- Starting Complete Database Backup Before Kolkata Food Shops Migration ---');
  const backupDir = path.resolve('backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const tables = [
    'profiles',
    'restaurants',
    'categories',
    'foods',
    'food_variants',
    'food_addons',
    'food_to_addons',
    'combos',
    'combo_items',
    'restaurant_hours',
    'restaurant_reports',
    'price_history'
  ];

  const backupData = {
    timestamp: new Date().toISOString(),
    description: 'Complete backup of all existing restaurant, menu, user, and auxiliary records prior to the 10 Kolkata Food Shops migration.',
    tables: {}
  };

  for (const table of tables) {
    console.log(`Backing up table: ${table}...`);
    const rows = await querySql(`SELECT * FROM public.${table};`);
    backupData.tables[table] = rows;
    console.log(`  -> Saved ${rows.length} rows from ${table}`);
  }

  const filePath = path.join(backupDir, 'database_backup_before_kolkata_shops.json');
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log(`\nSuccessfully created complete backup at: ${filePath}`);
  console.log(`Backup size: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`);
}

runBackup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});

