const URL = 'https://sbeojimlslqvqcymjkin.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZW9qaW1sc2xxdnFjeW1qa2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE0ODksImV4cCI6MjA5MTA4NzQ4OX0.zoCmPmMo0RdkwA-kSmPZnGaXKsn3wCnlklBDdofGrIA';

async function check() {
  const headers = {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json'
  };

  const resFac = await fetch(`${URL}/facades?limit=1`, { headers });
  const fac = await resFac.json();
  console.log('--- FACADES ---');
  console.log(JSON.stringify(fac[0] || 'empty table', null, 2));

  const resMod = await fetch(`${URL}/modules?limit=1`, { headers });
  const mod = await resMod.json();
  console.log('\n--- MODULES ---');
  console.log(JSON.stringify(mod[0] || 'empty table', null, 2));
}

check();
