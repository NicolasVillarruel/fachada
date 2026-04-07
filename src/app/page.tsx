'use client';

import React, { useState, useEffect, useCallback } from 'react';
import FacadeMap, { Module, ModuleStatus } from '@/components/FacadeMap';
import { supabase } from '@/lib/supabase';

const LEVELS = 10;
const MODS_PER_LEVEL = 15;

export default function Home() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch data from Supabase
  const fetchModules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('level_number', { ascending: false })
      .order('module_number', { ascending: true });

    if (error) {
      console.error('Error fetching modules:', error);
    } else {
      // Map DB fields to component interface if different
      const formattedModules: Module[] = (data || []).map(m => ({
        id: m.id,
        level_number: m.level_number,
        module_number: m.module_number,
        status: m.status as ModuleStatus,
      }));
      setModules(formattedModules);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchModules();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modules',
        },
        () => {
          fetchModules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchModules]);

  // Seed data if database is empty
  const handleInitializeBuilding = async () => {
    setIsInitializing(true);
    
    // First, verify if a project exists or create one
    let projectId = '';
    const { data: projectData } = await supabase.from('projects').select('id').limit(1).single();
    
    if (projectData) {
      projectId = projectData.id;
    } else {
      const { data: newProject } = await supabase
        .from('projects')
        .insert({ name: 'Torre Skyline Default', level_count: LEVELS, modules_per_level: MODS_PER_LEVEL })
        .select()
        .single();
      projectId = newProject?.id || '';
    }

    if (!projectId) return;

    const initialModules = [];
    for (let l = 1; l <= LEVELS; l++) {
      for (let m = 1; m <= MODS_PER_LEVEL; m++) {
        initialModules.push({
          project_id: projectId,
          level_number: l,
          module_number: m,
          status: 'PENDING',
        });
      }
    }

    const { error } = await supabase.from('modules').insert(initialModules);
    
    if (error) {
      console.error('Error seeding building:', error);
      alert('Error inicializando el edificio. Revisa el SQL Editor de Supabase.');
    } else {
      fetchModules();
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

    // Optimistic update locally
    setModules(prev => prev.map(m => (m.id === module.id ? { ...m, status: nextStatus } : m)));

    // Update Supabase
    const { error } = await supabase
      .from('modules')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', module.id);

    if (error) {
      console.error('Error updating module:', error);
      // Revert if error
      fetchModules();
    }
  };

  const progress = modules.length > 0
    ? Math.round((modules.filter((m) => m.status === 'COMPLETED').length / modules.length) * 100)
    : 0;

  if (loading && modules.length === 0) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
      <div className="animate-pulse text-2xl font-manrope">Sincronizando con Supabase...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-12 font-inter">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-manrope tracking-tight mb-2">
              Gestión de Avances <span className="text-blue-500">Murocortina</span>
            </h1>
            <p className="text-slate-400 text-lg uppercase tracking-tight">PROYECTO: TORRE SKYLINE - SINCRONIZADO</p>
          </div>
          
          <div className="flex flex-col items-end gap-2 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-xl">
            <span className="text-sm text-slate-400 uppercase tracking-widest font-semibold">Progreso Total (Real)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-manrope text-blue-400">{progress}%</span>
              <span className="text-slate-500">completado</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
              <div 
                className="bg-blue-500 h-full transition-all duration-1000 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        </header>

        {modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
             <h2 className="text-3xl font-bold mb-4 opacity-70">Tu Edificio está Vacío en Supabase</h2>
             <p className="text-slate-500 mb-8 max-w-md text-center">
               Detectamos que no hay módulos guardados. Haz clic abajo para generar los 150 módulos (10 pisos x 15) en tu base de datos.
             </p>
             <button 
              onClick={handleInitializeBuilding}
              disabled={isInitializing}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 px-10 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/20"
             >
               {isInitializing ? 'Generando Módulos...' : '🚀 Inicializar 150 Módulos en Supabase'}
             </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <FacadeMap 
                modules={modules} 
                onModuleClick={handleModuleClick} 
                levels={LEVELS} 
                modulesPerLevel={MODS_PER_LEVEL} 
              />
            </div>
            
            <aside className="space-y-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                <h3 className="text-xl font-bold font-manrope mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Estado en Vivo
                </h3>
                <ul className="space-y-4 text-slate-300 text-sm">
                  <li className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    Cambios guardados automáticamente en Supabase.
                  </li>
                  <li className="flex gap-3 text-slate-300">
                    <div className="space-y-2">
                      <p><span className="text-red-500 font-bold border-b border-red-900/50">Rojo:</span> Panel Pendiente</p>
                      <p><span className="text-amber-500 font-bold border-b border-amber-900/50">Amarillo:</span> Trabajo en Proceso</p>
                      <p><span className="text-green-500 font-bold border-b border-green-900/50">Verde:</span> Instalado / Terminado</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                <h3 className="text-xl font-bold font-manrope mb-4 border-b border-slate-800 pb-2">Métricas Supabase</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-slate-400">Total Paneles:</span>
                    <span className="font-bold text-lg">{modules.length}</span>
                  </div>
                  <div className="flex justify-between items-center bg-green-900/10 p-2 rounded-lg">
                    <span className="text-slate-400">Instalados:</span>
                    <span className="font-bold text-green-500 text-lg">{modules.filter(m => m.status === 'COMPLETED').length}</span>
                  </div>
                  <div className="flex justify-between items-center bg-amber-900/10 p-2 rounded-lg">
                    <span className="text-slate-400">En Proceso:</span>
                    <span className="font-bold text-amber-500 text-lg">{modules.filter(m => m.status === 'IN_PROGRESS').length}</span>
                  </div>
                  <div className="flex justify-between items-center bg-red-900/10 p-2 rounded-lg">
                    <span className="text-slate-400">Pendientes:</span>
                    <span className="font-bold text-red-500 text-lg">{modules.filter(m => m.status === 'PENDING').length}</span>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        )}
      </div>
      
      <div className="mt-20 pt-8 border-t border-slate-900 text-center text-slate-600 text-xs tracking-widest uppercase mb-12">
        Construction Tech Manager © 2026 - Control de Fachada con Supabase Real-time
      </div>
    </main>
  );
}
