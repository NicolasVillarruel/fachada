'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProjectAnalytics() {
  const params = useParams();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    total: 0,
    progress: 0,
    daysAhead: 16, // Mock for now or calculated from delivery_date
    velocity: 1.0,
    projection: '15 may 2026',
    difference: 9
  });

  const fetchProjectStats = useCallback(async () => {
    setLoading(true);
    const { data: projData } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (projData) setProject(projData);

    const { data: modulesData } = await supabase.from('modules').select('status').eq('project_id', projectId);
    if (modulesData) {
      const total = modulesData.length;
      const completed = modulesData.filter(m => m.status === 'COMPLETED').length;
      const inProgress = modulesData.filter(m => m.status === 'IN_PROGRESS').length;
      const weightedProgress = total > 0 ? Math.round(((completed * 1) + (inProgress * 0.5)) / total * 100) : 0;
      
      setStats(prev => ({
        ...prev,
        total,
        completed,
        inProgress,
        progress: weightedProgress
      }));
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchProjectStats();
  }, [projectId, fetchProjectStats]);

  if (loading) return <div className="p-12 animate-pulse text-muted font-bold tracking-widest uppercase text-xs">Calculando Ecosistema...</div>;

  return (
    <main className="p-4 md:p-12 font-inter">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M9 20v-10M15 20v-2M3 20h18"/></svg>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Análisis de Desempeño</p>
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-manrope tracking-tight leading-none">
            {project?.name} <span className="text-muted block text-xl mt-2 font-medium tracking-normal">Centro de Inteligencia de Obra</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Estado de Tiempo" 
            value={`${stats.daysAhead} días de Adelanto`} 
            subtitle="Comparado con fecha de entrega" 
            color="border-green-500" 
            dotColor="bg-green-500"
          />
          <StatCard 
            title="Velocidad" 
            value={`${stats.velocity}% / día`} 
            subtitle="Ritmo de instalación ponderado" 
            color="border-brand-blue" 
          />
          <StatCard 
            title="Proyección" 
            value={stats.projection} 
            subtitle="Cierre estimado según ritmo" 
            color="border-brand-purple" 
          />
          <StatCard 
            title="Diferencia" 
            value={`${stats.difference}%`} 
            subtitle="Avance Real vs. Planificado" 
            color="border-accent" 
            accentValue={true}
          />
        </div>

        <div className="p-8 md:p-12 bg-card border border-card-border rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black font-manrope mb-2 tracking-tight">Evolución del Proyecto</h3>
            <p className="text-muted text-sm font-medium mb-12">Sincronización histórica de avances acumulados.</p>
            
            <div className="h-64 flex items-end gap-2 px-2">
              {[40, 45, 42, 55, 60, 64, 68, 72, 75, 80].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                  <div 
                    className="w-full bg-brand-blue/20 group-hover/bar:bg-brand-blue/40 transition-all rounded-t-lg relative"
                    style={{ height: `${h}%` }}
                  >
                    {i === 9 && (
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-[10px] font-black px-2 py-1 rounded shadow-lg">
                         ACTUAL
                       </div>
                    )}
                  </div>
                  <span className="text-[8px] font-black text-muted uppercase tracking-widest">Sem {i+1}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap gap-8 items-center pt-8 border-t border-card-border/50">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-brand-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Avance Real</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-brand-purple shadow-[0_0_10px_rgba(139,92,246,0.5)] opacity-50" />
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Planificado</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, subtitle, color, dotColor, accentValue }: any) {
  return (
    <div className={`p-8 bg-card border border-card-border border-l-[6px] ${color} rounded-[2.5rem] shadow-xl hover:translate-y-[-4px] transition-all group`}>
      <div className="flex justify-between items-start mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted">{title}</p>
        {dotColor && <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />}
      </div>
      <p className={`text-2xl md:text-3xl font-black font-manrope tracking-tight leading-tight mb-2 ${accentValue ? 'text-accent' : ''}`}>
        {value}
      </p>
      <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60 italic">{subtitle}</p>
    </div>
  );
}
