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
  const [editingProject, setEditingProject] = useState<any>(null);

  const fetchProjectsWithProgress = useCallback(async () => {
    setLoading(true);
    
    // 1. Fetch all projects
    const { data: projectsData, error: projError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projError) {
      console.error('Error fetching projects:', projError);
      setLoading(false);
      return;
    }

    // 2. For each project, fetch modules across all facades to calculate weighted progress
    const projectsWithProgress = await Promise.all((projectsData || []).map(async (project) => {
      const { data: modulesData } = await supabase
        .from('modules')
        .select('status')
        .eq('project_id', project.id);

      const modules = modulesData || [];
      const total = modules.length;
      
      if (total === 0) return { ...project, progress: 0 };

      const completed = modules.filter(m => m.status === 'COMPLETED').length;
      const inProgress = modules.filter(m => m.status === 'IN_PROGRESS').length;

      // Weighted formula: (Completed * 1 + InProgress * 0.5) / Total
      const weightedProgress = Math.round(((completed * 1) + (inProgress * 0.5)) / total * 100);
      
      return { ...project, progress: weightedProgress };
    }));

    setProjects(projectsWithProgress);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjectsWithProgress();
  }, [fetchProjectsWithProgress]);

  const handleSaveProject = async (formData: any, imageFile?: File | null) => {
    let imageUrl = formData.image_url;

    // Handle Image Upload to Supabase Storage
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        alert('Error al subir la imagen. Verifica que el bucket "avatars" sea público.');
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      }
    }

    const payload = { ...formData, image_url: imageUrl };

    if (editingProject) {
      // UPDATE
      const { error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', editingProject.id);

      if (error) {
        console.error('Error updating project:', error);
        alert('Error al actualizar el proyecto.');
      }
    } else {
      // INSERT
      const { error } = await supabase
        .from('projects')
        .insert([payload]);

      if (error) {
        console.error('Error adding project:', error);
        alert('Error al crear el proyecto.');
      }
    }

    setIsModalOpen(false);
    setEditingProject(null);
    fetchProjectsWithProgress();
  };

  const openEditModal = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setEditingProject(project);
      setIsModalOpen(true);
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-12 font-inter transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-purple)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-manrope tracking-tight">
                Gestión de <span className="underline decoration-accent/30 underline-offset-8">Proyectos</span>
              </h1>
            </div>
            <p className="text-muted text-[10px] uppercase tracking-[0.4em] font-black opacity-60 ml-1">Building Progress Ecosystem</p>
          </div>
          
          <button 
            onClick={openCreateModal}
            className="group flex items-center gap-3 bg-foreground text-background font-bold py-3.5 px-7 rounded-[1.25rem] transition-all shadow-2xl hover:brightness-110 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-300"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="uppercase text-xs tracking-widest">Nuevo Proyecto</span>
          </button>
        </header>

        {loading && projects.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-card/40 rounded-[2.5rem] border border-card-border animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 border-[3px] border-dashed border-card-border/50 rounded-[3.5rem] bg-card/10 text-center backdrop-blur-xl">
             <div className="w-24 h-24 bg-accent/5 rounded-full flex items-center justify-center mb-8 border border-accent/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-accent opacity-50"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
             </div>
             <h2 className="text-3xl font-bold mb-4 font-manrope">Sin proyectos activos</h2>
             <p className="text-muted mb-10 max-w-sm text-lg leading-relaxed font-medium">
               Comienza digitando los datos de tu primera obra para centralizar el control de fachada.
             </p>
             <button 
              onClick={openCreateModal}
              className="bg-accent text-white font-black py-4 px-12 rounded-2xl transition-all shadow-[0_20px_40px_rgba(59,130,246,0.25)] hover:brightness-110 uppercase tracking-widest text-xs"
             >
               <div className="flex items-center justify-center gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1.5 group-hover:-translate-y-1.5 transition-transform"><path d="m2 22 7-7"/><path d="M9 3v1h1"/><path d="M10 15v1h1"/><path d="M11 8V7h1"/><path d="M12 11V10h1"/><path d="M13 14V13h1"/><path d="M14 17V16h1"/><path d="M15 4V3h1"/><path d="M15 19v1h1"/><path d="M16 8V7h1"/><path d="M17 11V10h1"/><path d="M18 14V13h1"/><path d="M19 17V16h1"/><path d="M20 4V3h1"/><path d="M20 19v1h1"/><path d="m3 3 3 2 2 3 6 8 8-2-3-3-3-2-8-6-2-3z"/></svg>
                 <span>Inicializar Ecosistema</span>
               </div>
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {projects.map((project, index) => (
              <ProjectCard 
                key={project.id}
                id={project.id}
                name={project.name}
                address={project.address}
                start_date={project.start_date}
                delivery_date={project.delivery_date}
                image_url={project.image_url}
                progress={project.progress}
                onEdit={openEditModal}
                index={index}
              />
            ))}
          </div>
        )}

        <footer className="mt-32 pt-12 border-t border-card-border/30 text-center pb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1 rounded-full bg-card border border-card-border">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Status: Real-time Synchronized</span>
          </div>
          <p className="text-muted text-[10px] tracking-[0.5em] uppercase font-black opacity-30">
            Intelligent Solutions • 2026
          </p>
        </footer>
      </div>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        initialData={editingProject}
      />
    </main>
  );
}
