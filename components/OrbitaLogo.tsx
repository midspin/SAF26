import React from 'react';

interface OrbitaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showTitle?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export default function OrbitaLogo({
  size = 'md',
  showTagline = true,
  showTitle = true,
  layout = 'horizontal',
  className = '',
}: OrbitaLogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const isXl = size === 'xl';

  const shapeCircle = isSm
    ? 'w-3 h-3'
    : isXl
    ? 'w-7 h-7'
    : isLg
    ? 'w-5 h-5'
    : 'w-3.5 h-3.5';

  const shapeSquare = isSm
    ? 'w-3 h-3'
    : isXl
    ? 'w-7 h-7'
    : isLg
    ? 'w-5 h-5'
    : 'w-3.5 h-3.5';

  const shapeTriangleBorder = isSm
    ? 'border-l-[5px] border-r-[5px] border-b-[9px]'
    : isXl
    ? 'border-l-[12px] border-r-[12px] border-b-[22px]'
    : isLg
    ? 'border-l-[9px] border-r-[9px] border-b-[16px]'
    : 'border-l-[7px] border-r-[7px] border-b-[12px]';

  const titleSize = isSm ? 'text-base' : isXl ? 'text-3xl' : isLg ? 'text-2xl' : 'text-lg';
  const taglineSize = isSm
    ? 'text-[9px]'
    : isXl
    ? 'text-sm'
    : isLg
    ? 'text-xs'
    : 'text-[10px]';

  const isVertical = layout === 'vertical' || !showTitle;

  return (
    <div
      className={`flex ${
        isVertical ? 'flex-col items-center justify-center text-center gap-2.5' : 'items-center gap-3'
      } group select-none ${className}`}
    >
      {/* Animated Shapes Container (Circle, Triangle, Square) */}
      <div className={`flex items-center ${isXl ? 'gap-3.5' : 'gap-2'} shrink-0 relative justify-center`}>
        {/* 1. Purple Circle */}
        <div
          className={`${shapeCircle} bg-[#a855f7] rounded-full shadow-[0_0_12px_rgba(168,85,247,0.6)] animate-orbita-circle transition-transform duration-300 group-hover:scale-110`}
          title="Circle"
        />

        {/* 2. Orange Triangle */}
        <div
          className={`w-0 h-0 border-l-transparent border-r-transparent border-b-[#f97316] ${shapeTriangleBorder} drop-shadow-[0_0_12px_rgba(249,115,22,0.6)] animate-orbita-triangle transition-transform duration-300 group-hover:-translate-y-0.5`}
          title="Triangle"
        />

        {/* 3. Blue Square */}
        <div
          className={`${shapeSquare} bg-[#38bdf8] rounded-sm shadow-[0_0_12px_rgba(56,189,248,0.6)] animate-orbita-square transition-transform duration-300 group-hover:rotate-12`}
          title="Square"
        />
      </div>

      {/* Brand Name & Tagline */}
      {(showTitle || showTagline) && (
        <div className={`flex flex-col ${isVertical ? 'items-center justify-center' : 'justify-center'}`}>
          {showTitle && (
            <h1 className={`font-black text-white ${titleSize} leading-none tracking-wider flex items-center gap-1.5`}>
              ORBITA
            </h1>
          )}
          {showTagline && (
            <p className={`${taglineSize} text-[#8a8d9b] font-medium tracking-tight ${showTitle ? 'mt-1' : ''} leading-tight text-center`}>
              Connecting people, Tasks and Resources
            </p>
          )}
        </div>
      )}
    </div>
  );
}
