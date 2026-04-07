const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
  const projectId = 'b66b4512-101c-4a51-92ef-6890b953d31a'; // Torre Skyline
  console.log('Seeding project:', projectId);

  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('project_id', projectId)
    .limit(50);

  if (!modules || modules.length === 0) {
    console.log('No modules found.');
    return;
  }

  const logs = [];
  const startDate = new Date('2026-03-01');
  const today = new Date();
  
  for (const mod of modules) {
    const dayOffset = Math.floor(Math.random() * 25);
    const inProgressDate = new Date(startDate);
    inProgressDate.setDate(startDate.getDate() + dayOffset);

    if (inProgressDate < today) {
      logs.push({
        module_id: mod.id,
        old_status: 'PENDING',
        new_status: 'IN_PROGRESS',
        timestamp: inProgressDate.toISOString()
      });

      if (Math.random() > 0.4) {
        const finishOffset = dayOffset + Math.floor(Math.random() * 8) + 2;
        const finishDate = new Date(startDate);
        finishDate.setDate(startDate.getDate() + finishOffset);

        if (finishDate < today) {
          logs.push({
            module_id: mod.id,
            old_status: 'IN_PROGRESS',
            new_status: 'COMPLETED',
            timestamp: finishDate.toISOString()
          });
        }
      }
    }
  }

  console.log(`Inserting ${logs.length} logs into status_log...`);
  const { error } = await supabase.from('status_log').insert(logs);
  if (error) console.error(error);
  else console.log('Historical seed success!');
}

seed();
