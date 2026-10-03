import React from 'react';

interface WeaveLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showTitle?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export default function WeaveLogo({
  size = 'md',
  showTagline = true,
  showTitle = true,
  layout = 'horizontal',
  className = '',
}: WeaveLogoProps) {
  const heightClass =
    size === 'sm'
      ? 'h-8 max-w-[150px]'
      : size === 'xl'
      ? 'h-20 max-w-[320px]'
      : size === 'lg'
      ? 'h-14 max-w-[240px]'
      : 'h-11 max-w-[190px]';

  return (
    <div className={`inline-flex items-center justify-center group select-none ${className}`}>
      <img
        src="/weave-logo.png"
        alt="WEAVE - People. Tasks. Resources. Connected."
        className={`${heightClass} w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]`}
      />
    </div>
  );
}

