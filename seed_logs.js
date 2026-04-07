const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
  const projectId = 'b66b4512-101c-4a51-92ef-6890b953d31a'; // Torre Skyline
  console.log('Heavy Seeding project (Final fix):', projectId);

  // 1. Get 1000 modules (approx 45% of project)
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('project_id', projectId)
    .limit(1000);

  if (!modules || modules.length === 0) {
    console.log('No modules found.');
    return;
  }

  const logs = [];
  const startDate = new Date('2026-03-01');
  const today = new Date();
  
  // 2. Generate history
  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const startDay = Math.floor(Math.random() * 25);
    const inProgressDate = new Date(startDate);
    inProgressDate.setDate(startDate.getDate() + startDay);

    if (inProgressDate < today) {
      logs.push({
        module_id: mod.id,
        old_status: 'PENDING',
        new_status: 'IN_PROGRESS',
        timestamp: inProgressDate.toISOString()
      });

      // Finish most of them
      if (Math.random() > 0.3) {
        const finishOffset = startDay + Math.floor(Math.random() * 8) + 2;
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

  console.log(`Inserting ${logs.length} logs into status_logs (Plural)...`);
  
  const batchSize = 100;
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize);
    const { error } = await supabase.from('status_logs').insert(batch);
    if (error) {
      console.error('Batch error:', error);
      break;
    }
    console.log(`Inserted logs ${i} to ${Math.min(i + batchSize, logs.length)}`);
  }
  
  console.log('Final seed complete!');
}

seed();
