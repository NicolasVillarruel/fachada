'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params?.id as string;
  const facadeId = params?.facadeId as string;

  const [project, setProject] = useState<any>(null);
  const [facades, setFacades] = useState<any[]>([]);
  const [isFacadesOpen, setIsFacadesOpen] = useState(true);

  useEffect(() => {
    if (projectId) {
      // Fetch Project Details
      supabase.from('projects').select('*').eq('id', projectId).single().then(({ data }) => {
        if (data) setProject(data);
      });

      // Fetch Facades list
      supabase.from('facades').select('*').eq('project_id', projectId).order('created_at', { ascending: true }).then(({ data }) => {
        if (data) setFacades(data);
      });
    } else {
      setProject(null);
      setFacades([]);
    }
  }, [projectId]);

  const isActive = (path: string) => pathname === path;
  const isProjectActive = (id: string) => projectId === id;

  return (
    <aside className="w-64 h-screen sticky top-0 bg-card/60 backdrop-blur-2xl border-r border-card-border flex flex-col z-[100] transition-all duration-500 overflow-hidden">
      {/* Brand Logo */}
      <div className="p-8 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M9 20v-10M15 20v-2M3 20h18"/></svg>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tighter uppercase font-manrope">Alumina</h1>
            <p className="text-[8px] font-black tracking-[0.3em] text-muted uppercase">Fachada Manager</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Global Navigation */}
        <div className="space-y-1">
          <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted mb-4">Plataforma</p>
          <Link 
            href="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${isActive('/') ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted hover:bg-muted/5 hover:text-foreground'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isActive('/') ? 'text-white' : 'text-muted group-hover:text-accent'}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
          </Link>
        </div>

        {/* Project Specific Navigation */}
        {projectId && (
          <div className="space-y-6 pt-6 border-t border-card-border/50 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="px-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted mb-4 italic">Obra en curso</p>
              <div className="bg-background/40 p-3 rounded-2xl border border-card-border/50 mb-6 drop-shadow-sm">
                <p className="text-[10px] font-black text-accent truncate">{project?.name || 'Sincronizando...'}</p>
                <Link href={`/projects/${projectId}`} className="text-[8px] font-black uppercase tracking-widest text-muted hover:text-foreground mt-1 block">Ver Resumen Proyecto</Link>
              </div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => setIsFacadesOpen(!isFacadesOpen)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/5 rounded-xl group transition-all"
              >
                <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] text-muted group-hover:text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <span>Fachadas</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform duration-300 ${isFacadesOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
              </button>

              {isFacadesOpen && (
                <div className="pl-6 space-y-1 animate-in slide-in-from-top-2 duration-300">
                  {facades.length > 0 ? (
                    facades.map((facade) => (
                      <Link 
                        key={facade.id}
                        href={`/projects/${projectId}/facades/${facade.id}`}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${facadeId === facade.id ? 'bg-accent/10 text-accent border border-accent/20' : 'text-muted hover:text-foreground hover:bg-muted/5'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${facadeId === facade.id ? 'bg-accent' : 'bg-muted/30'}`} />
                        <span className="truncate">{facade.name}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-2 text-[8px] font-bold text-muted/50 italic capitalize">Sin fachadas aún</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-4 space-y-1">
              <Link 
                href={`/projects/${projectId}/analytics`}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${pathname.includes('/analytics') ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-muted hover:bg-muted/5 hover:text-foreground'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={pathname.includes('/analytics') ? 'text-white' : 'text-muted group-hover:text-brand-blue'}><path d="M12 20v-6M9 20v-10M15 20v-2M3 20h18"/></svg>
                <span className="text-[10px] font-black uppercase tracking-widest">Estadísticas Obra</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <div className="p-6 border-t border-card-border/50 bg-card/40 flex items-center justify-between">
        <ThemeToggle />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/10 flex items-center justify-center text-[10px] font-black text-accent shadow-inner">NV</div>
        </div>
      </div>
    </aside>
  );
}
