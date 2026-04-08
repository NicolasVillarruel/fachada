'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { supabase } from '@/lib/supabase';
import FacadeMap, { Module, ModuleStatus } from '@/components/FacadeMap';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import ModuleActionsMenu from '@/components/ModuleActionsMenu';

export default function FacadeView({ params }: { params: Promise<{ id: string, facadeId: string }> }) {
  const { id: projectId, facadeId } = use(params);
  const [project, setProject] = useState<any>(null);
  const [facade, setFacade] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isMappingMode, setIsMappingMode] = useState(false);
  const [nextModuleInfo, setNextModuleInfo] = useState({ level: 1, module: 1 });
  const [selectedModule, setSelectedModule] = useState<{ module: Module, x: number, y: number } | null>(null);

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
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching modules:', error);
      } else {
        const formattedModules: Module[] = (modulesData || []).map(m => ({
          id: m.id,
          level_number: m.level_number,
          module_number: m.module_number,
          status: m.status as ModuleStatus,
          pos_x: m.pos_x,
          pos_y: m.pos_y,
        }));
        setModules(formattedModules);

        // Calculate next suggested numbers if applicable
        if (formattedModules.length > 0) {
          const last = formattedModules[formattedModules.length - 1];
          setNextModuleInfo({
            level: last.level_number,
            module: last.module_number + 1
          });
        }
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

  const handleImageClick = async (x: number, y: number) => {
    if (!isMappingMode || !facade) return;
    if (selectedModule) {
      setSelectedModule(null);
      return;
    }

    const newModule = {
      project_id: projectId,
      facade_id: facadeId,
      level_number: nextModuleInfo.level,
      module_number: nextModuleInfo.module,
      status: 'PENDING',
      pos_x: x,
      pos_y: y,
    };

    const { error } = await supabase.from('modules').insert([newModule]);
    
    if (error) {
      console.error('Error adding module:', error);
      alert(`Error DB: ${error.message}`);
    } else {
      setNextModuleInfo(prev => ({ ...prev, module: prev.module + 1 }));
      // Redundancy: fetch data manually immediately
      await fetchFacadeData();
    }
  };

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

  const handleModuleClick = (module: Module, e: React.MouseEvent) => {
    if (isMappingMode) return;
    
    // Calculate popover position
    setSelectedModule({
      module,
      x: e.clientX,
      y: e.clientY
    });
  };

  const updateModuleStatus = async (module: Module, nextStatus: ModuleStatus) => {
    setModules(prev => prev.map(m => (m.id === module.id ? { ...m, status: nextStatus } : m)));

    const { error: updateError } = await supabase
      .from('modules')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', module.id);

    if (updateError) {
      console.error('Error updating module:', updateError);
      fetchFacadeData();
      return;
    }

    await supabase.from('status_logs').insert([{
      module_id: module.id,
      old_status: module.status,
      new_status: nextStatus,
    }]);
    
    setSelectedModule(null);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('¿Eliminar este punto de la fachada?')) return;

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (error) {
      console.error('Error deleting module:', error);
      alert('Error al eliminar el módulo.');
    } else {
      setSelectedModule(null);
      // fetchFacadeData() is triggered by subscription
    }
  };

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
          <div className="flex items-center gap-6">
            {facade?.elevation_url && (
              <button 
                onClick={() => {
                  setIsMappingMode(!isMappingMode);
                  setSelectedModule(null);
                }}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  isMappingMode 
                  ? 'bg-accent text-white shadow-lg shadow-accent/30 ring-4 ring-accent/10' 
                  : 'bg-background border border-card-border hover:bg-muted/10'
                }`}
              >
                {isMappingMode ? '✓ Finalizar Identificación' : '⌖ Modo Identificación'}
              </button>
            )}
            <ThemeToggle />
          </div>
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
          
          <div className="flex flex-col items-end gap-2 p-5 bg-card border-l-4 border-brand-blue rounded-2xl shadow-xl backdrop-blur-2xl shrink-0 min-w-[240px]">
            <span className="text-[9px] text-foreground/60 uppercase tracking-[0.15em] font-black">Progreso Ponderado</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black font-manrope text-brand-blue tabular-nums tracking-tighter">{progress}%</span>
              <span className="text-muted font-black uppercase text-[8px] tracking-widest">Real</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 border border-card-border h-2 rounded-full overflow-hidden mt-1 p-0.5">
              <div 
                className="bg-brand-blue h-full rounded-full transition-all duration-1000 ease-out shadow-[0_2px_8px_rgba(29,58,132,0.2)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        </header>

        {isMappingMode && (
          <div className="mb-8 p-6 bg-accent/5 border-2 border-accent/20 rounded-[2rem] flex flex-wrap items-center justify-between gap-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M3 12h3m12 0h3M12 3v3m0 12v3"/></svg>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-accent">Configuración de Identificación</p>
                <p className="text-sm font-bold opacity-60">Haz clic en el plano para situar el módulo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 bg-background/50 p-3 rounded-2xl border border-card-border">
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-muted">Nivel Actual</label>
                <input 
                  type="number" 
                  value={nextModuleInfo.level}
                  onChange={(e) => setNextModuleInfo({...nextModuleInfo, level: parseInt(e.target.value)})}
                  className="w-20 bg-transparent font-black text-xl border-b border-card-border focus:border-accent outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase tracking-widest text-muted">Siguiente Módulo</label>
                <input 
                  type="number" 
                  value={nextModuleInfo.module}
                  onChange={(e) => setNextModuleInfo({...nextModuleInfo, module: parseInt(e.target.value)})}
                  className="w-20 bg-transparent font-black text-xl border-b border-card-border focus:border-accent outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {modules.length === 0 && !facade?.elevation_url ? (
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
                {isInitializing ? 'INICIALIZANDO...' : 'INICIALIZAR FACHADA'}
             </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3 overflow-hidden">
              <FacadeMap 
                modules={modules} 
                onModuleClick={handleModuleClick} 
                onImageClick={handleImageClick}
                levels={facade?.level_count} 
                modulesPerLevel={facade?.modules_per_level} 
                elevationUrl={facade?.elevation_url}
                isMappingMode={isMappingMode}
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
                      <p className="text-xs font-black uppercase tracking-widest italic text-muted">Pendiente</p>
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
                      <p className="text-xs font-black uppercase tracking-widest italic text-green-500">Terminado</p>
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

              {/* Diagnostic Panel - TEMPORARY */}
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl">
                <p className="text-[10px] font-black uppercase text-red-500 mb-2">Monitor Diagnóstico</p>
                <div className="space-y-2 font-mono text-[8px] opacity-70">
                  <p>FID: {facadeId}</p>
                  <p>MODS: {modules.length}</p>
                  <p>SYC: {isMappingMode ? 'MAPPING' : 'VIEWING'}</p>
                </div>
              </div>
              
            </aside>
          </section>
        )}
      </div>

      {selectedModule && (
        <ModuleActionsMenu 
          module={selectedModule.module}
          position={{ x: selectedModule.x, y: selectedModule.y }}
          onStatusChange={(status) => updateModuleStatus(selectedModule.module, status)}
          onDelete={() => handleDeleteModule(selectedModule.module.id)}
          onClose={() => setSelectedModule(null)}
        />
      )}
    </main>
  );
}
