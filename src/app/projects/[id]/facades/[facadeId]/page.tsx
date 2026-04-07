'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { supabase } from '@/lib/supabase';
import FacadeMap, { Module, ModuleStatus } from '@/components/FacadeMap';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function FacadeView({ params }: { params: Promise<{ id: string, facadeId: string }> }) {
  const { id: projectId, facadeId } = use(params);
  const [project, setProject] = useState<any>(null);
  const [facade, setFacade] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  const fetchFacadeData = useCallback(async () => {
    setLoading(true);
    
    // Fetch Project
    const { data: projectData } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (projectData) setProject(projectData);

    // Fetch Facade
    const { data: facadeData } = await supabase.from('facades').select('*').eq('id', facadeId).single();
    if (facadeData) {
      setFacade(facadeData);
      
      // Fetch Modules
      const { data: modulesData, error } = await supabase
        .from('modules')
        .select('*')
        .eq('facade_id', facadeId)
        .order('level_number', { ascending: false })
        .order('module_number', { ascending: true });

      if (error) {
        console.error('Error fetching modules:', error);
      } else {
        const formattedModules: Module[] = (modulesData || []).map(m => ({
          id: m.id,
          level_number: m.level_number,
          module_number: m.module_number,
          status: m.status as ModuleStatus,
        }));
        setModules(formattedModules);
      }
    }
    setLoading(false);
  }, [projectId, facadeId]);

  useEffect(() => {
    fetchFacadeData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`facade-${facadeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modules',
          filter: `facade_id=eq.${facadeId}`
        },
        () => {
          fetchFacadeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFacadeData, facadeId]);

  const handleInitializeFacade = async () => {
    if (!facade) return;
    setIsInitializing(true);
    
    const initialModules = [];
    for (let l = 1; l <= facade.level_count; l++) {
      for (let m = 1; m <= facade.modules_per_level; m++) {
        initialModules.push({
          project_id: projectId,
          facade_id: facadeId,
          level_number: l,
          module_number: m,
          status: 'PENDING',
        });
      }
    }

    const { error } = await supabase.from('modules').insert(initialModules);
    
    if (error) {
      console.error('Error seeding facade:', error);
      alert('Error inicializando la fachada.');
    } else {
      fetchFacadeData();
    }
    setIsInitializing(false);
  };

  const handleModuleClick = async (module: Module) => {
    const nextStatusMap: Record<ModuleStatus, ModuleStatus> = {
      PENDING: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
      COMPLETED: 'PENDING',
    };
    const nextStatus = nextStatusMap[module.status];

    // Optimistic update
    setModules(prev => prev.map(m => (m.id === module.id ? { ...m, status: nextStatus } : m)));

    // Update Supabase
    const { error: updateError } = await supabase
      .from('modules')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', module.id);

    if (updateError) {
      console.error('Error updating module:', updateError);
      fetchFacadeData(); // Revert on error
      return;
    }

    // Log the change in status_logs
    const { error: logError } = await supabase
      .from('status_logs')
      .insert([
        {
          module_id: module.id,
          old_status: module.status,
          new_status: nextStatus,
        }
      ]);

    if (logError) {
      console.error('Error creating status log:', logError);
      // We don't revert the status update even if logging fails, 
      // but we log the error for debugging.
    }
  };

  // Weighted formula: (Completed * 1 + InProgress * 0.5) / Total
  const calculateProgress = () => {
    if (modules.length === 0) return 0;
    const completed = modules.filter((m) => m.status === 'COMPLETED').length;
    const inProgress = modules.filter((m) => m.status === 'IN_PROGRESS').length;
    const total = modules.length;
    return Math.round(((completed * 1) + (inProgress * 0.5)) / total * 100);
  };

  const progress = calculateProgress();

  if (loading && !facade) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-pulse text-accent font-bold text-2xl tracking-[0.2em] font-manrope">SYNCHRONIZING MAP...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-12 font-inter transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-12 flex justify-between items-center bg-card/40 border border-card-border p-4 rounded-2xl backdrop-blur-sm">
          <Link href={`/projects/${projectId}`} className="flex items-center gap-2 text-muted hover:text-foreground transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="font-bold text-[10px] tracking-widest uppercase">Volver al Proyecto</span>
          </Link>
          <ThemeToggle />
        </nav>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase text-accent font-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>{project?.name}</span>
              <span className="text-muted opacity-30">/</span>
              <span>Fachada</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-manrope tracking-tight leading-none truncate max-w-2xl">
              {facade?.name}
            </h1>
            <p className="text-muted font-medium text-sm">Panel de control de instalación y seguimiento técnico.</p>
          </div>
          
          <div className="flex flex-col items-end gap-3 p-6 bg-card border-l-8 border-brand-blue rounded-[2rem] shadow-2xl backdrop-blur-2xl shrink-0 min-w-[300px]">
            <span className="text-[10px] text-foreground/60 uppercase tracking-[0.2em] font-black">Progreso Ponderado</span>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black font-manrope text-brand-blue tabular-nums tracking-tighter">{progress}%</span>
              <span className="text-muted font-black uppercase text-[10px] tracking-widest">Real</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 border border-card-border h-3.5 rounded-full overflow-hidden mt-2 p-0.5">
              <div 
                className="bg-brand-blue h-full rounded-full transition-all duration-1000 ease-out shadow-[0_4px_12px_rgba(29,58,132,0.3)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        </header>

        {modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 border-[3px] border-dashed border-card-border/50 rounded-[4rem] bg-card/5">
             <div className="w-24 h-24 mb-8 bg-accent/10 rounded-[2.5rem] flex items-center justify-center border border-accent/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
             </div>
             <h2 className="text-3xl font-black mb-4 font-manrope">Fachada Desocupada</h2>
             <p className="text-muted mb-10 max-w-md text-center text-lg leading-relaxed font-medium">
               Genera automáticamente la malla de <span className="text-foreground font-bold">{facade?.level_count * facade?.modules_per_level}</span> módulos para este sector del edificio.
             </p>
             <button 
              onClick={handleInitializeFacade}
              disabled={isInitializing}
              className="bg-accent hover:brightness-110 disabled:bg-muted text-white font-black py-4 px-12 rounded-2xl transition-all shadow-[0_20px_40px_rgba(59,130,246,0.25)] active:scale-95 flex items-center gap-4 uppercase tracking-[0.2em] text-xs"
             >
               {isInitializing ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               ) : (
                 <>
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                   <span>Inicializar Fachada</span>
                 </>
               )}
             </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3">
              <FacadeMap 
                modules={modules} 
                onModuleClick={handleModuleClick} 
                levels={facade?.level_count} 
                modulesPerLevel={facade?.modules_per_level} 
              />
            </div>
            
            <aside className="space-y-8">
              <div className="p-8 bg-card border border-card-border rounded-[2.5rem] shadow-2xl">
                <h3 className="text-xl font-bold font-manrope mb-8 border-b border-card-border pb-4 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> 
                  <span className="uppercase tracking-widest text-xs font-black">Sincronización</span>
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-module-pending border-2 border-white/50 shadow-lg group-hover:scale-110 transition-transform" />
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest italic">Pendiente</p>
                      <p className="text-[10px] text-muted font-bold">Módulo no iniciado (0 pts)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-module-progress border-2 border-white/50 shadow-lg group-hover:scale-110 transition-transform" />
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest italic text-amber-500">En Ejecución</p>
                      <p className="text-[10px] text-muted font-bold">Instalación activa (0.5 pts)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-module-completed border-2 border-white/50 shadow-lg group-hover:scale-110 transition-transform" />
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest italic text-green-500">Certificado</p>
                      <p className="text-[10px] text-muted font-bold">Listo para entrega (1.0 pts)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-card border border-card-border rounded-[2.5rem] shadow-2xl">
                <h3 className="text-xl font-bold font-manrope mb-8 border-b border-card-border pb-4 uppercase tracking-widest text-xs font-black">Estadísticas</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-background/50 border border-card-border">
                    <span className="text-[10px] uppercase tracking-widest font-black text-muted">Total Unidades</span>
                    <span className="font-black text-2xl tabular-nums">{modules.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                    <span className="text-[10px] uppercase tracking-widest font-black text-green-500/80">Terminados</span>
                    <span className="font-black text-2xl tabular-nums text-green-500">{modules.filter(m => m.status === 'COMPLETED').length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <span className="text-[10px] uppercase tracking-widest font-black text-amber-500/80">En Proceso</span>
                    <span className="font-black text-2xl tabular-nums text-amber-500">{modules.filter(m => m.status === 'IN_PROGRESS').length}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-accent rounded-[2rem] text-white shadow-[0_20px_40px_rgba(59,130,246,0.2)]">
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-80">Info Técnica</p>
                </div>
                <p className="text-sm font-bold leading-relaxed">
                  El cálculo de avance considera los módulos en proceso como un 50% de unidad terminada para una métrica más precisa del esfuerzo en obra.
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
