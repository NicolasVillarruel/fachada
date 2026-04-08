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
}

interface FacadeMapProps {
  modules: Module[];
  onModuleClick: (module: Module) => void;
  levels: number;
  modulesPerLevel: number;
}

const statusColors: Record<ModuleStatus, string> = {
  PENDING: 'var(--module-pending)',
  IN_PROGRESS: 'var(--module-progress)',
  COMPLETED: 'var(--module-completed)',
};

export default function FacadeMap({ modules, onModuleClick, levels, modulesPerLevel }: FacadeMapProps) {
  // SVG Dimensions
  const modWidth = 44;
  const modHeight = 34;
  const gap = 8;
  
  const width = modulesPerLevel * (modWidth + gap);
  const height = levels * (modHeight + gap);

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
        return (
          <circle 
            cx={x + modWidth / 2} 
            cy={y + modHeight / 2} 
            r={Math.min(modWidth, modHeight) / 2} 
            {...sharedProps} 
          />
        );
      case 'TRIANGLE_UP':
        return (
          <polygon 
            points={`${x + modWidth / 2},${y} ${x},${y + modHeight} ${x + modWidth},${y + modHeight}`}
            {...sharedProps}
          />
        );
      case 'TRIANGLE_DOWN':
        return (
          <polygon 
            points={`${x},${y} ${x + modWidth},${y} ${x + modWidth / 2},${y + modHeight}`}
            {...sharedProps}
          />
        );
      case 'TRAPEZOID':
        return (
          <polygon 
            points={`${x + modWidth * 0.2},${y} ${x + modWidth * 0.8},${y} ${x + modWidth},${y + modHeight} ${x},${y + modHeight}`}
            {...sharedProps}
          />
        );
      case 'RECT_H':
        return (
          <rect 
            x={x} 
            y={y + modHeight * 0.2} 
            width={modWidth} 
            height={modHeight * 0.6} 
            rx={4} 
            {...sharedProps} 
          />
        );
      case 'RECT_V':
      default:
        return (
          <rect 
            x={x} 
            y={y} 
            width={modWidth} 
            height={modHeight} 
            rx={6} 
            {...sharedProps} 
          />
        );
    }
  };

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
            {/* Added a subtle glow filter for modern aesthetics */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur stdDeviation="2" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
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
                <g 
                    key={`${levelNum}-${moduleNum}`} 
                    className="group" 
                    onClick={() => module && onModuleClick(module)}
                >
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
      
      {/* Legend with modern styling */}
      <div className="flex flex-wrap justify-center gap-8 mt-4 p-4 bg-background/50 rounded-2xl border border-card-border">
        {(Object.keys(statusColors) as ModuleStatus[]).map(status => (
          <div key={status} className="flex items-center gap-3">
            <div 
                className="w-5 h-5 rounded-lg border-2 border-white shadow-md" 
                style={{ backgroundColor: statusColors[status] }} 
            />
            <span className="text-muted text-xs font-bold uppercase tracking-widest">
              {status === 'PENDING' ? 'Pendiente' : status === 'IN_PROGRESS' ? 'En Proceso' : 'Terminado'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
