'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import ProjectCard from '@/components/ProjectCard';
import ProjectModal from '@/components/ProjectModal';
import ThemeToggle from '@/components/ThemeToggle';

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAddProject = async (formData: any) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([formData])
      .select();

    if (error) {
      console.error('Error adding project:', error);
      alert('Error al crear el proyecto. Asegúrate de ejecutar el SQL en Supabase.');
    } else {
      setIsModalOpen(false);
      fetchProjects();
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-12 font-inter transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-manrope tracking-tight">
                Gestión de <span className="text-accent underline decoration-accent/30 underline-offset-8">Proyectos</span>
              </h1>
            </div>
            <p className="text-muted text-sm uppercase tracking-[0.2em] font-semibold">CONSTRUCTION TECH MANAGER • V2.0</p>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-accent hover:brightness-110 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-xl shadow-accent/20 transform hover:scale-105 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-card/50 animate-pulse rounded-3xl border border-card-border" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-card-border rounded-[2.5rem] bg-card/10 text-center backdrop-blur-sm">
             <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
             </div>
             <h2 className="text-2xl font-bold mb-3 opacity-80">No hay proyectos registrados</h2>
             <p className="text-muted mb-8 max-w-sm">
               Comienza creando tu primer proyecto de construcción para empezar a gestionar los avances de fachada.
             </p>
             <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-accent hover:brightness-110 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-accent/20"
             >
               🚀 Crear Mi Primer Proyecto
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id}
                id={project.id}
                name={project.name}
                address={project.address}
                start_date={project.start_date}
                delivery_date={project.delivery_date}
                image_url={project.image_url}
              />
            ))}
          </div>
        )}

        <footer className="mt-24 pt-10 border-t border-card-border/50 text-center">
          <p className="text-muted text-[10px] tracking-[0.3em] uppercase font-bold">
            Construction Tech Manager © 2026 • Intelligent Building Solutions
          </p>
        </footer>
      </div>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddProject}
      />
    </main>
  );
}
