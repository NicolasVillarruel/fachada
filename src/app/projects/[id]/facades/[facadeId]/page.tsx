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
        .order('level_number', { ascending: true })
        .order('module_number', { ascending: true });

      if (error) {
        console.error('Error fetching modules:', error);
      } else {
        if (modulesData && modulesData.length > 0) {
          console.log("Modules found:", modulesData.length);
        }
        
        const formattedModules: Module[] = (modulesData || []).map(m => ({
          id: m.id,
          level_number: m.level_number,
          module_number: m.module_number,
          status: m.status as ModuleStatus,
          pos_x: m.pos_x,
          pos_y: m.pos_y,
          display_name: m.display_name,
          dimensions: m.dimensions,
          color_code: m.color_code,
          blueprint_url: m.blueprint_url,
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
    } else {
      console.warn("No se encontró la fachada con el ID proporcionado.");
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

    // alert(`Coordenadas capturadas: X:${x.toFixed(1)} Y:${y.toFixed(1)}`);

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
      alert(`Error al guardar: ${error.message}`);
    } else {
      setNextModuleInfo(prev => ({ ...prev, module: prev.module + 1 }));
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
    
    // update current selected module to reflect changes immediately
    setSelectedModule(prev => prev ? { ...prev, module: { ...prev.module, status: nextStatus } } : null);
  };

  const updateModuleMetadata = async (moduleId: string, metadata: Partial<Module>, file?: File) => {
    let finalMetadata = { ...metadata };

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${moduleId}_${Date.now()}.${fileExt}`;
      const filePath = `${projectId}/modules/${moduleId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('facade-plans')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading module blueprint:', uploadError);
        alert('Error al subir el plano.');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('facade-plans')
        .getPublicUrl(filePath);
      
      finalMetadata.blueprint_url = publicUrl;
    }

    const { error } = await supabase
      .from('modules')
      .update(finalMetadata)
      .eq('id', moduleId);

    if (error) {
      console.error('Error updating metadata:', error);
      alert('Error al guardar los detalles.');
    } else {
      fetchFacadeData();
      // Also update selected module if it's the one we're editing
      setSelectedModule(prev => prev && prev.module.id === moduleId ? { ...prev, module: { ...prev.module, ...finalMetadata } } : prev);
    }
  };

  const handleModuleMove = async (moduleId: string, x: number, y: number) => {
    // Update local state for immediate feedback
    setModules(prev => prev.map(m => (m.id === moduleId ? { ...m, pos_x: x, pos_y: y } : m)));

    const { error } = await supabase
      .from('modules')
      .update({ pos_x: x, pos_y: y })
      .eq('id', moduleId);

    if (error) {
      console.error('Error moving module:', error);
      fetchFacadeData();
    }
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
      await fetchFacadeData();
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
    <main className="p-4 md:pt-6 md:pb-12 font-inter">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-[9px] tracking-[0.3em] uppercase text-accent font-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>{project?.name}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-manrope tracking-tight leading-none truncate max-w-2xl">
              {facade?.name}
            </h1>
          </div>
          
          <div className="flex flex-col items-end gap-2 p-4 bg-card border border-card-border rounded-3xl shadow-2xl backdrop-blur-3xl shrink-0 min-w-[240px] relative overflow-hidden group/card shadow-accent/5">
            <div className="absolute top-[-20%] right-[-10%] opacity-[0.03] group-hover/card:opacity-[0.08] transition-opacity pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4M12 16V8"/></svg>
            </div>
            
            <div className="w-full flex justify-between items-center mb-0.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7"/><path d="m9 11 3 3L22 4"/><path d="m22 10V4h-6"/></svg>
                </div>
                <span className="text-[9px] text-foreground/60 uppercase tracking-[0.2em] font-black">Progreso Real</span>
              </div>
              <span className="text-2xl font-black font-manrope text-brand-blue tabular-nums tracking-tighter">{progress}%</span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-900 border border-card-border h-2.5 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-gradient-to-r from-brand-blue/80 to-brand-blue h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        </div>

        {isMappingMode && (
          <div className="mb-4 flex items-center justify-between gap-4 p-2 px-4 bg-accent/5 border border-accent/10 rounded-2xl animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M3 12h3m12 0h3M12 3v3m0 12v3"/></svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-accent/80">
                Haz clic en el plano para situar módulos
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted">Nivel:</span>
                <input 
                  type="number" 
                  value={nextModuleInfo.level}
                  onChange={(e) => setNextModuleInfo({...nextModuleInfo, level: parseInt(e.target.value)})}
                  className="w-12 bg-background/50 border border-card-border rounded-lg px-2 py-1 text-xs font-black outline-none focus:border-accent text-center"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted">Módulo:</span>
                <input 
                  type="number" 
                  value={nextModuleInfo.module}
                  onChange={(e) => setNextModuleInfo({...nextModuleInfo, module: parseInt(e.target.value)})}
                  className="w-12 bg-background/50 border border-card-border rounded-lg px-2 py-1 text-xs font-black outline-none focus:border-accent text-center"
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
          <section className="w-full">
            <div className="w-full">
              <div className="mb-4 flex justify-between items-center px-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent opacity-50"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/></svg>
                  Plano de Elevación
                </h2>
                {facade?.elevation_url && (
                  <button 
                    onClick={() => {
                      setIsMappingMode(!isMappingMode);
                      setSelectedModule(null);
                    }}
                    className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                      isMappingMode 
                      ? 'bg-accent text-white shadow-accent/20 scale-95 ring-4 ring-accent/5' 
                      : 'bg-foreground text-background hover:brightness-110'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={isMappingMode ? 'animate-spin' : ''}><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                    {isMappingMode ? 'Finalizar Mapeo' : 'Modo Identificación'}
                  </button>
                )}
              </div>
              <div className="overflow-hidden rounded-[2.5rem] border border-card-border/50 bg-card/20 shadow-inner">
                <FacadeMap 
                  modules={modules} 
                  onModuleClick={handleModuleClick} 
                  onImageClick={handleImageClick}
                  onModuleMove={handleModuleMove}
                  levels={facade?.level_count} 
                  modulesPerLevel={facade?.modules_per_level} 
                  elevationUrl={facade?.elevation_url}
                  isMappingMode={isMappingMode}
                />
              </div>
            </div>
          </section>
        )}
      </div>

      {selectedModule && (
        <ModuleActionsMenu 
          module={selectedModule.module}
          position={{ x: selectedModule.x, y: selectedModule.y }}
          onStatusChange={(status) => {
            if (selectedModule) updateModuleStatus(selectedModule.module, status);
          }}
          onUpdateMetadata={(metadata: Partial<Module>, file?: File) => {
            if (selectedModule) updateModuleMetadata(selectedModule.module.id, metadata, file);
          }}
          onDelete={() => {
            if (selectedModule) handleDeleteModule(selectedModule.module.id);
          }}
          onClose={() => setSelectedModule(null)}
        />
      )}
    </main>
  );
}
