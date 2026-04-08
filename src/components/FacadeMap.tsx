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
}

interface FacadeMapProps {
  modules: Module[];
  onModuleClick: (module: Module, e: React.MouseEvent) => void;
  onImageClick?: (x: number, y: number) => void;
  levels?: number;
  modulesPerLevel?: number;
  elevationUrl?: string;
  isMappingMode?: boolean;
}

const statusColors: Record<ModuleStatus, string> = {
  PENDING: '#f97316', // Orange 500
  IN_PROGRESS: '#f59e0b', // Amber 500
  COMPLETED: '#22c55e', // Green 500
};

export default function FacadeMap({ 
  modules, 
  onModuleClick, 
  onImageClick,
  levels = 10, 
  modulesPerLevel = 15, 
  elevationUrl,
  isMappingMode = false
}: FacadeMapProps) {
  // SVG Dimensions for Grid Mode
  const modWidth = 44;
  const modHeight = 34;
  const gap = 8;
  
  const width = modulesPerLevel * (modWidth + gap);
  const height = levels * (modHeight + gap);

  const handleInternalImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMappingMode || !onImageClick) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onImageClick(x, y);
  };

  const renderModuleMarker = (module: Module) => {
    const status = module.status || 'PENDING';
    const color = statusColors[status];
    
    // Safety check for coordinates
    if (module.pos_x === undefined || module.pos_y === undefined) return null;

    return (
      <div 
        key={module.id}
        onClick={(e) => {
          e.stopPropagation();
          onModuleClick(module, e);
        }}
        className="absolute group cursor-pointer z-[100]"
        style={{ 
          left: `${module.pos_x}%`, 
          top: `${module.pos_y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div 
          className="w-6 h-6 rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300 group-hover:scale-150 group-hover:ring-4 group-hover:ring-accent/50 animate-in fade-in zoom-in"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}80, 0 0 5px white`
          }}
        />
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black/90 text-white text-[9px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[110] border border-white/20 shadow-2xl pointer-events-none">
          L{module.level_number} M{module.module_number}
        </div>
      </div>
    );
  };

  const renderModuleShape = (x: number, y: number, status: ModuleStatus, shape: ModuleShape = 'RECT_V') => {
    const color = statusColors[status];
    const sharedProps = {
      fill: color,
      stroke: "white",
      strokeWidth: 1.5,
      className: "transition-all duration-300 group-hover:brightness-110 group-hover:scale-[1.05] shadow-lg group-hover:stroke-accent/50 cursor-pointer"
    };

    switch (shape) {
      case 'CIRCLE':
        return <circle cx={x + modWidth / 2} cy={y + modHeight / 2} r={Math.min(modWidth, modHeight) / 2} {...sharedProps} />;
      case 'TRIANGLE_UP':
        return <polygon points={`${x + modWidth / 2},${y} ${x},${y + modHeight} ${x + modWidth},${y + modHeight}`} {...sharedProps} />;
      case 'TRIANGLE_DOWN':
        return <polygon points={`${x},${y} ${x + modWidth},${y} ${x + modWidth / 2},${y + modHeight}`} {...sharedProps} />;
      case 'TRAPEZOID':
        return <polygon points={`${x + modWidth * 0.2},${y} ${x + modWidth * 0.8},${y} ${x + modWidth},${y + modHeight} ${x},${y + modHeight}`} {...sharedProps} />;
      case 'RECT_H':
        return <rect x={x} y={y + modHeight * 0.2} width={modWidth} height={modHeight * 0.6} rx={4} {...sharedProps} />;
      case 'RECT_V':
      default:
        return <rect x={x} y={y} width={modWidth} height={modHeight} rx={6} {...sharedProps} />;
    }
  };

  // IMAGE MODE
  if (elevationUrl) {
    return (
      <div className="flex flex-col items-center w-full min-h-[500px] bg-card border border-card-border rounded-[3rem] shadow-2xl overflow-hidden glass-effect p-4 md:p-8">
        <h2 className="text-xl md:text-2xl font-black text-foreground mb-8 font-manrope text-center tracking-tight">
          Plano de Elevación <span className="text-accent underline underline-offset-8 decoration-accent/20">Control por Coordenadas</span>
        </h2>
        
        <div 
          className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-card-border shadow-inner bg-background group/map"
          onClick={handleInternalImageClick}
        >
          <img 
            src={elevationUrl} 
            alt="Frente de Obra" 
            className="w-full h-auto object-contain block select-none pointer-events-none"
          />
          
          {/* Module Overlays */}
          {modules.map(m => renderModuleMarker(m))}

          {isMappingMode && (
            <div className="absolute inset-0 bg-accent/5 cursor-crosshair flex items-center justify-center opacity-0 group-hover/map:opacity-100 transition-opacity z-10 pointer-events-none">
               <div className="bg-accent text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                 Click para identificar módulo
               </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 mt-8 p-4 bg-background/50 rounded-2xl border border-card-border">
          {(Object.keys(statusColors) as ModuleStatus[]).map(status => (
            <div key={status} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-lg border-2 border-white shadow-md" style={{ backgroundColor: statusColors[status] }} />
              <span className="text-muted text-xs font-bold uppercase tracking-widest">
                {status === 'PENDING' ? 'Pendiente' : status === 'IN_PROGRESS' ? 'En Ejecución' : 'Terminado'}
              </span>
            </div>
          ))}
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
          <defs>
            <pattern id="grid" width={modWidth + gap} height={modHeight + gap} patternUnits="userSpaceOnUse">
              <rect width={modWidth + gap} height={modHeight + gap} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted/5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

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
              const shape = module?.shape_type || 'RECT_V';

              return (
                <g key={`${levelNum}-${moduleNum}`} className="group" onClick={(e) => module && onModuleClick(module, e)}>
                  {renderModuleShape(x, y, status, shape)}
                  <text
                    x={x + modWidth / 2}
                    y={y + modHeight / 2}
                    fontSize="8"
                    fill="white"
                    fontWeight="900"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 font-manrope drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] translate-y-1 group-hover:translate-y-0"
                  >
                    L{levelNum} M{moduleNum}
                  </text>
                </g>
              );
            });
          })}
        </svg>
      </div>
      
      <div className="flex flex-wrap justify-center gap-8 mt-4 p-4 bg-background/50 rounded-2xl border border-card-border">
        {(Object.keys(statusColors) as ModuleStatus[]).map(status => (
          <div key={status} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg border-2 border-white shadow-md" style={{ backgroundColor: statusColors[status] }} />
            <span className="text-muted text-xs font-bold uppercase tracking-widest">
              {status === 'PENDING' ? 'Pendiente' : status === 'IN_PROGRESS' ? 'En Proceso' : 'Terminado'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
