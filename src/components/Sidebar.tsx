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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  // Close sidebar on navigation (for mobile)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-[110] w-14 h-14 bg-accent text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </button>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-[101] animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        w-64 h-screen fixed lg:sticky top-0 left-0 bg-card/60 backdrop-blur-2xl border-r border-card-border flex flex-col z-[102] transition-all duration-500 overflow-hidden
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Logo */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M9 8h1"/><path d="M9 12h1"/><path d="M9 16h1"/><path d="M14 8h1"/><path d="M14 12h1"/><path d="M14 16h1"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter uppercase font-manrope">Nicomax</h1>
              <p className="text-[8px] font-black tracking-[0.2em] text-muted uppercase">Monitoreo de Obras</p>
            </div>
          </Link>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-2 text-muted hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Global Navigation */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-3">Plataforma</p>
            <Link 
              href="/"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all group ${isActive('/') ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted hover:bg-muted/5 hover:text-foreground'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isActive('/') ? 'text-white' : 'text-muted group-hover:text-accent'}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span className="text-[11px] font-black uppercase tracking-widest">Dashboard</span>
            </Link>
          </div>

          {/* Project Specific Navigation */}
          {projectId && (
            <div className="space-y-4 pt-4 border-t border-card-border/50 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="px-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-3 italic">Obra en curso</p>
                <div className="bg-background/40 p-3 rounded-2xl border border-card-border/50 mb-6 drop-shadow-sm">
                  <p className="text-[11px] font-black text-accent truncate">{project?.name || 'Sincronizando...'}</p>
                  <Link href={`/projects/${projectId}`} className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground mt-1 block">Ver Resumen Proyecto</Link>
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
                      <p className="px-4 py-2 text-[10px] font-bold text-muted/50 italic capitalize">Sin fachadas aún</p>
                    )}
                  </div>
                )}
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
    </>
  );
}
