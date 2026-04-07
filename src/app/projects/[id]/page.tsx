'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import FacadeModal from '@/components/FacadeModal';

export default function ProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [project, setProject] = useState<any>(null);
  const [facades, setFacades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjectInfo = useCallback(async () => {
    setLoading(true);
    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectData) {
      setProject(projectData);
    }

    const { data: facadesData } = await supabase
      .from('facades')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    setFacades(facadesData || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchProjectInfo();
  }, [fetchProjectInfo]);

  const handleAddFacade = async (formData: any) => {
    const { data, error } = await supabase
      .from('facades')
      .insert([{ ...formData, project_id: projectId }])
      .select();

    if (error) {
      console.error('Error adding facade:', error);
      alert('Error al crear la fachada.');
    } else {
      setIsModalOpen(false);
      fetchProjectInfo();
    }
  };

  if (loading && !project) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-pulse text-accent font-bold text-2xl tracking-[0.2em] font-manrope">CARGANDO PROYECTO...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-12 font-inter transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-12 flex justify-between items-center bg-card/40 border border-card-border p-4 rounded-2xl backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-2 text-muted hover:text-foreground transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="font-bold text-sm tracking-widest uppercase">Volver al Dashboard</span>
          </Link>
          <ThemeToggle />
        </nav>

        <header className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-bold tracking-[0.2em] uppercase">
              DETALLE DEL PROYECTO
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-manrope tracking-tight leading-tight">
              {project?.name}
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-muted font-bold">Ubicación</p>
                  <p className="font-medium">{project?.address || 'Sin dirección registrada'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-muted font-bold">Entrega Estimada</p>
                  <p className="font-medium text-accent">{project?.delivery_date || 'TBD'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block relative h-64 rounded-[3rem] overflow-hidden border-[10px] border-card shadow-2xl">
            <img 
              src={project?.image_url || "https://images.unsplash.com/photo-1486406146926-c627a92fb1ab?q=80&w=2070&auto=format&fit=crop"} 
              alt={project?.name}
              className="w-full h-full object-cover"
            />
          </div>
        </header>

        <section className="space-y-8">
          <div className="flex justify-between items-end border-b border-card-border pb-6">
            <div>
              <h2 className="text-2xl font-bold font-manrope">Fachadas del Edificio</h2>
              <p className="text-muted text-sm mt-1">Selecciona una fachada para gestionar sus paneles.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-foreground text-background font-bold py-3 px-8 rounded-2xl hover:brightness-110 transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Agregar Fachada</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facades.map((facade) => (
              <Link 
                key={facade.id} 
                href={`/projects/${projectId}/facades/${facade.id}`}
                className="group"
              >
                <div className="bg-card border border-card-border p-6 rounded-3xl hover:border-accent hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent underline"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>
                  <h3 className="text-xl font-bold mb-4 font-manrope">{facade.name}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted uppercase tracking-widest text-[10px] font-bold">Configuración</span>
                      <span className="font-semibold">{facade.level_count} Niveles × {facade.modules_per_level} Módulos</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted uppercase tracking-widest text-[10px] font-bold">Total Paneles</span>
                      <span className="px-2.5 py-0.5 bg-accent/10 text-accent rounded-full font-bold">{facade.level_count * facade.modules_per_level}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {facades.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-card-border rounded-3xl bg-card/5">
                <p className="text-muted font-medium opacity-60">Aún no hay fachadas configuradas para este proyecto.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <FacadeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddFacade}
      />
    </main>
  );
}
