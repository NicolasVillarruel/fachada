'use client';

import React from 'react';

export type ModuleStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type ModuleShape = 'RECT_V' | 'RECT_H' | 'CIRCLE' | 'TRIANGLE_UP' | 'TRIANGLE_DOWN' | 'TRAPEZOID';

export interface Module {
  id: string;
  level_number: number;
  module_number: number;
  status: ModuleStatus;
  shape_type?: ModuleShape;
  pos_x?: number;
  pos_y?: number;
  // Metadata fields
  display_name?: string;
  dimensions?: string;
  color_code?: string;
  blueprint_url?: string;
}

interface FacadeMapProps {
  modules: Module[];
  onModuleClick: (module: Module, e: React.MouseEvent) => void;
  onImageClick?: (x: number, y: number) => void;
  onModuleMove?: (moduleId: string, x: number, y: number) => void;
  levels?: number;
  modulesPerLevel?: number;
  elevationUrl?: string;
  isMappingMode?: boolean;
}

const statusColors: Record<ModuleStatus, string> = {
  PENDING: 'var(--module-pending)',
  IN_PROGRESS: 'var(--module-progress)',
  COMPLETED: 'var(--module-completed)',
};

export default function FacadeMap({ 
  modules, 
  onModuleClick, 
  onImageClick,
  onModuleMove,
  levels = 10, 
  modulesPerLevel = 15, 
  elevationUrl,
  isMappingMode = false
}: FacadeMapProps) {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isJustDragged = React.useRef(false);

  // SVG Dimensions for Grid Mode
  const modWidth = 44;
  const modHeight = 34;
  const gap = 8;
  
  const width = modulesPerLevel * (modWidth + gap);
  const height = levels * (modHeight + gap);

  const handleInternalImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMappingMode || !onImageClick || draggingId || isJustDragged.current) {
      isJustDragged.current = false;
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onImageClick(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !onModuleMove || !containerRef.current) return;

    isJustDragged.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    onModuleMove(draggingId, x, y);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const renderModuleMarker = (module: Module) => {
    const status = module.status || 'PENDING';
    const color = statusColors[status];
    const isDragging = draggingId === module.id;
    
    if (module.pos_x === undefined || module.pos_y === undefined) return null;

    return (
      <div 
        key={module.id}
        onMouseDown={(e) => {
          if (isMappingMode) {
            e.stopPropagation();
            setDraggingId(module.id);
          }
        }}
        onClick={(e) => {
          if (!isMappingMode) {
            e.stopPropagation();
            onModuleClick(module, e);
          }
        }}
        className={`absolute group transition-transform ${isMappingMode ? 'cursor-move' : 'cursor-pointer'} ${isDragging ? 'z-[200] scale-125' : 'z-[100]'}`}
        style={{ 
          left: `${module.pos_x}%`, 
          top: `${module.pos_y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto'
        }}
      >
        <div 
          className={`w-6 h-6 rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300 ${isDragging ? 'ring-4 ring-white ring-offset-2 ring-offset-accent' : 'group-hover:scale-150 group-hover:ring-4 group-hover:ring-accent/50'} animate-in fade-in zoom-in`}
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}80, 0 0 5px white`
          }}
        />
        {!isDragging && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black/90 text-white text-[9px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[110] border border-white/20 shadow-2xl pointer-events-none">
            L{module.level_number} M{module.module_number}
          </div>
        )}
      </div>
    );
  };

  if (elevationUrl) {
    const total = modules.length;
    const counts = {
      PENDING: modules.filter(m => m.status === 'PENDING').length,
      IN_PROGRESS: modules.filter(m => m.status === 'IN_PROGRESS').length,
      COMPLETED: modules.filter(m => m.status === 'COMPLETED').length,
    };

    return (
      <div className="flex flex-col items-center w-full min-h-[500px] bg-card border border-card-border rounded-[2rem] shadow-2xl overflow-hidden glass-effect p-4 md:p-6">
        <div 
          ref={containerRef}
          className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border-2 border-card-border shadow-2xl bg-background group/map transition-all duration-500"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleInternalImageClick}
        >
          {elevationUrl ? (
            <img 
              src={elevationUrl} 
              alt="Plano de Elevación" 
              className="w-full h-auto object-contain block select-none"
              onDragStart={(e) => e.preventDefault()}
            />
          ) : (
            <div className="aspect-video bg-muted/20 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-card-border animate-spin" />
              <p className="text-muted font-bold text-xs uppercase tracking-widest">Cargando Elevación...</p>
            </div>
          )}

          {/* Active Mapping Overlay */}
          {isMappingMode && (
            <div 
              className="absolute inset-0 bg-accent/5 cursor-crosshair flex items-center justify-center z-40 animate-in fade-in duration-300"
              onClick={(e) => {
                e.stopPropagation();
                // If we were dragging, stop bubbling to avoid creating new modules
                if (draggingId) {
                  return;
                }
                handleInternalImageClick(e as any);
              }}
            >
              <div className="bg-accent text-white px-8 py-2 rounded-full shadow-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 border-white/20 backdrop-blur-md absolute top-6 pointer-events-none">
                Modo Identificación Activo
              </div>
            </div>
          )}
          
          {/* Module Overlays - ALWAYS VISIBLE */}
          {modules.map(m => renderModuleMarker(m))}
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mt-6 p-4 bg-background/50 rounded-2xl border border-card-border w-full max-w-4xl shadow-inner">
          <div className="flex items-center gap-2 pr-6 border-r border-card-border/50">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">Total Unidades:</span>
            <span className="text-xs font-black tabular-nums">{total}</span>
          </div>

          {[
            { status: 'COMPLETED', label: 'Terminados' },
            { status: 'IN_PROGRESS', label: 'En Proceso' },
            { status: 'PENDING', label: 'Pendientes' }
          ].map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" 
                style={{ backgroundColor: statusColors[item.status as ModuleStatus] }} 
              />
              <span className="text-muted text-[9px] font-black uppercase tracking-widest">
                {item.label}:
              </span>
              <span className="text-[11px] font-black tabular-nums">
                {counts[item.status as keyof typeof counts]}
              </span>
            </div>
          ))}

          {isMappingMode && (
            <div className="flex items-center gap-2 pl-6 border-l border-card-border/50 animate-pulse">
              <div className="w-3 h-3 rounded-md border-2 border-dashed border-accent" />
              <span className="text-accent text-[8px] font-black uppercase tracking-widest">Ajusta puntos arrastrando</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // LEGACY GRID MODE
  return (
    <div className="flex flex-col items-center p-4 md:p-10 bg-card border border-card-border rounded-[3rem] shadow-2xl overflow-hidden glass-effect">
      <h2 className="text-xl md:text-2xl font-black text-foreground mb-10 font-manrope text-center tracking-tight">
        Instalación de Paneles <span className="text-accent underline underline-offset-8 decoration-accent/20">Mapa Interactivo</span>
      </h2>
      
      <div className="overflow-auto max-w-full custom-scrollbar pb-6 w-full flex justify-start lg:justify-center">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="bg-background rounded-2xl border border-card-border shadow-inner"
        >
          <rect width="100%" height="100%" fill="none" />
          {/* Grid content omitted for brevity but logic remains same */}
          {Array.from({ length: levels }).map((_, levelIdx) => {
            const levelNum = levels - levelIdx;
            return Array.from({ length: modulesPerLevel }).map((_, modIdx) => {
              const moduleNum = modIdx + 1;
              const module = modules.find(
                (m) => m.level_number === levelNum && m.module_number === moduleNum
              );
              const x = modIdx * (modWidth + gap) + gap / 2;
              const y = levelIdx * (modHeight + gap) + gap / 2;
              const status = module?.status || 'PENDING';
              return (
                <g key={`${levelNum}-${moduleNum}`} className="group" onClick={(e) => module && onModuleClick(module, e)}>
                  <rect x={x} y={y} width={modWidth} height={modHeight} rx={6} fill={statusColors[status]} stroke="white" strokeWidth="1.5" />
                </g>
              );
            });
          })}
        </svg>
      </div>
    </div>
  );
}
