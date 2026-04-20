'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import FacadeModal from '@/components/FacadeModal';
import ProjectAnalytics from '@/components/ProjectAnalytics';
import { calculateProjectAnalytics } from '@/lib/analytics';

import { jsPDF } from 'jspdf';


export default function ProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [project, setProject] = useState<any>(null);
  const [facades, setFacades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacade, setEditingFacade] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

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
          const pending = modules.filter(m => m.status === 'PENDING').length;
          const progressCount = modules.filter(m => m.status === 'IN_PROGRESS').length;
          const completed = modules.filter(m => m.status === 'COMPLETED').length;
          
          const weightedProgress = total === 0 ? 0 : Math.round(
            (completed * 1 + progressCount * 0.5) / total * 100
          );
          
          return { 
            ...facade, 
            progress: weightedProgress,
            stats: { total, pending, inProgress: progressCount, completed }
          };
        }));
        setFacades(facadesWithProgress);

        // Update Analytics
        const { data: allModules } = await supabase.from('modules').select('id, status').eq('project_id', projectId);
        if (projectData && allModules) {
          const moduleIds = allModules.map(m => m.id);
          const { data: allLogs } = await supabase
            .from('status_logs')
            .select('*')
            .in('module_id', moduleIds);

          const analytics = calculateProjectAnalytics(projectData, allModules, allLogs || []);
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
    let finalUrl = formData.elevation_url;

    // Handle File Upload if exists
    if (formData.file) {
      const file = formData.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}_${Date.now()}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('facade-plans')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        alert('Error al subir el archivo.');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('facade-plans')
        .getPublicUrl(filePath);
      
      finalUrl = publicUrl;
    }

    const { file, ...facadeData } = formData;
    const submissionData = { ...facadeData, elevation_url: finalUrl };

    if (editingFacade) {
      // UPDATE
      const { error } = await supabase
        .from('facades')
        .update(submissionData)
        .eq('id', editingFacade.id);

      if (error) {
        console.error('Error updating facade:', error);
        alert('Error al actualizar la fachada.');
      }
    } else {
      // INSERT
      const { error } = await supabase
        .from('facades')
        .insert([{ ...submissionData, project_id: projectId }]);

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

  const handleExportPDF = async () => {
    if (!project) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const W = 210; // A4 width mm
      const MARGIN = 14;
      const CONTENT_W = W - MARGIN * 2;
      const today = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

      // ── Aggregate stats ──────────────────────────────────────────────────────
      const totalModules  = facades.reduce((s, f) => s + (f.stats?.total      ?? 0), 0);
      const completed     = facades.reduce((s, f) => s + (f.stats?.completed  ?? 0), 0);
      const inProgress    = facades.reduce((s, f) => s + (f.stats?.inProgress ?? 0), 0);
      const pending       = facades.reduce((s, f) => s + (f.stats?.pending    ?? 0), 0);
      const overallPct    = analyticsData?.currentProgress ?? (
        totalModules === 0 ? 0 : Math.round((completed + inProgress * 0.5) / totalModules * 100)
      );
      const deviation     = analyticsData?.deviationDays ?? 0;
      const velocity      = analyticsData?.velocity ? analyticsData.velocity.toFixed(2) : '—';
      const estCompletion = analyticsData?.estimatedCompletion
        ? new Date(analyticsData.estimatedCompletion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

      // ── Colors & helpers ─────────────────────────────────────────────────────
      const NAVY   = [15,  40, 100] as [number,number,number];
      const BLUE   = [29,  58, 132] as [number,number,number];
      const GREEN  = [34, 197,  94] as [number,number,number];
      const AMBER  = [245,158, 11] as [number,number,number];
      const PINK   = [213, 41, 116] as [number,number,number];
      const GRAY1  = [248,250,252] as [number,number,number]; // very light bg
      const GRAY2  = [226,232,240] as [number,number,number]; // border
      const GRAY3  = [100,116,139] as [number,number,number]; // muted text
      const WHITE  = [255,255,255] as [number,number,number];
      const BLACK  = [15, 23, 42]  as [number,number,number];

      const setFill   = (c: [number,number,number]) => pdf.setFillColor(c[0], c[1], c[2]);
      const setDraw   = (c: [number,number,number]) => pdf.setDrawColor(c[0], c[1], c[2]);
      const setColor  = (c: [number,number,number]) => pdf.setTextColor(c[0], c[1], c[2]);

      // ── 1. HEADER BAR ────────────────────────────────────────────────────────
      setFill(NAVY);
      pdf.rect(0, 0, W, 26, 'F');

      // logo mark (vector drawing)
      setFill(AMBER);
      pdf.roundedRect(MARGIN, 5, 14, 14, 2.5, 2.5, 'F');
      
      setDraw(WHITE);
      pdf.setLineWidth(0.7);
      pdf.setLineCap('round');
      pdf.setLineJoin('round');
      const sx = (v: number) => MARGIN + (v * 14 / 24);
      const sy = (v: number) => 5 + (v * 14 / 24);
      
      // Building base
      pdf.line(sx(3), sy(20), sx(21), sy(20));
      // Building body
      pdf.roundedRect(sx(5), sy(4), sx(19)-sx(5), sy(20)-sy(4), 0.5, 0.5, 'D');
      // Windows (as tiny dots/lines)
      pdf.setLineWidth(1.2);
      [8, 12, 16].forEach(wy => {
        pdf.line(sx(9.5), sy(wy), sx(9.51), sy(wy));
        pdf.line(sx(14.5), sy(wy), sx(14.51), sy(wy));
      });

      setColor(WHITE);
      pdf.setFontSize(13);
      pdf.setFont('helvetica','bold');
      pdf.text('NICOMAX', MARGIN + 18, 11);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica','normal');
      pdf.text('MONITOREO DE OBRAS', MARGIN + 18, 16.5);

      // report label right side
      pdf.setFontSize(7);
      pdf.setFont('helvetica','bold');
      pdf.text('REPORTE DE AVANCE DE PROYECTO', W - MARGIN, 11, { align: 'right' });
      pdf.setFont('helvetica','normal');
      pdf.setFontSize(6.5);
      pdf.text(`Generado: ${today}`, W - MARGIN, 17, { align: 'right' });

      // ── 2. PROJECT INFO ROW ──────────────────────────────────────────────────
      let y = 38; // Increased from 32 for better separation
      setColor(BLACK);
      pdf.setFontSize(15);
      pdf.setFont('helvetica','bold');
      pdf.text(project.name || 'Proyecto', MARGIN, y);

      // status badge
      const badgeTxt = overallPct >= 100 ? 'CONCLUIDO' : overallPct >= 50 ? 'EN AVANCE' : 'EN INICIO';
      const badgeColor = overallPct >= 100 ? GREEN : overallPct >= 50 ? AMBER : BLUE;
      const badgeW = 22;
      setFill(badgeColor);
      pdf.roundedRect(W - MARGIN - badgeW, y - 5.5, badgeW, 7, 1.5, 1.5, 'F');
      setColor(WHITE);
      pdf.setFontSize(6);
      pdf.setFont('helvetica','bold');
      pdf.text(badgeTxt, W - MARGIN - badgeW / 2, y - 0.8, { align: 'center' });

      // meta info pills
      y += 5;
      const infoPairs: [string, string][] = [
        ['Dirección',       project.address      || '—'],
        ['Inicio',          project.start_date   || '—'],
        ['Cierre Planif.',  project.delivery_date || '—'],
        ['Cierre Est.',     estCompletion],
        ['Velocidad',       `${velocity}% / día`],
        ['Desviación',      deviation !== 0 ? `${deviation > 0 ? '+' : ''}${deviation}d` : 'En tiempo'],
      ];

      const colW = CONTENT_W / 3;
      infoPairs.forEach(([label, value], i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = MARGIN + col * colW;
        const cy = y + row * 9;

        setColor(GRAY3);
        pdf.setFontSize(5.5);
        pdf.setFont('helvetica','bold');
        pdf.text(label.toUpperCase(), cx, cy);
        setColor(BLACK);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica','bold');
        pdf.text(String(value), cx, cy + 4);
      });

      // ── 3. PROJECT TIMELINE CHART ────────────────────────────────────────────
      y += 18;
      setDraw(GRAY2);
      pdf.setLineWidth(0.3);
      pdf.line(MARGIN, y, W - MARGIN, y);
      y += 5;

      setColor(GRAY3);
      pdf.setFontSize(6);
      pdf.setFont('helvetica','bold');
      pdf.text('EVOLUCIÓN DEL PROYECTO', MARGIN, y);
      
      // Legend
      setFill(BLUE);
      pdf.circle(W - MARGIN - 38, y - 1, 1, 'F');
      setColor(BLACK);
      pdf.setFontSize(5.5);
      pdf.text('REAL', W - MARGIN - 35, y);

      setFill(PINK);
      pdf.circle(W - MARGIN - 24, y - 1, 1, 'F');
      setColor(BLACK);
      pdf.text('PLAN', W - MARGIN - 21, y);

      setFill(AMBER);
      pdf.circle(W - MARGIN - 10, y - 1, 1, 'F');
      setColor(BLACK);
      pdf.text('PROY.', W - MARGIN - 7, y);

      y += 5;
      
      // Chart Area
      const chartH = 26;
      const chartW = CONTENT_W - 8; // Leave some right padding
      const chartX = MARGIN + 4; // Shift right for Y-axis labels
      
      // Grid lines & Y-axis labels
      setDraw([241,245,249]); // slate-100
      pdf.setLineWidth(0.2);
      [0, 25, 50, 75, 100].forEach(val => {
        const lineY = y + chartH - (val / 100) * chartH;
        pdf.line(chartX, lineY, chartX + chartW, lineY);
        setColor(GRAY3);
        pdf.setFontSize(4.5);
        pdf.text(String(val), chartX - 2, lineY + 1.5, { align: 'right' });
      });

      // Draw lines
      const tl = analyticsData?.timeline || [];
      if (tl.length > 0) {
        const stepX = chartW / Math.max(1, tl.length - 1);
        
        // Plan line (dashed, PINK)
        setDraw(PINK);
        pdf.setLineWidth(0.4);
        pdf.setLineDashPattern([1, 1], 0);
        for (let i = 0; i < tl.length - 1; i++) {
          if (tl[i].expected !== undefined && tl[i+1].expected !== undefined) {
            const x1 = chartX + i * stepX;
            const y1 = y + chartH - (tl[i].expected! / 100) * chartH;
            const x2 = chartX + (i + 1) * stepX;
            const y2 = y + chartH - (tl[i+1].expected! / 100) * chartH;
            pdf.line(x1, y1, x2, y2);
          }
        }
        
        // Projected line (dashed, AMBER)
        setDraw(AMBER);
        pdf.setLineWidth(0.5);
        pdf.setLineDashPattern([1, 1], 0);
        for (let i = 0; i < tl.length - 1; i++) {
          if (tl[i].projected !== undefined && tl[i+1].projected !== undefined) {
            const x1 = chartX + i * stepX;
            const y1 = y + chartH - (tl[i].projected! / 100) * chartH;
            const x2 = chartX + (i + 1) * stepX;
            const y2 = y + chartH - (tl[i+1].projected! / 100) * chartH;
            pdf.line(x1, y1, x2, y2);
          }
        }

        // Real line (solid, BLUE)
        setDraw(BLUE);
        pdf.setLineWidth(0.6);
        pdf.setLineDashPattern([], 0); // reset
        for (let i = 0; i < tl.length - 1; i++) {
          if (tl[i].actual !== undefined && tl[i+1].actual !== undefined) {
            const x1 = chartX + i * stepX;
            const y1 = y + chartH - (tl[i].actual! / 100) * chartH;
            const x2 = chartX + (i + 1) * stepX;
            const y2 = y + chartH - (tl[i+1].actual! / 100) * chartH;
            pdf.line(x1, y1, x2, y2);
          }
        }
        
        // Dates on X-axis
        setColor(GRAY3);
        pdf.setFontSize(4.5);
        if (tl.length > 0) {
           pdf.text(tl[0].date, chartX, y + chartH + 3.5);
           pdf.text(tl[Math.floor(tl.length/2)].date, chartX + chartW/2, y + chartH + 3.5, { align: 'center' });
           pdf.text(tl[tl.length-1].date, chartX + chartW, y + chartH + 3.5, { align: 'right' });
        }
      } else {
        setColor(GRAY3);
        pdf.setFontSize(7);
        pdf.text('Sin datos suficientes', chartX + chartW/2, y + chartH/2, { align: 'center' });
      }
      
      pdf.setLineDashPattern([], 0); // safe reset

      // ── 4. KPI CARDS ─────────────────────────────────────────────────────────
      y += chartH + 10;
      const kpis = [
        { label: 'AVANCE GENERAL', value: `${overallPct}%`,    color: BLUE  },
        { label: 'COMPLETADOS',    value: String(completed),    color: GREEN },
        { label: 'EN PROCESO',     value: String(inProgress),   color: AMBER },
        { label: 'PENDIENTES',     value: String(pending),      color: PINK  },
        { label: 'TOTAL MÓDULOS',  value: String(totalModules), color: NAVY  },
      ];

      const cardW = (CONTENT_W - 4 * 3) / 5;
      const cardH = 18;
      kpis.forEach((k, i) => {
        const cx = MARGIN + i * (cardW + 3);
        // card bg
        setFill(GRAY1);
        setDraw(GRAY2);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD');
        // top accent line
        setFill(k.color);
        pdf.roundedRect(cx, y, cardW, 2, 1, 1, 'F');
        // value
        setColor(k.color);
        pdf.setFontSize(14);
        pdf.setFont('helvetica','bold');
        pdf.text(k.value, cx + cardW / 2, y + 11, { align: 'center' });
        // label
        setColor(GRAY3);
        pdf.setFontSize(5);
        pdf.setFont('helvetica','bold');
        pdf.text(k.label, cx + cardW / 2, y + 16, { align: 'center' });
      });

      // ── 5. OVERALL PROGRESS BAR ──────────────────────────────────────────────
      y += cardH + 5;
      setColor(GRAY3);
      pdf.setFontSize(6);
      pdf.setFont('helvetica','bold');
      pdf.text('PROGRESO GLOBAL DEL PROYECTO', MARGIN, y);
      pdf.setFont('helvetica','normal');
      pdf.text(`${overallPct}% completado`, W - MARGIN, y, { align: 'right' });

      y += 3;
      const barH = 5;
      setFill(GRAY2);
      pdf.roundedRect(MARGIN, y, CONTENT_W, barH, 2, 2, 'F');
      setFill(BLUE);
      pdf.roundedRect(MARGIN, y, CONTENT_W * (overallPct / 100), barH, 2, 2, 'F');
      y += barH + 5;

      // ── 6. FACADES TABLE ─────────────────────────────────────────────────────
      setDraw(GRAY2);
      pdf.setLineWidth(0.3);
      pdf.line(MARGIN, y, W - MARGIN, y);
      y += 4;

      setColor(GRAY3);
      pdf.setFontSize(5.5);
      pdf.setFont('helvetica','bold');
      pdf.text('DETALLE POR FACHADA', MARGIN, y);
      y += 4;

      // Table header tailored narrower to fit percentages on the right
      const cols = { name: 0, total: 75, comp: 94, prog: 114, pend: 134, bar: 152 };
      const colHeaders: { key: keyof typeof cols; label: string }[] = [
        { key: 'name',  label: 'FACHADA'      },
        { key: 'total', label: 'TOTAL'         },
        { key: 'comp',  label: 'COMPLETADOS'   },
        { key: 'prog',  label: 'EN PROCESO'    },
        { key: 'pend',  label: 'PENDIENTES'    },
        { key: 'bar',   label: 'AVANCE'        },
      ];

      // header bg
      setFill([237,242,248]);
      pdf.rect(MARGIN, y, CONTENT_W, 6.5, 'F');

      setColor(NAVY);
      pdf.setFontSize(5.5);
      pdf.setFont('helvetica','bold');
      colHeaders.forEach(h => {
        const x = h.key === 'name' ? MARGIN + 2 : MARGIN + cols[h.key];
        pdf.text(h.label, x, y + 4.5);
      });
      y += 7;

      // Rows
      pdf.setFontSize(7);
      const rowH = 8;
      const BAR_W = 20; // Reduced width so percentage text fits beautifully

      facades.forEach((facade, idx) => {
        const rowBg = idx % 2 === 0 ? WHITE : GRAY1;
        setFill(rowBg);
        pdf.rect(MARGIN, y, CONTENT_W, rowH, 'F');

        // Bottom row border
        setDraw([226,232,240]);
        pdf.setLineWidth(0.2);
        pdf.line(MARGIN, y + rowH, W - MARGIN, y + rowH);

        const pct = facade.progress ?? 0;
        const rowY = y + 5.5;

        // Name
        setColor(BLACK);
        pdf.setFont('helvetica','bold');
        pdf.setFontSize(7);
        const nameStr = facade.name.length > 28 ? facade.name.slice(0, 26) + '…' : facade.name;
        pdf.text(nameStr, MARGIN + 2, rowY);

        // Numbers
        pdf.setFont('helvetica','normal');
        pdf.setFontSize(7);
        const nums: [string, keyof typeof cols, [number,number,number]][] = [
          [String(facade.stats?.total      ?? 0), 'total', BLACK],
          [String(facade.stats?.completed  ?? 0), 'comp',  GREEN],
          [String(facade.stats?.inProgress ?? 0), 'prog',  AMBER],
          [String(facade.stats?.pending    ?? 0), 'pend',  PINK ],
        ];
        nums.forEach(([txt, col, color]) => {
          setColor(color);
          pdf.setFont('helvetica','bold');
          pdf.text(txt, MARGIN + cols[col] + 6, rowY, { align: 'center' });
        });

        // Mini progress bar
        const bx = MARGIN + cols['bar'];
        const bw = BAR_W;
        const bh = 3.5;
        const by = y + (rowH - bh) / 2;
        setFill(GRAY2);
        pdf.roundedRect(bx, by, bw, bh, 1, 1, 'F');
        const fillColor = pct >= 80 ? GREEN : pct >= 40 ? AMBER : BLUE;
        setFill(fillColor);
        pdf.roundedRect(bx, by, bw * (pct / 100), bh, 1, 1, 'F');
        // pct label
        setColor(BLACK);
        pdf.setFont('helvetica','bold');
        pdf.setFontSize(6.5);
        pdf.text(`${pct}%`, bx + bw + 2, by + bh - 0.5);

        y += rowH;
      });

      if (facades.length === 0) {
        setColor(GRAY3);
        pdf.setFont('helvetica','normal');
        pdf.setFontSize(8);
        pdf.text('Sin fachadas registradas.', MARGIN + 2, y + 5);
        y += 10;
      }

      // ── 7. FOOTER ────────────────────────────────────────────────────────────
      const footerY = 287;
      setDraw(GRAY2);
      pdf.setLineWidth(0.3);
      pdf.line(MARGIN, footerY, W - MARGIN, footerY);

      setColor(GRAY3);
      pdf.setFontSize(5.5);
      pdf.setFont('helvetica','normal');
      pdf.text('NICOMAX — Monitoreo de Obras  |  Documento generado automáticamente. Solo para uso interno.', MARGIN, footerY + 3.5);
      pdf.text('Pág. 1 / 1', W - MARGIN, footerY + 3.5, { align: 'right' });

      // ── Save ─────────────────────────────────────────────────────────────────
      pdf.save(`Reporte_${(project.name || 'Proyecto').replace(/\s+/g, '_')}.pdf`);

    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(`Hubo un error al generar el PDF. Detalles: ${error.message || String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && !project) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-pulse text-accent font-bold text-2xl tracking-[0.2em] font-manrope uppercase">Sincronizando Detalles...</div>
    </div>
  );

  return (
    <main className="p-4 md:p-12 font-inter transition-colors duration-300">
      <div className="max-w-7xl mx-auto" id="report-content">
        {/* Navigation moved to Sidebar */}
        
        {/* Actions Bar */}
        <div className="mb-6 flex justify-end">
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-brand-blue/10 text-brand-blue font-black py-2 px-5 rounded-xl border border-brand-blue/20 hover:bg-brand-blue/20 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 text-[10px] tracking-widest uppercase"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Generando...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
                <span>Reporte PDF</span>
              </>
            )}
          </button>
        </div>

        <header className="mb-10 flex flex-col lg:flex-row gap-6 items-center lg:items-center">
          <div className="relative w-full lg:w-32 h-32 rounded-[1.5rem] overflow-hidden shadow-2xl group shrink-0">
            <img 
              src={project?.image_url || "https://images.unsplash.com/photo-1486406146926-c627a92fb1ab?q=80&w=2070&auto=format&fit=crop"} 
              alt={project?.name}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              crossOrigin="anonymous"
            />
          </div>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-3xl font-black font-manrope tracking-tighter leading-tight">
              {project?.name}
            </h1>
            
            <div className="flex flex-wrap gap-5 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-card border border-card-border flex items-center justify-center shrink-0 shadow-md text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="text-[8px] tracking-[0.2em] uppercase text-muted font-black mb-0.5">Ubicación Actual</p>
                  <p className="font-bold text-xs leading-tight">{project?.address || 'Sin dirección'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-card border border-card-border flex items-center justify-center shrink-0 shadow-md text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <p className="text-[8px] tracking-[0.2em] uppercase text-muted font-black mb-0.5">Cierre de Proyecto</p>
                  <p className="font-black text-xs text-accent leading-tight">{project?.delivery_date || 'TBD'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Analytics Section */}
        {analyticsData && (
          <section className="mb-12">
            <ProjectAnalytics data={analyticsData} />
          </section>
        )}

        <section className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-card-border pb-4 gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-black font-manrope tracking-tight">Estructura de Fachadas</h2>
               <p className="text-muted text-[13px] font-medium">Control modularizado por frentes de trabajo.</p>
            </div>
            <button 
              onClick={() => {
                setEditingFacade(null);
                setIsModalOpen(true);
              }}
              className="bg-foreground text-background font-black py-2.5 px-8 rounded-2xl hover:brightness-110 transition-all flex items-center gap-3 shadow-xl active:scale-95 uppercase tracking-widest text-[10px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Nueva Fachada</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {facades.map((facade) => (
              <div key={facade.id} className="relative group bg-card border border-card-border rounded-[1.5rem] hover:border-accent/40 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 h-full flex flex-col justify-between overflow-hidden group-hover:-translate-y-1">
                {/* Header Row - Part of standard flow to avoid overlapping */}
                <div className="p-6 pb-4 flex justify-between items-start gap-3 relative z-20">
                  <Link href={`/projects/${projectId}/facades/${facade.id}`} className="min-w-0 flex-1 group/title block">
                    <h3 className="text-xl font-black font-manrope tracking-tight leading-tight group-hover/title:text-accent transition-colors truncate">
                      {facade.name}
                    </h3>
                    <div className="mt-2">
                      <span className="text-[10px] font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-lg inline-block">{facade.stats?.total || 0} Módulos</span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleEditFacade(e, facade)}
                      className="p-2.5 bg-background border border-card-border rounded-xl text-muted hover:text-accent hover:border-accent/40 shadow-sm transition-all"
                      title="Editar Fachada"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteFacade(e, facade.id)}
                      className="p-2.5 bg-background border border-card-border rounded-xl text-muted hover:text-red-500 hover:border-red-500/40 shadow-sm transition-all"
                      title="Eliminar Fachada"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                    <Link href={`/projects/${projectId}/facades/${facade.id}`} className="w-9 h-9 ml-1 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </Link>
                  </div>
                </div>

                <Link href={`/projects/${projectId}/facades/${facade.id}`} className="block flex-1 p-6 pt-0">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Avance Real</span>
                        <span className="text-lg font-black font-manrope text-accent">{facade.progress}%</span>
                      </div>
                      <div className="w-full bg-muted/10 dark:bg-muted/20 border border-muted/20 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-accent h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                          style={{ width: `${facade.progress}%` }} 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-1 p-2 bg-background/40 rounded-xl border border-card-border/50">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
                         <span className="text-[10px] font-black text-brand-pink tabular-nums">{facade.stats?.pending || 0}</span>
                         <span className="text-[8px] font-bold text-muted uppercase tracking-widest inline">Pend</span>
                      </div>
                      <div className="w-px h-4 bg-card-border" />
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                         <span className="text-[10px] font-black text-amber-500 tabular-nums">{facade.stats?.inProgress || 0}</span>
                         <span className="text-[8px] font-bold text-muted uppercase tracking-widest inline">Proc</span>
                      </div>
                      <div className="w-px h-4 bg-card-border" />
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                         <span className="text-[10px] font-black text-green-500 tabular-nums">{facade.stats?.completed || 0}</span>
                         <span className="text-[8px] font-bold text-muted uppercase tracking-widest inline">Term</span>
                      </div>
                    </div>
                  </div>
                </Link>
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
