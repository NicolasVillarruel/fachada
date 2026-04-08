const URL = 'https://sbeojimlslqvqcymjkin.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZW9qaW1sc2xxdnFjeW1qa2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE0ODksImV4cCI6MjA5MTA4NzQ4OX0.zoCmPmMo0RdkwA-kSmPZnGaXKsn3wCnlklBDdofGrIA';
const PROJECT_ID = '773f6371-fbdd-40dd-b6a0-85f3d73094c6';

async function check() {
  const headers = {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json'
  };

  const res = await fetch(`${URL}/facades?project_id=eq.${PROJECT_ID}`, { headers });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

check();
