'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import FacadeModal from '@/components/FacadeModal';
import ProjectAnalytics from '@/components/ProjectAnalytics';
import { calculateProjectAnalytics } from '@/lib/analytics';

export default function ProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [project, setProject] = useState<any>(null);
  const [facades, setFacades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacade, setEditingFacade] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const fetchProjectWithFacadesProgress = useCallback(async () => {
    setLoading(true);
    
    try {
      // Fetch Project Info
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectData) setProject(projectData);

      // Fetch Facades
      const { data: facadesData } = await supabase
        .from('facades')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (facadesData) {
        // Calculate progress for each facade
        const facadesWithProgress = await Promise.all(facadesData.map(async (facade) => {
          const { data: modulesData } = await supabase
            .from('modules')
            .select('status')
            .eq('facade_id', facade.id);

          const modules = modulesData || [];
          const total = modules.length;
          const weightedProgress = total === 0 ? 0 : Math.round(
            (modules.filter(m => m.status === 'COMPLETED').length * 1 + 
             modules.filter(m => m.status === 'IN_PROGRESS').length * 0.5) / total * 100
          );
          
          return { ...facade, progress: weightedProgress };
        }));
        setFacades(facadesWithProgress);

        // Update Analytics
        const { data: allModules } = await supabase.from('modules').select('id, status').eq('project_id', projectId);
        if (projectData && allModules) {
          const analytics = calculateProjectAnalytics(projectData, allModules, []);
          setAnalyticsData(analytics);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectWithFacadesProgress();
  }, [fetchProjectWithFacadesProgress]);

  const handleSaveFacade = async (formData: any) => {
    if (editingFacade) {
      // UPDATE
      const { error } = await supabase
        .from('facades')
        .update(formData)
        .eq('id', editingFacade.id);

      if (error) {
        console.error('Error updating facade:', error);
        alert('Error al actualizar la fachada.');
      }
    } else {
      // INSERT
      const { error } = await supabase
        .from('facades')
        .insert([{ ...formData, project_id: projectId }]);

      if (error) {
        console.error('Error adding facade:', error);
        alert('Error al crear la fachada.');
      }
    }
    
    setIsModalOpen(false);
    setEditingFacade(null);
    fetchProjectWithFacadesProgress();
  };

  const handleDeleteFacade = async (e: React.MouseEvent, facadeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('¿Estás seguro de eliminar esta fachada? Se borrarán todos los módulos y el progreso asociado permanentemente.')) return;

    // 1. Delete Modules (Cascade)
    const { error: modError } = await supabase
      .from('modules')
      .delete()
      .eq('facade_id', facadeId);

    if (modError) {
      console.error('Error deleting modules:', modError);
      alert('Error al limpiar módulos.');
      return;
    }

    // 2. Delete Facade
    const { error: facError } = await supabase
      .from('facades')
      .delete()
      .eq('id', facadeId);

    if (facError) {
      console.error('Error deleting facade:', facError);
      alert('Error al eliminar la fachada.');
    } else {
      fetchProjectWithFacadesProgress();
    }
  };

  const handleEditFacade = (e: React.MouseEvent, facade: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingFacade(facade);
    setIsModalOpen(true);
  };

  if (loading && !project) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-pulse text-accent font-bold text-2xl tracking-[0.2em] font-manrope uppercase">Sincronizando Detalles...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-12 font-inter transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-12 flex justify-between items-center bg-card/40 border border-card-border p-4 rounded-2xl backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-2 text-muted hover:text-foreground transition-colors group px-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="font-black text-[10px] tracking-widest uppercase">Volver al Dashboard</span>
          </Link>
          <ThemeToggle />
        </nav>

        <header className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/5 border border-accent/10 rounded-full text-accent text-[10px] font-black tracking-[0.3em] uppercase">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              Sectorización de Obra
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black font-manrope tracking-tighter leading-tight line-clamp-2">
              {project?.name}
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center shrink-0 shadow-md text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-muted font-black mb-0.5">Ubicación Actual</p>
                  <p className="font-bold text-sm leading-tight">{project?.address || 'Sin dirección'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center shrink-0 shadow-md text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-muted font-black mb-0.5">Cierre de Proyecto</p>
                  <p className="font-black text-sm text-accent leading-tight">{project?.delivery_date || 'TBD'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative h-48 rounded-[2rem] overflow-hidden border-[8px] border-card shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] group">
            <img 
              src={project?.image_url || "https://images.unsplash.com/photo-1486406146926-c627a92fb1ab?q=80&w=2070&auto=format&fit=crop"} 
              alt={project?.name}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
        </header>

        {/* Analytics Section */}
        {analyticsData && (
          <section className="mb-24">
            <ProjectAnalytics data={analyticsData} />
          </section>
        )}

        <section className="space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-card-border pb-8 gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-black font-manrope tracking-tight">Estructura de Fachadas</h2>
              <p className="text-muted font-medium">Control modularizado por frentes de trabajo.</p>
            </div>
            <button 
              onClick={() => {
                setEditingFacade(null);
                setIsModalOpen(true);
              }}
              className="bg-foreground text-background font-black py-4 px-10 rounded-2xl hover:brightness-110 transition-all flex items-center gap-3 shadow-xl active:scale-95 uppercase tracking-widest text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Nueva Fachada</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {facades.map((facade) => (
              <div key={facade.id} className="relative group">
                <Link href={`/projects/${projectId}/facades/${facade.id}`} className="block h-full">
                  <div className="bg-card border border-card-border p-6 rounded-[1.5rem] hover:border-accent/40 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 relative overflow-hidden h-full flex flex-col justify-between group-hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-3">
                      <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-black font-manrope tracking-tight leading-tight group-hover:text-accent transition-colors truncate pr-2">
                          {facade.name}
                        </h3>
                        {/* Hidden context menu button or just always show edit/delete on hover */}
                      </div>
                      
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Avance Real</span>
                            <span className="text-lg font-black font-manrope text-accent">{facade.progress}%</span>
                          </div>
                          <div className="w-full bg-background border border-card-border h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-accent h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                              style={{ width: `${facade.progress}%` }} 
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="bg-background/40 p-3 rounded-2xl border border-card-border/50">
                            <p className="text-[9px] uppercase tracking-widest text-muted font-bold mb-1">Estructura</p>
                            <p className="text-xs font-bold">{facade.level_count} Niveles</p>
                          </div>
                          <div className="bg-background/40 p-3 rounded-2xl border border-card-border/50">
                            <p className="text-[9px] uppercase tracking-widest text-muted font-bold mb-1">Densidad</p>
                            <p className="text-xs font-bold">{facade.modules_per_level} Mod/Niv</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Actions Overlay for Hover */}
                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90 origin-left group-hover:scale-100 duration-300">
                  <button 
                    onClick={(e) => handleEditFacade(e, facade)}
                    className="p-3 bg-card border border-card-border rounded-xl text-muted hover:text-accent hover:border-accent/40 shadow-xl transition-all"
                    title="Editar Fachada"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                  <button 
                    onClick={(e) => handleDeleteFacade(e, facade.id)}
                    className="p-3 bg-card border border-card-border rounded-xl text-muted hover:text-red-500 hover:border-red-500/40 shadow-xl transition-all"
                    title="Eliminar Fachada"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
            ))}
            
            {facades.length === 0 && (
              <div className="col-span-full py-32 text-center border-[3px] border-dashed border-card-border/50 rounded-[3.5rem] bg-card/5 backdrop-blur-sm">
                <div className="w-20 h-20 bg-muted/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted opacity-40"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
                </div>
                <p className="text-muted font-bold tracking-widest uppercase text-[10px] opacity-60">Configuración Pendiente</p>
                <p className="text-lg font-medium text-muted mt-2">No se han registrado frentes de trabajo.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <FacadeModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFacade(null);
        }}
        onSave={handleSaveFacade}
        initialData={editingFacade}
      />
    </main>
  );
}
