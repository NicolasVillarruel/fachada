const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
  const projectId = 'b66b4512-101c-4a51-92ef-6890b953d31a'; // Torre Skyline
  console.log('Final Final Heavy Seed:', projectId);

  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('project_id', projectId)
    .limit(800);

  const logs = [];
  const startDate = new Date('2026-03-01');
  const today = new Date();
  
  for (const mod of modules) {
    const startDay = Math.floor(Math.random() * 20);
    const date1 = new Date(startDate);
    date1.setDate(startDate.getDate() + startDay);

    if (date1 < today) {
      logs.push({
        module_id: mod.id,
        old_status: 'PENDING',
        new_status: 'IN_PROGRESS',
        timestamp: date1.toISOString()
      });

      const finishDay = startDay + Math.floor(Math.random() * 10) + 2;
      const date2 = new Date(startDate);
      date2.setDate(startDate.getDate() + finishDay);

      if (date2 < today) {
        logs.push({
          module_id: mod.id,
          old_status: 'IN_PROGRESS',
          new_status: 'COMPLETED',
          timestamp: date2.toISOString()
        });
      }
    }
  }

  console.log(`Inserting ${logs.length} logs...`);
  const { error } = await supabase.from('status_logs').insert(logs);
  if (error) console.error(JSON.stringify(error));
  else console.log('Successfully seeded 800 modules worth of history!');
}

seed();
