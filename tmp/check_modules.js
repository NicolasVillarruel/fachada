const URL = 'https://sbeojimlslqvqcymjkin.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZW9qaW1sc2xxdnFjeW1qa2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE0ODksImV4cCI6MjA5MTA4NzQ4OX0.zoCmPmMo0RdkwA-kSmPZnGaXKsn3wCnlklBDdofGrIA';
const PROJECT_ID = '773f6371-fbdd-40dd-b6a0-85f3d73094c6';

async function check() {
  const headers = {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json'
  };

  // Count modules for project
  const resProject = await fetch(`${URL}/modules?project_id=eq.${PROJECT_ID}&select=count`, { headers });
  const countProject = (await resProject.json())[0].count;

  // Count modules with facade_id
  const resFacade = await fetch(`${URL}/modules?project_id=eq.${PROJECT_ID}&facade_id=not.is.null&select=count`, { headers });
  const countWithFacade = (await resFacade.json())[0].count;

  // Count modules without facade_id
  const resNoFacade = await fetch(`${URL}/modules?project_id=eq.${PROJECT_ID}&facade_id=is.null&select=count`, { headers });
  const countNoFacade = (await resNoFacade.json())[0].count;

  console.log(`Total Project Modules: ${countProject}`);
  console.log(`Modules with Facade: ${countWithFacade}`);
  console.log(`Modules without Facade: ${countNoFacade}`);
}

check();
