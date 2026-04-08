const URL = 'https://sbeojimlslqvqcymjkin.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZW9qaW1sc2xxdnFjeW1qa2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE0ODksImV4cCI6MjA5MTA4NzQ4OX0.zoCmPmMo0RdkwA-kSmPZnGaXKsn3wCnlklBDdofGrIA';

async function check() {
  const headers = {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json'
  };

  const res = await fetch(`${URL}/facades?limit=1`, { headers });
  const data = await res.json();
  console.log(JSON.stringify(data[0], null, 2));
}

check();
