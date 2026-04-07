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
    const { error } = await supabase
      .from('modules')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', module.id);

    if (error) {
      console.error('Error updating module:', error);
      fetchFacadeData(); // Revert on error
    }
  };

  const progress = modules.length > 0
    ? Math.round((modules.filter((m) => m.status === 'COMPLETED').length / modules.length) * 100)
    : 0;

  if (loading && !facade) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-pulse text-accent font-bold text-2xl tracking-[0.2em] font-manrope">CARGANDO MAPA...</div>
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
            <span className="font-bold text-sm tracking-widest uppercase">Volver al Proyecto</span>
          </Link>
          <ThemeToggle />
        </nav>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div className="space-y-2">
            <div className="flex gap-2 text-[10px] tracking-widest uppercase text-accent font-bold">
              <span>{project?.name}</span>
              <span className="text-muted opacity-50">/</span>
              <span>Fachada</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold font-manrope tracking-tight">
              {facade?.name}
            </h1>
            <p className="text-muted font-medium">Gestión de avance de instalación de módulos por nivel.</p>
          </div>
          
          <div className="flex flex-col items-end gap-3 p-6 bg-card border border-card-border rounded-3xl shadow-xl backdrop-blur-xl shrink-0 min-w-[280px]">
            <span className="text-sm text-foreground/60 uppercase tracking-widest font-bold">Progreso de Fachada</span>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black font-manrope text-accent">{progress}%</span>
              <span className="text-muted font-bold">Instalado</span>
            </div>
            <div className="w-full bg-background border border-card-border h-3 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-accent h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        </header>

        {modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-card-border rounded-[3rem] bg-card/5">
             <div className="w-24 h-24 mb-6 bg-accent/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent underline decoration-accent/30"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
             </div>
             <h2 className="text-2xl font-bold mb-4 opacity-80">La fachada está vacía</h2>
             <p className="text-muted mb-8 max-w-md text-center">
               Esta fachada aún no tiene módulos registrados. Haz clic abajo para generar automáticamente los {facade?.level_count * facade?.modules_per_level} módulos configurados.
             </p>
             <button 
              onClick={handleInitializeFacade}
              disabled={isInitializing}
              className="bg-accent hover:brightness-110 disabled:bg-muted text-white font-bold py-4 px-12 rounded-2xl transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center gap-3"
             >
               {isInitializing ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               ) : '🚀 Inicializar Módulos'}
             </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <FacadeMap 
                modules={modules} 
                onModuleClick={handleModuleClick} 
                levels={facade?.level_count} 
                modulesPerLevel={facade?.modules_per_level} 
              />
            </div>
            
            <aside className="space-y-6">
              <div className="p-6 bg-card border border-card-border rounded-3xl shadow-xl">
                <h3 className="text-xl font-bold font-manrope mb-6 border-b border-card-border pb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Estado en Vivo
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-module-pending border-2 border-white shadow-lg transition-transform group-hover:scale-110" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">No Instalado</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted">Pendiente de inicio</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-module-progress border-2 border-white shadow-lg transition-transform group-hover:scale-110" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">En Proceso</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted">Instalación activa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-module-completed border-2 border-white shadow-lg transition-transform group-hover:scale-110" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">Instalado</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted">Módulo terminado</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card border border-card-border rounded-3xl shadow-xl">
                <h3 className="text-xl font-bold font-manrope mb-6 border-b border-card-border pb-3">Resumen Métrico</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-background/50 border border-card-border">
                    <span className="text-xs uppercase tracking-widest font-bold text-muted">Total</span>
                    <span className="font-black text-xl">{modules.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-green-500/5 border border-green-500/10">
                    <span className="text-xs uppercase tracking-widest font-bold text-green-500/80">Listos</span>
                    <span className="font-black text-xl text-green-500">{modules.filter(m => m.status === 'COMPLETED').length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <span className="text-xs uppercase tracking-widest font-bold text-amber-500/80">Activos</span>
                    <span className="font-black text-xl text-amber-500">{modules.filter(m => m.status === 'IN_PROGRESS').length}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-accent rounded-3xl text-white shadow-xl shadow-accent/20">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">Nota de Control</p>
                <p className="text-sm font-medium leading-relaxed">
                  Los cambios se sincronizan en tiempo real con la nube para todo el equipo de obra.
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
