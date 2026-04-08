const URL = 'https://sbeojimlslqvqcymjkin.supabase.co/storage/v1/bucket';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZW9qaW1sc2xxdnFjeW1qa2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE0ODksImV4cCI6MjA5MTA4NzQ4OX0.zoCmPmMo0RdkwA-kSmPZnGaXKsn3wCnlklBDdofGrIA';

async function checkBuckets() {
  const headers = {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`
  };

  try {
    const res = await fetch(URL, { headers });
    const data = await res.json();
    console.log('--- STORAGE BUCKETS ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('Storage check failed:', e.message);
  }
}

checkBuckets();
